import ast, asyncio, contextlib, inspect, io, json, linecache, sys, time, traceback

import orbit

SITE = "/orbit_site"
USER_FILES = ("<cell>", "<check>")
FLAGS = ast.PyCF_ALLOW_TOP_LEVEL_AWAIT


def _purge_modules():
    for name, mod in list(sys.modules.items()):
        f = getattr(mod, "__file__", None) or ""
        if f.startswith(SITE) and name not in ("orbit", "orbit_runtime"):
            del sys.modules[name]


def _format_error(e, source_name):
    if isinstance(e, SyntaxError):
        if e.filename in USER_FILES or e.filename is None:
            return "".join(traceback.format_exception_only(type(e), e)).rstrip()
    frames = [f for f in traceback.extract_tb(e.__traceback__) if f.filename in USER_FILES]
    out = []
    if frames:
        out.append("Traceback (most recent call last):")
        for f in frames:
            out.append(f'  line {f.lineno}, in {f.name}')
            if f.line:
                out.append(f"    {f.line}")
    out.append("".join(traceback.format_exception_only(type(e), e)).rstrip())
    return "\n".join(out)


def _html_for(value):
    try:
        import pandas as pd

        if isinstance(value, pd.DataFrame):
            return value.to_html(max_rows=30, max_cols=14, classes="df", border=0)
    except ImportError:
        pass
    return None


async def _exec(code, ns, filename):
    linecache.cache[filename] = (len(code), None, code.splitlines(True), filename)
    tree = ast.parse(code, filename)
    last = None
    if tree.body and isinstance(tree.body[-1], ast.Expr):
        last = ast.Expression(tree.body.pop().value)
        ast.fix_missing_locations(last)
    mod = ast.Module(tree.body, type_ignores=[])
    co = compile(mod, filename, "exec", flags=FLAGS)
    r = eval(co, ns)
    if inspect.iscoroutine(r):
        await r
    if last is not None:
        co2 = compile(last, filename, "eval", flags=FLAGS)
        v = eval(co2, ns)
        if inspect.isawaitable(v):
            v = await v
        return v
    return None


def _make_test(results):
    def test(label, fn, hint=None):
        try:
            ok = fn() if callable(fn) else fn
            if ok is None:
                ok = True
            ok = bool(ok)
            msg = "" if ok else (hint or "returned a falsy value")
        except Exception as e:  # noqa: BLE001
            ok, msg = False, f"{type(e).__name__}: {e}"
        results.append({"label": label, "ok": ok, "msg": msg})

    return test


async def orbit_run(code, check=None):
    t0 = time.time()
    _purge_modules()
    orbit._reset()
    out, err = io.StringIO(), io.StringIO()
    html_blocks = []
    tests = []
    ns = {"__name__": "__main__"}

    def display(*objs):
        for o in objs:
            h = _html_for(o) or (o._orbit_html() if hasattr(o, "_orbit_html") else None)
            if h:
                html_blocks.append(h)
            else:
                print(repr(o) if not isinstance(o, str) else o)

    ns["display"] = display
    import builtins
    builtins.display = display
    error = None
    result = None
    with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
        try:
            value = await _exec(code, ns, "<cell>")
            if value is not None:
                h = _html_for(value)
                if h:
                    html_blocks.append(h)
                else:
                    result = repr(value)
            orbit._run_finalizers()
        except BaseException as e:  # noqa: BLE001
            if isinstance(e, (KeyboardInterrupt, SystemExit)) and not isinstance(e, SystemExit):
                raise
            error = _format_error(e, "<cell>")
        if error is None and check:
            ns["test"] = _make_test(tests)
            ns["__stdout__"] = out.getvalue()
            try:
                await _exec(check, ns, "<check>")
            except BaseException as e:  # noqa: BLE001
                tests.append({"label": "check script", "ok": False, "msg": _format_error(e, "<check>")})
    return json.dumps(
        {
            "ok": error is None,
            "stdout": out.getvalue() + err.getvalue(),
            "error": error,
            "result": result,
            "html": html_blocks,
            "emits": orbit._emits,
            "tests": tests,
            "ms": round((time.time() - t0) * 1000),
        },
        default=str,
    )
