"""Orbit bridge: lets Python code send rich payloads to the dashboard UI."""

_emits = []
_finalizers = []


def emit(kind, data):
    _emits.append({"kind": kind, "data": data})


def on_finish(fn):
    if fn not in _finalizers:
        _finalizers.append(fn)


def _reset():
    _emits.clear()
    _finalizers.clear()


def _run_finalizers():
    for fn in list(_finalizers):
        fn()


def _fmt(x):
    try:
        f = float(x)
    except (TypeError, ValueError):
        return str(x)
    return str(int(f)) if f == int(f) else f"{f:.3g}"


def show_broadcast(a, b, op="+"):
    """Visualise NumPy broadcasting of two arrays in the Broadcast Lab (op: + - *)."""
    import numpy as np

    a = np.asarray(a)
    b = np.asarray(b)
    payload = {"a_shape": list(a.shape), "b_shape": list(b.shape)}
    try:
        shape = np.broadcast_shapes(a.shape, b.shape)
    except ValueError as e:
        payload["error"] = str(e)
        emit("broadcast", payload)
        return None
    out = {"+": np.add, "-": np.subtract, "*": np.multiply}[op](a, b)
    payload["op"] = op
    payload["out_shape"] = list(shape)

    def grid(x):
        x2 = np.atleast_2d(x)
        if x2.ndim > 2:
            return None
        return [[_fmt(v) for v in row] for row in x2.tolist()]

    payload["a"], payload["b"], payload["out"] = grid(a), grid(b), grid(out)
    emit("broadcast", payload)
    return out
