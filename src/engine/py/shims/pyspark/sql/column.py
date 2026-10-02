import operator

import numpy as np
import pandas as pd

from pyspark.errors import AnalysisException

_NULLABLE = {"=", "!=", "<", "<=", ">", ">=", "AND", "OR"}
_CASTS = {"int": "Int64", "integer": "Int64", "long": "Int64", "bigint": "Int64", "double": "float64", "float": "float64", "boolean": "boolean"}


def _ev(x, pdf):
    return x._eval(pdf) if isinstance(x, Column) else x


def _nm(x):
    return x._name if isinstance(x, Column) else (f"'{x}'" if isinstance(x, str) else str(x))


class Column:
    def __init__(self, fn, name):
        self._fn, self._name = fn, name

    def _eval(self, pdf):
        return self._fn(pdf)

    def _bin(self, other, op, sym, swap=False):
        a, b = (other, self) if swap else (self, other)

        def f(pdf):
            x, y = _ev(a, pdf), _ev(b, pdf)
            res = op(x, y)
            if sym in _NULLABLE and isinstance(res, pd.Series):
                # SQL three-valued logic: comparing with NULL yields NULL (not True/False)
                nulls = pd.Series(False, index=res.index)
                for v in (x, y):
                    if isinstance(v, pd.Series):
                        nulls = nulls | v.isna()
                res = res.astype("boolean").mask(nulls, pd.NA)
            return res

        return Column(f, f"({_nm(a)} {sym} {_nm(b)})")

    __add__ = lambda s, o: s._bin(o, operator.add, "+")
    __radd__ = lambda s, o: s._bin(o, operator.add, "+", True)
    __sub__ = lambda s, o: s._bin(o, operator.sub, "-")
    __rsub__ = lambda s, o: s._bin(o, operator.sub, "-", True)
    __mul__ = lambda s, o: s._bin(o, operator.mul, "*")
    __rmul__ = lambda s, o: s._bin(o, operator.mul, "*", True)
    __truediv__ = lambda s, o: s._bin(o, operator.truediv, "/")
    __rtruediv__ = lambda s, o: s._bin(o, operator.truediv, "/", True)
    __mod__ = lambda s, o: s._bin(o, operator.mod, "%")
    __eq__ = lambda s, o: s._bin(o, operator.eq, "=")
    __ne__ = lambda s, o: s._bin(o, operator.ne, "!=")
    __lt__ = lambda s, o: s._bin(o, operator.lt, "<")
    __le__ = lambda s, o: s._bin(o, operator.le, "<=")
    __gt__ = lambda s, o: s._bin(o, operator.gt, ">")
    __ge__ = lambda s, o: s._bin(o, operator.ge, ">=")
    __and__ = lambda s, o: s._bin(o, lambda a, b: a.astype("boolean") & b.astype("boolean") if isinstance(a, pd.Series) and isinstance(b, pd.Series) else operator.and_(a, b), "AND")
    __or__ = lambda s, o: s._bin(o, lambda a, b: a.astype("boolean") | b.astype("boolean") if isinstance(a, pd.Series) and isinstance(b, pd.Series) else operator.or_(a, b), "OR")
    __hash__ = object.__hash__

    def __bool__(self):
        raise ValueError("Cannot convert column into bool: please use '&' for 'and', '|' for 'or', '~' for 'not' when building DataFrame boolean expressions.")

    def __invert__(self):
        return Column(lambda pdf: ~_ev(self, pdf), f"(NOT {self._name})")

    def alias(self, name):
        return Column(self._fn, name)

    name = alias

    def cast(self, dtype):
        d = dtype if isinstance(dtype, str) else getattr(dtype, "name", "string")
        d = d.lower()

        def f(pdf):
            s = self._eval(pdf)
            if d == "string":
                return s.astype("str").where(s.notna(), None) if hasattr(s, "notna") else s
            if d in ("int", "integer", "long", "bigint"):
                return pd.to_numeric(s, errors="coerce").round(0).astype("Int64") if not pd.api.types.is_integer_dtype(s) else s.astype("Int64")
            return pd.to_numeric(s, errors="coerce").astype(_CASTS[d]) if d != "boolean" else s.astype("boolean")

        return Column(f, f"CAST({self._name} AS {d.upper()})")

    astype = cast

    def isNull(self):
        return Column(lambda pdf: self._eval(pdf).isna(), f"({self._name} IS NULL)")

    def isNotNull(self):
        return Column(lambda pdf: self._eval(pdf).notna(), f"({self._name} IS NOT NULL)")

    def isin(self, *vals):
        flat = list(vals[0]) if len(vals) == 1 and isinstance(vals[0], (list, tuple, set)) else list(vals)
        return Column(lambda pdf: self._eval(pdf).isin(flat), f"({self._name} IN ({', '.join(map(str, flat))}))")

    def between(self, lo, hi):
        return Column(lambda pdf: self._eval(pdf).between(lo, hi), f"(({self._name} >= {lo}) AND ({self._name} <= {hi}))")

    def contains(self, s):
        return Column(lambda pdf: self._eval(pdf).astype("str").str.contains(str(s), regex=False), f"contains({self._name}, {s})")

    def startswith(self, s):
        return Column(lambda pdf: self._eval(pdf).astype("str").str.startswith(str(s)), f"startswith({self._name}, {s})")

    def endswith(self, s):
        return Column(lambda pdf: self._eval(pdf).astype("str").str.endswith(str(s)), f"endswith({self._name}, {s})")

    def like(self, pattern):
        import re
        rx = "^" + re.escape(pattern).replace("%", ".*").replace("_", ".") + "$"
        return Column(lambda pdf: self._eval(pdf).astype("str").str.match(rx), f"{self._name} LIKE {pattern}")

    def asc(self):
        return SortColumn(self._fn, self._name, False)

    def desc(self):
        return SortColumn(self._fn, self._name, True)

    def when(self, *a):
        raise AnalysisException("when() can only be applied on a Column previously generated by when() function")

    def otherwise(self, v):
        raise AnalysisException("otherwise() can only be applied on a Column previously generated by when() function")

    def __repr__(self):
        return f"Column<'{self._name}'>"


class SortColumn(Column):
    def __init__(self, fn, name, desc):
        super().__init__(fn, name)
        self._desc = desc


class _Probe:
    active = None


class AggColumn(Column):
    """An aggregate like F.sum("x"). May be wrapped in expressions, e.g. F.round(F.sum("x"), 2)."""

    def __init__(self, func, inp, name):
        super().__init__(self._lookup, name)
        self._func, self._input = func, inp
        self._key = f"__agg_{id(self)}"

    def _lookup(self, pdf):
        if _Probe.active is not None:
            _Probe.active.append(self)
            return pd.Series([1.0])
        if self._key not in pdf.columns:
            raise AnalysisException(f"[INVALID_AGG] `{self._name}` is an aggregate; use it inside groupBy(...).agg(...) or df.agg(...)")
        return pdf[self._key]

    def alias(self, name):
        return _Aliased(self, name)

    name = alias


class _Aliased(AggColumn):
    def __init__(self, base, name):
        Column.__init__(self, base._fn, name)
        self._func, self._input, self._key = base._func, base._input, base._key
        self._base = base


class WhenColumn(Column):
    def __init__(self, branches, default=None, has_default=False):
        self._branches, self._default, self._has_default = branches, default, has_default
        super().__init__(self._compute, "CASE WHEN " + " ".join(f"{_nm(c)} THEN {_nm(v)}" for c, v in branches) + (f" ELSE {_nm(default)}" if has_default else "") + " END")

    def _compute(self, pdf):
        conds = [_ev(c, pdf) for c, _ in self._branches]
        vals = [_ev(v, pdf) for _, v in self._branches]
        n = len(pdf)
        vals = [v if isinstance(v, pd.Series) else pd.Series([v] * n, index=pdf.index) for v in vals]
        default = _ev(self._default, pdf) if self._has_default else None
        out = pd.Series([default] * n, index=pdf.index, dtype=object) if not isinstance(default, pd.Series) else default.astype(object)
        for c, v in reversed(list(zip(conds, vals))):
            out = v.astype(object).where(c.fillna(False).astype(bool), out)
        try:
            return out.infer_objects()
        except Exception:  # noqa: BLE001
            return out

    def when(self, cond, value):
        return WhenColumn(self._branches + [(cond, value)], self._default, self._has_default)

    def otherwise(self, value):
        return WhenColumn(self._branches, value, True)
