"""Hover docs for the editor: the function or class under the cursor, described by its own signature and docstring.

NumPy, pandas and the standard library are introspected live. The libraries Orbit shims are described from
official_docs.json, a snapshot of the real packages (rebuild it with scripts/official_docs.py).
"""
import ast
import functools
import importlib.metadata
import inspect
import json
import pkgutil
import re
import sys
import warnings

import orbit_runtime

SITE = "/orbit_site"
# the tooltip answers "what does it take": everything after the parameters is cut
_AFTER_PARAMS = re.compile(
    r"^[ \t]*(?:"
    r"(?:Returns?|Yields?|Raises?|Examples?|See Also|References?|Attributes):[ \t]*$"  # Google style
    r"|(?:Returns|Yields|Raises|See Also|Notes|References|Examples|Attributes|Methods|Warns|Warnings|Other Parameters)[ \t]*\n[ \t]*-{3,}"  # numpydoc
    r"|:(?:returns?|rtype|raises?)\b|\.\. (?:code-block|testcode)::"  # Sphinx
    r"|(?:!!!|\?\?\?\+?) example"  # mkdocs
    r")",
    re.M,
)
_WORD = re.compile(r"\w*")
_CHAIN = re.compile(r"(\.\s*)?((?:[^\W\d]\w*\s*\.\s*)*[^\W\d]\w*)$")


def trim(doc):
    doc = re.sub(r":[\w:]+:`~?([^`<]+?)`", r"\1", doc or "")  # :class:`~pyspark.sql.Column` -> pyspark.sql.Column
    m = _AFTER_PARAMS.search(doc)
    return (doc[: m.start()] if m else doc).strip()


def _short(annotation):
    """pyspark.sql.column.Column | str -> Column | str, the way the docs sites print types."""
    if annotation is inspect.Signature.empty:
        return annotation
    text = inspect.formatannotation(annotation, quote_annotation_strings=False)
    return re.sub(r"\b(?:[^\W\d]\w*\.)+", "", re.sub(r"ForwardRef\('(.+?)'\)", r"\1", text))


@functools.cache
def _src(top):
    """Where a tooltip's text comes from; shown under it."""
    if top in sys.stdlib_module_names:
        return f"Python {sys.version_info.major}.{sys.version_info.minor}"
    if (getattr(sys.modules.get(top), "__file__", None) or "").startswith(SITE):
        return f"{top} · Orbit's offline stand-in"
    dist = importlib.metadata.packages_distributions().get(top)
    return f"{top} {importlib.metadata.version(dist[0])}" if dist else top


def describe(obj, name):
    """{sig, doc, src} for a callable, from its own signature and docstring. `name` is a dotted path that reaches it."""
    qual = getattr(obj, "__qualname__", None) or ""
    if not qual or "<" in qual:  # built by a factory: only the path names it
        qual = name.rpartition(".")[2]
    mod = getattr(obj, "__module__", None) or name
    title = ".".join(name.split(".")[-2:]) if "." in qual else qual  # a method: Class.method, as it was reached
    if "." not in qual and mod != "builtins":
        # the shortest module that exports it: numpy.linspace, not numpy._core.function_base.linspace
        parts = mod.split(".")
        homes = (parts[:i] for i in range(1, len(parts) + 1))
        home = next((h for h in homes if getattr(sys.modules.get(".".join(h)), qual, None) is obj), parts)
        title = ".".join([*home, qual])
    try:
        sig = inspect.signature(obj)
        params = [p.replace(annotation=_short(p.annotation)) for p in sig.parameters.values()]
        if params and params[0].name == "self":  # a method reached through its class
            del params[0]
        returns = inspect.Signature.empty if inspect.isclass(obj) else _short(sig.return_annotation)
        sig = sig.replace(parameters=params, return_annotation=returns)
        # one parameter per line once it would wrap more than once in the tooltip
        sig = sig.format(max_width=max(100 - len(title), 24), quote_annotation_strings=False)
    except (TypeError, ValueError):
        sig = "(...)"
    return {"sig": title + sig, "doc": trim(inspect.getdoc(obj)), "src": _src(mod.partition(".")[0])}


@functools.cache
def _official():
    with open(f"{SITE}/official_docs.json") as f:
        return json.load(f)


def _resolve(name):
    try:
        return pkgutil.resolve_name(name)
    except Exception:  # noqa: BLE001
        return None


def _last_value(name, code):
    """The value `name` had after the last run, if the statements that bound it are still in the editor unchanged."""
    ran = orbit_runtime.last_run["code"]
    try:
        tree = ast.parse(ran)
    except SyntaxError:
        return None
    bound = [
        ast.get_source_segment(ran, stmt)
        for stmt in tree.body
        if any(isinstance(n, ast.Name) and isinstance(n.ctx, ast.Store) and n.id == name for n in ast.walk(stmt))
    ]
    return orbit_runtime.last_run["ns"].get(name) if bound and all(b in code for b in bound) else None


def _live(script, code, line, col):
    """Jedi can't follow NumPy's C functions (`np.array`) or know what a variable holds (`arr.reshape`):
    resolve the dotted name against live objects instead. Roots are imports and top-level variables of the last run."""
    text = code.split("\n")[line - 1]
    m = _CHAIN.search(text, 0, _WORD.match(text, col).end())
    if not m or m[1]:  # hangs off a call or a literal: there is no live value for that
        return None, ""
    root, *attrs = re.split(r"\s*\.\s*", m[2])
    origin = script.goto(line, m.start(2))
    if not origin:
        return None, ""
    if origin[0].type == "statement" and origin[0].full_name == f"__main__.{root}":
        obj = _last_value(root, code)
        base = f"{type(obj).__module__}.{type(obj).__qualname__}"
    elif origin[0].module_name != "__main__" or origin[0].type == "module":
        obj, base = _resolve(origin[0].full_name), origin[0].full_name
    else:  # a parameter or a local: nothing live to ask
        return None, ""
    try:
        for attr in attrs:
            obj = getattr(obj, attr)
    except Exception:  # noqa: BLE001
        return None, ""
    return obj, ".".join([base, *attrs])


def _doc(code, line, col):
    import jedi  # loaded on the first hover, not at boot

    script = jedi.Script(code, environment=jedi.InterpreterEnvironment())
    try:
        found = script.goto(line, col, follow_imports=True)
    except Exception:  # noqa: BLE001  Jedi gives up on some pandas generics
        found = []
    if found and found[0].module_name == "__main__":  # defined in the editor: only the source knows it
        sigs = found[0].get_signatures() if found[0].type in ("function", "class") else []
        return {"sig": sigs[0].to_string(), "doc": trim(found[0].docstring(raw=True)), "src": "defined in this code"} if sigs else None
    obj, name = (_resolve(found[0].full_name), found[0].full_name) if found else _live(script, code, line, col)
    if not callable(obj) or type(obj).__module__ == "typing":  # typing's special forms are callable but take nothing
        return None
    hit = _official().get(name) or _official().get(f"{getattr(obj, '__module__', '')}.{getattr(obj, '__qualname__', '')}")
    return {**hit, "src": f"{hit['src']} · Orbit runs an offline stand-in"} if hit else describe(obj, name)


def hover(code, line, col):
    """JSON {sig, doc, src} for the function or class at (1-based line, 0-based col), or None."""
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")  # Jedi warns about the NumPy modules it can't import
        doc = _doc(code, line, col)
    return doc and json.dumps(doc)
