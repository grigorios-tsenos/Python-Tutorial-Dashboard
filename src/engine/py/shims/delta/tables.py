import pandas as pd

from pyspark.errors import AnalysisException
from pyspark.sql import DataFrame, _history, _record, _tables
from pyspark.sql.column import Column


class DeltaTable:
    def __init__(self, name):
        self._name = name

    @classmethod
    def forName(cls, spark, name):
        if name not in _tables:
            raise AnalysisException(f"[TABLE_OR_VIEW_NOT_FOUND] `{name}` is not a Delta table. Create it first with df.write.format('delta').saveAsTable('{name}').")
        return cls(name)

    def toDF(self):
        return DataFrame(_tables[self._name][-1]["pdf"])

    def history(self):
        return _history(self._name)

    def _mask(self, condition):
        pdf = _tables[self._name][-1]["pdf"]
        if isinstance(condition, str):
            from pyspark.sql import _sql_run
            idx = _sql_run({"t": pdf.reset_index().rename(columns={"index": "__i"})}, f"SELECT __i FROM t WHERE {condition}")["__i"]
            return pdf, pdf.reset_index(drop=True).index.isin(idx)
        return pdf, condition._eval(pdf).fillna(False).astype(bool)

    def delete(self, condition):
        pdf, mask = self._mask(condition)
        _record(self._name, pdf[~mask], "DELETE", _tables)

    def update(self, condition, set):  # noqa: A002
        pdf, mask = self._mask(condition)
        new = pdf.copy()
        for c, v in set.items():
            val = v._eval(pdf) if isinstance(v, Column) else v
            new.loc[mask, c] = val[mask] if isinstance(val, pd.Series) else val
        _record(self._name, new, "UPDATE", _tables)

    def restoreToVersion(self, version):
        _record(self._name, _tables[self._name][version]["pdf"], "RESTORE", _tables)
