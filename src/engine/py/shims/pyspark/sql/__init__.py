import re
import sqlite3

import numpy as np
import pandas as pd

from pyspark.errors import AnalysisException, PySparkTypeError
from . import functions as _functions  # noqa: F401
from .column import Column, SortColumn, AggColumn  # noqa: F401
from .types import StructType, StructField, parse_ddl

_views = {}
_tables = {}   # name -> list[{"pdf","op","ts","version"}]
_paths = {}


def _py(v):
    if v is None or v is pd.NA:
        return None
    if isinstance(v, float) and v != v:
        return None
    if hasattr(v, "item") and not isinstance(v, (str, bytes)):
        try:
            return v.item()
        except Exception:  # noqa: BLE001
            return v
    return v


class Row(tuple):
    def __new__(cls, *args, **kwargs):
        if kwargs:
            self = tuple.__new__(cls, kwargs.values())
            self.__fields__ = list(kwargs)
            return self
        self = tuple.__new__(cls, args)
        self.__fields__ = []
        return self

    def asDict(self, recursive=False):
        return dict(zip(self.__fields__, self))

    def __getattr__(self, name):
        if name.startswith("__"):
            raise AttributeError(name)
        try:
            return self[self.__fields__.index(name)]
        except ValueError:
            raise AttributeError(name) from None

    def __getitem__(self, i):
        if isinstance(i, str):
            return tuple.__getitem__(self, self.__fields__.index(i))
        return tuple.__getitem__(self, i)

    def __repr__(self):
        if self.__fields__:
            return "Row(" + ", ".join(f"{k}={v!r}" for k, v in zip(self.__fields__, self)) + ")"
        return "<Row(" + ", ".join(repr(v) for v in self) + ")>"


def _sql_run(frames, query):
    """Run `query` over pandas frames using sqlite as a stand-in SQL engine."""
    conn = sqlite3.connect(":memory:")
    try:
        names = sorted(frames, key=len, reverse=True)
        for n in names:
            frames[n].to_sql(n.replace(".", "__").replace("-", "_"), conn, index=False)
        for n in names:
            if "." in n:
                query = re.sub(r"(?<![\w.])" + re.escape(n) + r"(?![\w.])", n.replace(".", "__").replace("-", "_"), query)
        try:
            return pd.read_sql_query(query, conn)
        except Exception as e:  # noqa: BLE001
            raise AnalysisException(f"[SQL_ERROR] {e}. Query: {query.strip()[:120]}") from None
    finally:
        conn.close()


def _spark_type(s):
    if pd.api.types.is_bool_dtype(s):
        return "boolean"
    if pd.api.types.is_integer_dtype(s):
        return "bigint"
    if pd.api.types.is_float_dtype(s):
        return "double"
    return "string"


def _cell(v, truncate):
    v = _py(v)
    if v is None:
        s = "NULL"
    elif isinstance(v, bool):
        s = "true" if v else "false"
    else:
        s = str(v)
    if truncate and truncate > 0 and len(s) > truncate:
        s = s[: max(truncate - 3, 0)] + "..."
    return s


class DataFrame:
    def __init__(self, pdf, spark=None):
        self._pdf = pdf.reset_index(drop=True)

    # --- introspection
    @property
    def columns(self):
        return [str(c) for c in self._pdf.columns]

    @property
    def dtypes(self):
        return [(c, _spark_type(self._pdf[c])) for c in self.columns]

    @property
    def schema(self):
        return StructType([StructField(c, t) for c, t in self.dtypes])

    def printSchema(self):
        print("root")
        for c, t in self.dtypes:
            print(f" |-- {c}: {'long' if t == 'bigint' else t} (nullable = true)")

    def count(self):
        return len(self._pdf)

    def collect(self):
        cols = self.columns
        return [Row(**{c: _py(v) for c, v in zip(cols, rec)}) for rec in self._pdf.itertuples(index=False, name=None)]

    def take(self, n):
        return self.limit(n).collect()

    def head(self, n=None):
        rows = self.take(n or 1)
        return rows[0] if n is None and rows else (None if n is None else rows)

    def first(self):
        return self.head()

    def toPandas(self):
        return self._pdf.copy()

    def show(self, n=20, truncate=True, vertical=False):
        t = 20 if truncate is True else (0 if truncate is False else int(truncate))
        data = self._pdf.head(n)
        cols = self.columns
        cells = [[_cell(v, t) for v in row] for row in data.itertuples(index=False, name=None)]
        widths = [max([len(c)] + [len(r[i]) for r in cells]) for i, c in enumerate(cols)]
        just = (lambda s, w: s.rjust(w)) if t else (lambda s, w: s.ljust(w))
        sep = "+" + "+".join("-" * w for w in widths) + "+"
        lines = [sep, "|" + "|".join(just(c, w) for c, w in zip(cols, widths)) + "|", sep]
        for r in cells:
            lines.append("|" + "|".join(just(v, w) for v, w in zip(r, widths)) + "|")
        lines.append(sep)
        if len(self._pdf) > n:
            lines.append(f"only showing top {n} rows")
        print("\n".join(lines))

    def _orbit_html(self):
        return self._pdf.to_html(max_rows=30, classes="df", border=0)

    def __repr__(self):
        return "DataFrame[" + ", ".join(f"{c}: {t}" for c, t in self.dtypes) + "]"

    # --- column access
    def __getitem__(self, item):
        if isinstance(item, str):
            return _functions.col(item)
        if isinstance(item, Column):
            return self.filter(item)
        return self.select(*item)

    def __getattr__(self, name):
        if name.startswith("_"):
            raise AttributeError(name)
        if name in self.columns:
            return _functions.col(name)
        raise AttributeError(f"'DataFrame' object has no attribute '{name}'")

    # --- transformations
    def select(self, *cols):
        flat = []
        for c in cols:
            flat.extend(c if isinstance(c, (list, tuple)) else [c])
        parts = []
        for c in flat:
            if isinstance(c, str):
                if c == "*":
                    parts.extend(self._pdf[x] for x in self._pdf.columns)
                    continue
                c = _functions.col(c)
            s = c._eval(self._pdf)
            if not isinstance(s, pd.Series):
                s = pd.Series([s] * len(self._pdf), index=self._pdf.index)
            parts.append(s.rename(c._name))
        if not parts:
            return DataFrame(pd.DataFrame(index=self._pdf.index))
        return DataFrame(pd.concat(parts, axis=1))

    def filter(self, condition):
        if isinstance(condition, str):
            res = _sql_run({"t": self._pdf}, f"SELECT * FROM t WHERE {condition}")
            return DataFrame(res)
        mask = condition._eval(self._pdf)
        return DataFrame(self._pdf[mask.fillna(False).astype(bool)])

    where = filter

    def withColumn(self, name, column):
        if not isinstance(column, Column):
            raise PySparkTypeError(f"[NOT_COLUMN] Argument `col` should be a Column, got {type(column).__name__}. Use pyspark.sql.functions.lit() for constants.")
        pdf = self._pdf.copy()
        s = column._eval(self._pdf)
        pdf[name] = s
        return DataFrame(pdf)

    def withColumnRenamed(self, existing, new):
        return DataFrame(self._pdf.rename(columns={existing: new}))

    def drop(self, *cols):
        return DataFrame(self._pdf.drop(columns=[c for c in cols if c in self._pdf.columns]))

    def distinct(self):
        return DataFrame(self._pdf.drop_duplicates())

    def dropDuplicates(self, subset=None):
        return DataFrame(self._pdf.drop_duplicates(subset=subset))

    def limit(self, n):
        return DataFrame(self._pdf.head(n))

    def orderBy(self, *cols, ascending=True):
        flat = []
        for c in cols:
            flat.extend(c if isinstance(c, (list, tuple)) else [c])
        keys, asc = {}, []
        for i, c in enumerate(flat):
            if isinstance(c, str):
                c = _functions.col(c)
            desc = isinstance(c, SortColumn) and c._desc
            keys[f"__k{i}"] = c._eval(self._pdf)
            asc.append(not desc if isinstance(c, SortColumn) else bool(ascending))
        tmp = self._pdf.assign(**keys).sort_values(list(keys), ascending=asc, kind="stable")
        return DataFrame(tmp.drop(columns=list(keys)))

    sort = orderBy

    def groupBy(self, *cols):
        flat = []
        for c in cols:
            flat.extend(c if isinstance(c, (list, tuple)) else [c])
        return GroupedData(self, flat)

    groupby = groupBy

    def agg(self, *aggs):
        return GroupedData(self, []).agg(*aggs)

    def join(self, other, on=None, how="inner"):
        how = {"leftouter": "left", "left_outer": "left", "rightouter": "right", "right_outer": "right",
               "full": "outer", "fullouter": "outer", "full_outer": "outer"}.get(how, how)
        if on is None or isinstance(on, Column):
            raise NotImplementedError("Orbit's mini Spark joins on column names: df1.join(df2, 'id') or df1.join(df2, ['a', 'b'], 'left').")
        keys = [on] if isinstance(on, str) else list(on)
        for k in keys:
            for side, df in (("left", self), ("right", other)):
                if k not in df.columns:
                    raise AnalysisException(f"[UNRESOLVED_USING_COLUMN_FOR_JOIN] USING column `{k}` cannot be resolved on the {side} side of the join.")
        if how == "left_semi":
            return DataFrame(self._pdf[self._pdf.set_index(keys).index.isin(other._pdf.set_index(keys).index)])
        if how == "left_anti":
            return DataFrame(self._pdf[~self._pdf.set_index(keys).index.isin(other._pdf.set_index(keys).index)])
        return DataFrame(self._pdf.merge(other._pdf, on=keys, how=how))

    def union(self, other):
        o = other._pdf.copy()
        o.columns = self._pdf.columns
        return DataFrame(pd.concat([self._pdf, o], ignore_index=True))

    unionAll = union

    def unionByName(self, other):
        return DataFrame(pd.concat([self._pdf, other._pdf[self._pdf.columns]], ignore_index=True))

    def fillna(self, value, subset=None):
        return DataFrame(self._pdf.fillna(value) if subset is None else self._pdf.fillna({c: value for c in subset}))

    def dropna(self, how="any", subset=None):
        return DataFrame(self._pdf.dropna(how=how, subset=subset))

    @property
    def na(self):
        outer = self

        class _Na:
            fill = staticmethod(outer.fillna)
            drop = staticmethod(outer.dropna)

        return _Na()

    def createOrReplaceTempView(self, name):
        _views[name] = self._pdf.copy()

    createTempView = createOrReplaceTempView

    def cache(self):
        return self

    persist = cache

    def display(self):
        import builtins
        builtins.display(self)

    @property
    def write(self):
        return DataFrameWriter(self)


class GroupedData:
    def __init__(self, df, keys):
        self.df, self.keys = df, keys

    def agg(self, *aggs):
        pdf = self.df._pdf
        if len(aggs) == 1 and isinstance(aggs[0], dict):
            aggs = tuple(getattr(_functions, {"mean": "avg"}.get(f, f))(c) for c, f in aggs[0].items())
        key_names, work = [], pdf.copy()
        for i, k in enumerate(self.keys):
            c = _functions.col(k) if isinstance(k, str) else k
            nm = c._name
            work[f"__key{i}"] = c._eval(pdf)
            key_names.append((f"__key{i}", nm))
        from .column import _Probe

        found, order = {}, []
        for a in aggs:
            hits = []
            _Probe.active = hits
            try:
                a._eval(pd.DataFrame({"__p": [0]}))
            except AnalysisException:
                hits = []
            finally:
                _Probe.active = None
            if not hits or not isinstance(a, Column):
                raise AnalysisException("[MISSING_AGGREGATION] The non-aggregating expression is based on columns which are not participating in the GROUP BY clause. Use an aggregate function such as F.sum(), F.avg() or F.count().")
            for h in hits:
                base = getattr(h, "_base", h)
                found.setdefault(h._key, base)
            order.append(a)
        specs = {}
        for i, (key, h) in enumerate(found.items()):
            tmp = f"__agg{i}"
            work[tmp] = 1 if h._input is None else h._input._eval(pdf)
            specs[key] = (tmp, h._func)
        if key_names:
            grouped = work.groupby([k for k, _ in key_names], sort=True, dropna=False).agg(**specs).reset_index()
            grouped = grouped.rename(columns=dict(key_names))
        else:
            work["__all"] = 0
            grouped = work.groupby("__all").agg(**specs).reset_index(drop=True)
        out = grouped[[nm for _, nm in key_names]].copy() if key_names else pd.DataFrame(index=grouped.index)
        for a in order:
            out[a._name] = a._eval(grouped)
        grouped = out
        return DataFrame(grouped)

    def count(self):
        return self.agg(_functions.count("*").alias("count"))

    def _simple(self, fn, cols):
        cols = cols or [c for c in self.df.columns if pd.api.types.is_numeric_dtype(self.df._pdf[c]) and c not in [k if isinstance(k, str) else k._name for k in self.keys]]
        return self.agg(*[getattr(_functions, fn)(c) for c in cols])

    def sum(self, *cols):
        return self._simple("sum", cols)

    def avg(self, *cols):
        return self._simple("avg", cols)

    mean = avg

    def min(self, *cols):
        return self._simple("min", cols)

    def max(self, *cols):
        return self._simple("max", cols)


def _record(name, pdf, op, store):
    versions = store.setdefault(name, [])
    import time
    versions.append({"pdf": pdf.reset_index(drop=True), "op": op, "ts": time.time(), "version": len(versions)})


class DataFrameWriter:
    def __init__(self, df):
        self.df, self._mode, self._format = df, "errorifexists", "delta"

    def format(self, fmt):
        self._format = fmt
        return self

    def mode(self, m):
        self._mode = m.lower()
        return self

    def option(self, *a, **k):
        return self

    def options(self, **k):
        return self

    def partitionBy(self, *cols):
        return self

    def _write(self, name, store, label):
        exists = name in store
        pdf = self.df._pdf
        if exists and self._mode in ("error", "errorifexists", "default"):
            raise AnalysisException(f"[TABLE_OR_VIEW_ALREADY_EXISTS] Cannot create table or view `{name}` because it already exists. Choose a different name, drop or replace the existing object, or use .mode('overwrite') / .mode('append').")
        if exists and self._mode == "ignore":
            return
        if exists and self._mode == "append":
            cur = store[name][-1]["pdf"]
            if list(cur.columns) != list(pdf.columns):
                raise AnalysisException(f"[DELTA_FAILED_TO_MERGE_FIELDS] Failed to merge schemas for `{name}`: expected columns {list(cur.columns)} but got {list(pdf.columns)}.")
            _record(name, pd.concat([cur, pdf], ignore_index=True), "WRITE", store)
        elif exists:
            _record(name, pdf, "WRITE", store)
        else:
            _record(name, pdf, "CREATE TABLE AS SELECT", store)

    def saveAsTable(self, name):
        self._write(name, _tables, "table")

    def save(self, path):
        self._write(path, _paths, "path")


class DataFrameReader:
    def __init__(self, spark):
        self.spark, self._opts = spark, {}

    def format(self, fmt):
        return self

    def option(self, k, v):
        self._opts[k] = v
        return self

    def _read(self, name, store):
        if name not in store:
            raise AnalysisException(f"[TABLE_OR_VIEW_NOT_FOUND] The table or view `{name}` cannot be found. Verify the spelling and correctness of the schema and catalog.")
        versions = store[name]
        v = self._opts.get("versionAsOf")
        if v is not None:
            v = int(v)
            if v < 0 or v >= len(versions):
                raise AnalysisException(f"[DELTA_VERSION_NOT_EXIST] Cannot time travel Delta table to version {v}. Available versions: [0, {len(versions) - 1}].")
            return DataFrame(versions[v]["pdf"])
        return DataFrame(versions[-1]["pdf"])

    def table(self, name):
        return self._read(name, _tables)

    def load(self, path):
        return self._read(path, _paths)


class _Builder:
    def appName(self, n):
        return self

    def master(self, m):
        return self

    def config(self, *a, **k):
        return self

    def enableHiveSupport(self):
        return self

    def getOrCreate(self):
        return SparkSession._instance or SparkSession()


class _BuilderDesc:
    def __get__(self, obj, cls):
        return _Builder()


class SparkSession:
    _instance = None
    builder = _BuilderDesc()
    version = "4.0.0-orbit"

    def __init__(self):
        SparkSession._instance = self

    @property
    def read(self):
        return DataFrameReader(self)

    def createDataFrame(self, data, schema=None):
        if isinstance(data, pd.DataFrame):
            return DataFrame(data.copy())
        names, types = None, None
        if isinstance(schema, str):
            schema = parse_ddl(schema)
        if isinstance(schema, StructType):
            names, types = schema.names, {f.name: f.dataType.pandas for f in schema.fields}
        elif isinstance(schema, (list, tuple)):
            names = list(schema)
        data = list(data)
        if data and isinstance(data[0], Row) and data[0].__fields__:
            names = names or data[0].__fields__
            pdf = pd.DataFrame([tuple(r) for r in data], columns=names)
        elif data and isinstance(data[0], dict):
            pdf = pd.DataFrame(data)
            if names:
                pdf = pdf[names]
        else:
            pdf = pd.DataFrame(data, columns=names)
        for c, t in (types or {}).items():
            if t != "object":
                pdf[c] = pdf[c].astype(t)
        return DataFrame(pdf)

    def range(self, start, end=None, step=1):
        if end is None:
            start, end = 0, start
        return DataFrame(pd.DataFrame({"id": np.arange(start, end, step, dtype="int64")}))

    def table(self, name):
        return self.read.table(name)

    def sql(self, query):
        q = query.strip().rstrip(";")
        m = re.match(r"^DESCRIBE\s+HISTORY\s+(\S+)$", q, re.I)
        if m:
            return _history(m.group(1))
        frames = {n: df for n, df in _views.items()}
        for n, versions in _tables.items():
            frames[n] = versions[-1]["pdf"]
        # time travel: <table> VERSION AS OF n
        def tt(match):
            name, v = match.group(1), int(match.group(2))
            if name not in _tables or v >= len(_tables[name]):
                raise AnalysisException(f"[DELTA_VERSION_NOT_EXIST] Cannot time travel Delta table `{name}` to version {v}.")
            alias = f"{name}__v{v}"
            frames[alias] = _tables[name][v]["pdf"]
            return alias

        q = re.sub(r"(\S+)\s+VERSION\s+AS\s+OF\s+(\d+)", tt, q, flags=re.I)
        used = {n: p for n, p in frames.items() if re.search(r"(?<![\w.])" + re.escape(n) + r"(?![\w.])", q)}
        if not used and re.match(r"^(select|with)\b", q, re.I) is None:
            raise AnalysisException(f"[PARSE_SYNTAX_ERROR] Unsupported statement in Orbit's mini Spark SQL: {q[:60]}")
        return DataFrame(_sql_run(used, q))

    def stop(self):
        pass


def _history(name):
    if name not in _tables:
        raise AnalysisException(f"[TABLE_OR_VIEW_NOT_FOUND] The table or view `{name}` cannot be found.")
    rows = [{"version": v["version"], "timestamp": pd.Timestamp(v["ts"], unit="s").strftime("%Y-%m-%d %H:%M:%S"), "operation": v["op"]} for v in reversed(_tables[name])]
    return DataFrame(pd.DataFrame(rows))
