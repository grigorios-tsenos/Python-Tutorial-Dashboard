import ast, asyncio, base64, contextlib, inspect, io, json, linecache, os, sys, time, traceback, warnings

import orbit

SITE = "/orbit_site"
# matplotlib runs headless inside the worker: figures are captured as PNGs after each run
os.environ.setdefault("MPLBACKEND", "Agg")
warnings.filterwarnings("ignore", message=".*non-interactive.*cannot be shown.*")
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


def _make_test(results, step=None):
    def test(label, fn, hint=None):
        try:
            ok = fn() if callable(fn) else fn
            if ok is None:
                ok = True
            ok = bool(ok)
            msg = "" if ok else (hint or "returned a falsy value")
        except Exception as e:  # noqa: BLE001
            ok, msg = False, f"{type(e).__name__}: {e}"
        r = {"label": label, "ok": ok, "msg": msg}
        if step is not None:
            r["step"] = step
        results.append(r)

    return test


def _capture_figures():
    """Every open matplotlib figure becomes a PNG emit, then is closed so runs don't accumulate."""
    plt = sys.modules.get("matplotlib.pyplot")
    if plt is None:
        return
    for num in plt.get_fignums():
        fig = plt.figure(num)
        buf = io.BytesIO()
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            fig.savefig(buf, format="png", dpi=96, bbox_inches="tight", facecolor="white")
        title = fig._suptitle.get_text() if getattr(fig, "_suptitle", None) else " / ".join(a.get_title() for a in fig.axes if a.get_title())
        orbit.emit("figure", {"png": base64.b64encode(buf.getvalue()).decode("ascii"), "alt": title or f"figure {num}"})
    plt.close("all")


async def _run_check(check, ns, tests, step=None):
    ns["test"] = _make_test(tests, step)
    try:
        await _exec(check, ns, "<check>")
    except BaseException as e:  # noqa: BLE001
        r = {"label": "check script", "ok": False, "msg": _format_error(e, "<check>")}
        if step is not None:
            r["step"] = step
        tests.append(r)


async def orbit_run(code, check=None, checks_json=None):
    """Run the learner's cell, then each step check (tagged by index) and the final check."""
    t0 = time.time()
    checks = json.loads(checks_json) if checks_json else []
    _purge_modules()
    orbit._reset()
    plt = sys.modules.get("matplotlib.pyplot")
    if plt is not None:
        plt.close("all")   # figures a previous check left open must not surface in this run
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
            _capture_figures()
        except BaseException as e:  # noqa: BLE001
            if isinstance(e, (KeyboardInterrupt, SystemExit)) and not isinstance(e, SystemExit):
                raise
            error = _format_error(e, "<cell>")
        if error is None and (check or checks):
            ns["__stdout__"] = out.getvalue()
            ns["__source__"] = code
            for i, c in enumerate(checks):
                await _run_check(c, ns, tests, i)
            if check:
                await _run_check(check, ns, tests)
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
