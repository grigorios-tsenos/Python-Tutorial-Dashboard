import numpy as np
import pandas as pd

from pyspark.errors import AnalysisException
from .column import AggColumn, Column, WhenColumn, _ev, _nm


def col(name):
    def f(pdf):
        if name not in pdf.columns:
            avail = ", ".join(f"`{c}`" for c in pdf.columns)
            raise AnalysisException(f"[UNRESOLVED_COLUMN.WITH_SUGGESTION] A column, variable, or function parameter with name `{name}` cannot be resolved. Did you mean one of the following? [{avail}].")
        return pdf[name]

    return Column(f, name)


column = col


def lit(v):
    return Column(lambda pdf: pd.Series([v] * len(pdf), index=pdf.index), str(v))


def _c(x):
    return col(x) if isinstance(x, str) else x


def _agg(fn_name, pandas_fn):
    def make(c):
        c = _c(c)
        return AggColumn(pandas_fn, c, f"{fn_name}({c._name})")

    return make


sum = _agg("sum", "sum")  # noqa: A001
avg = _agg("avg", "mean")
mean = avg
min = _agg("min", "min")  # noqa: A001
max = _agg("max", "max")  # noqa: A001


def count(c):
    if isinstance(c, str) and c == "*":
        return AggColumn("size", None, "count(1)")
    c = _c(c)
    return AggColumn("count", c, f"count({c._name})")


def countDistinct(c, *more):
    c = _c(c)
    return AggColumn("nunique", c, f"count(DISTINCT {c._name})")


count_distinct = countDistinct


def _fn1(name, f):
    def make(c):
        c = _c(c)
        return Column(lambda pdf: f(c._eval(pdf)), f"{name}({c._name})")

    return make


upper = _fn1("upper", lambda s: s.astype("str").str.upper())
lower = _fn1("lower", lambda s: s.astype("str").str.lower())
trim = _fn1("trim", lambda s: s.astype("str").str.strip())
length = _fn1("length", lambda s: s.astype("str").str.len())
abs = _fn1("abs", lambda s: s.abs())  # noqa: A001
sqrt = _fn1("sqrt", lambda s: np.sqrt(s))


def round(c, scale=0):  # noqa: A001
    c = _c(c)
    return Column(lambda pdf: c._eval(pdf).round(scale), f"round({c._name}, {scale})")


def concat(*cols):
    cs = [_c(c) for c in cols]
    return Column(lambda pdf: __import__("functools").reduce(lambda a, b: a + b, [x._eval(pdf).astype("str") for x in cs]), f"concat({', '.join(c._name for c in cs)})")


def concat_ws(sep, *cols):
    cs = [_c(c) for c in cols]

    def f(pdf):
        out = cs[0]._eval(pdf).astype("str")
        for x in cs[1:]:
            out = out + sep + x._eval(pdf).astype("str")
        return out

    return Column(f, f"concat_ws({sep}, {', '.join(c._name for c in cs)})")


def coalesce(*cols):
    cs = [_c(c) for c in cols]

    def f(pdf):
        out = cs[0]._eval(pdf)
        for x in cs[1:]:
            out = out.where(out.notna(), _ev(x, pdf))
        return out

    return Column(f, f"coalesce({', '.join(c._name for c in cs)})")


def when(cond, value):
    return WhenColumn([(cond, value)])


def desc(name):
    return _c(name).desc()


def asc(name):
    return _c(name).asc()
