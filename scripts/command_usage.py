"""Which library commands each piece of lesson code uses, found by running it.

Every name and attribute the learner's code reads is wrapped in a recorder, the
lesson runs end to end, and each recorded command is credited to the step whose
source contains it. A command is keyed by the way it is reached:

- a module function or class by its import path:   numpy.isnan, pandas.read_csv
- a method or attribute by its defining class:     numpy.ndarray.reshape, pandas.NDFrame.head
- a builtin by name:                                builtins.sorted, builtins.str.join

Objects the lesson defines itself (functions, classes, variables) are skipped.
Loaded into Pyodide by tests/commands.test.ts; the result is
src/content/commands/usage.json.
"""
import ast, builtins, contextlib, inspect, io, json, sys, types

FLAGS = ast.PyCF_ALLOW_TOP_LEVEL_AWAIT
_BUILTINS = vars(builtins)


# modules whose __name__ differs from the path lessons import them by
_MODULE_ALIASES = {"_sha2": "hashlib", "_hashlib": "hashlib"}


def _public(module_name):
    return _MODULE_ALIASES.get(module_name, (module_name or "").split(".")[0])


def _owner_key(cls, attr, metaclass=None):
    """Key for an attribute found on a class: the class that defines it, under its top-level package."""
    for base in (*cls.__mro__, *(metaclass.__mro__ if metaclass else ())):
        if attr in vars(base):
            cls = base
            break
    module = getattr(cls, "__module__", None)
    if module in (None, "__main__") or module.startswith("_orbit"):
        return None
    return f"{_public(module)}.{cls.__qualname__}.{attr}"


class _Tracker:
    def __init__(self, imports):
        self.imports = imports        # local name -> import path, from the lesson's import statements
        self.used = {}                 # site -> set of keys
        self.seen = set()

    def name_key(self, name, value):
        if isinstance(value, types.ModuleType):
            return None
        if name in self.imports:
            return self.imports[name]
        if _BUILTINS.get(name, _MISSING) is value:
            return f"builtins.{name}"
        return None

    def attr_key(self, obj, attr, value):
        if isinstance(value, types.ModuleType):
            return None
        if isinstance(obj, types.ModuleType):
            if obj.__name__ == "__main__":
                return None
            return f"{_MODULE_ALIASES.get(obj.__name__, obj.__name__)}.{attr}"
        if getattr(obj, "__module__", None) == "__main__" and not isinstance(obj, type):
            return None   # attributes of a function the lesson defined
        if isinstance(obj, type):
            if obj.__module__ == "__main__":
                return None
            return _owner_key(obj, attr, metaclass=type(obj))
        if getattr(type(obj), "__module__", None) == "__main__":
            return None
        return _owner_key(type(obj), attr)

    def record(self, site, key):
        if key:
            self.used.setdefault(site, set()).add(key)
        self.seen.add(site)


_MISSING = object()


class _Rewrite(ast.NodeTransformer):
    """X.attr -> __orbit_attr__(X, 'attr', site) and name -> __orbit_name__(name, 'name', site) for every read."""

    def __init__(self, step):
        self.step = step
        self.sites = {}

    def _site(self, node, label):
        site = f"{self.step}:{len(self.sites)}"
        self.sites[site] = (node.lineno, label)
        return site

    def visit_Attribute(self, node):
        label = ast.unparse(node)
        self.generic_visit(node)
        if not isinstance(node.ctx, ast.Load):
            return node
        site = self._site(node, label)
        call = ast.Call(ast.Name("__orbit_attr__", ast.Load()), [node.value, ast.Constant(node.attr), ast.Constant(site)], [])
        return ast.copy_location(call, node)

    def visit_Name(self, node):
        if not isinstance(node.ctx, ast.Load) or node.id.startswith("__orbit"):
            return node
        site = self._site(node, node.id)
        call = ast.Call(ast.Name("__orbit_name__", ast.Load()), [ast.Name(node.id, ast.Load()), ast.Constant(node.id), ast.Constant(site)], [])
        return ast.copy_location(call, node)


def _imports(sources):
    found = {}
    for src in sources:
        try:
            tree = ast.parse(src)
        except SyntaxError:
            continue
        for node in ast.walk(tree):
            if isinstance(node, ast.ImportFrom) and node.module and not node.level:
                for alias in node.names:
                    found[alias.asname or alias.name] = f"{node.module}.{alias.name}"
    return found


def _quiet_test(label, fn, hint=None):
    try:
        return fn() if callable(fn) else fn
    except Exception:  # noqa: BLE001  (a check failing here is the guided tests' business)
        return False


async def _run(tree, ns, filename):
    code = compile(tree, filename, "exec", flags=FLAGS)
    result = eval(code, ns)
    if inspect.iscoroutine(result):
        await result


def _static_key(tracker, label, ns):
    """Resolve a site that never ran (a branch not taken) from the final namespace: name(.attr)* only."""
    try:
        node = ast.parse(label, mode="eval").body
    except SyntaxError:
        return None
    chain = []
    while isinstance(node, ast.Attribute):
        chain.append(node.attr)
        node = node.value
    if not isinstance(node, ast.Name):
        return None
    value = ns.get(node.id, _BUILTINS.get(node.id, _MISSING))
    if value is _MISSING:
        return None
    key = tracker.name_key(node.id, value)
    for attr in reversed(chain):
        try:
            nxt = getattr(value, attr)
        except Exception:  # noqa: BLE001
            return None
        key = tracker.attr_key(value, attr, nxt)
        value = nxt
    return key


async def usage(setup, steps, checks, final_check=""):
    """Keys used by each step's code, plus the reads that could not be resolved.

    Each step's own check runs right after it, so a function the next step redefines is still exercised.
    """
    tracker = _Tracker(_imports([setup, *steps]))

    def orbit_attr(obj, attr, site):
        value = getattr(obj, attr)
        tracker.record(site, tracker.attr_key(obj, attr, value))
        return value

    def orbit_name(value, name, site):
        tracker.record(site, tracker.name_key(name, value))
        return value

    ns = {"__name__": "__main__", "__orbit_attr__": orbit_attr, "__orbit_name__": orbit_name}
    sites = {}
    out = io.StringIO()
    error = None
    with contextlib.redirect_stdout(out), contextlib.redirect_stderr(io.StringIO()):
        try:
            if setup.strip():
                await _run(ast.parse(setup), ns, "<setup>")
            for index, src in enumerate(steps):
                rewrite = _Rewrite(index)
                tree = ast.fix_missing_locations(rewrite.visit(ast.parse(src)))
                sites.update(rewrite.sites)
                await _run(tree, ns, f"<step{index}>")
                last = index == len(steps) - 1
                check = "\n".join(c for c in (checks[index] if index < len(checks) else "", final_check if last else "") if c)
                if check.strip():
                    ns["__stdout__"] = out.getvalue()
                    ns["__source__"] = "\n".join([setup, *steps[: index + 1]])
                    ns["test"] = _quiet_test
                    await _run(ast.parse(check), ns, "<check>")
        except Exception as e:  # noqa: BLE001
            error = f"{type(e).__name__}: {e}"
        finally:
            plt = sys.modules.get("matplotlib.pyplot")
            if plt is not None:
                plt.close("all")
    per_line = [{} for _ in steps]
    unresolved = []
    for site, (line, label) in sites.items():
        step = int(site.split(":")[0])
        keys = tracker.used.get(site, set()) if site in tracker.seen else {_static_key(tracker, label, ns)} - {None}
        if not keys and site not in tracker.seen and "." in label:
            unresolved.append(f"step {step + 1} line {line}: {label}")
        per_line[step].setdefault(line, {}).update(dict.fromkeys(sorted(keys)))   # dicts keep source order
    in_order = lambda lines: list(dict.fromkeys(k for _, keys in sorted(lines.items()) for k in keys))
    return json.dumps({
        "steps": [in_order(lines) for lines in per_line],
        "lines": [{line: list(keys) for line, keys in sorted(lines.items()) if keys} for lines in per_line],
        "unresolved": sorted(set(unresolved)),
        "error": error,
    })
