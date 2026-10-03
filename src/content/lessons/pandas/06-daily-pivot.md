---
id: pd-daily-pivot
track: pandas
order: 6
title: Pivot a Log into a Daily Dashboard
tagline: Long data stores well, wide data reads well, and quiet days still count.
kind: build
xp: 55
minutes: 7
---
@@body
# Long to wide, without losing the quiet days

Logs are **long**: one row per request. Dashboards and alerting want **wide** tables: one row per day, one column per endpoint. `pivot_table` reshapes and aggregates in one call:

```python
logs.pivot_table(index="day", columns="endpoint", values="errors",
                 aggfunc="sum", fill_value=0)
```

`fill_value=0` covers a day/endpoint pair with no rows. It **cannot** add a day with no rows at all: a quiet Tuesday simply disappears from the index. Build the calendar you expect and `reindex` onto it:

```python
days = pd.date_range("2026-03-01", "2026-03-07", freq="D", tz="UTC", name="day")
table.reindex(days, fill_value=0)
```

> **Mission:** implement `daily_errors(logs, start, end)`. `logs` has `at` (ISO timestamps with offsets), `endpoint` and integer `status` columns. Return a wide table of **server errors** (`status >= 500`) per **UTC day** and endpoint:
>
> - the index is every calendar day from `start` to `end` inclusive, as UTC midnights named `day`, even days with no traffic
> - one column per endpoint that received **any** request in that window, sorted; healthy endpoints get a column of zeros
> - integer counts, `0` where nothing failed; requests outside the window are ignored
> - `end` before `start` raises `ValueError`; keep the input unchanged

@@starter
import pandas as pd

def daily_errors(logs, start, end):
    """Server errors per UTC day (rows) and endpoint (columns), including quiet days."""
    errors = logs[logs["status"] >= 500]
    # BUG: grouping only sees days and endpoints that had errors, and the result is long, not wide
    return errors.groupby("endpoint").size()

logs = pd.DataFrame({
    "at": ["2026-03-01T09:00:00Z", "2026-03-01T09:05:00Z", "2026-03-01T17:30:00Z",
           "2026-03-03T08:00:00Z", "2026-03-03T08:01:00Z"],
    "endpoint": ["/chat", "/embed", "/chat", "/chat", "/embed"],
    "status": [500, 200, 503, 200, 502],
})
daily_errors(logs, "2026-03-01", "2026-03-03")
@@solution
import pandas as pd

def daily_errors(logs, start, end):
    """Server errors per UTC day (rows) and endpoint (columns), including quiet days."""
    days = pd.date_range(start, end, freq="D", tz="UTC", name="day")
    if days.empty:
        raise ValueError("end must not be before start")
    day = pd.to_datetime(logs["at"], utc=True).dt.floor("D")
    window = logs.assign(day=day, errors=logs["status"] >= 500)[day.between(days[0], days[-1])]
    table = window.pivot_table(index="day", columns="endpoint", values="errors", aggfunc="sum", fill_value=0)
    return table.reindex(days, fill_value=0).astype(int)

logs = pd.DataFrame({
    "at": ["2026-03-01T09:00:00Z", "2026-03-01T09:05:00Z", "2026-03-01T17:30:00Z",
           "2026-03-03T08:00:00Z", "2026-03-03T08:01:00Z"],
    "endpoint": ["/chat", "/embed", "/chat", "/chat", "/embed"],
    "status": [500, 200, 503, 200, 502],
})
daily_errors(logs, "2026-03-01", "2026-03-03")
@@check
L = pd.DataFrame({
    "at": ["2026-03-01T09:00:00Z", "2026-03-01T09:05:00Z", "2026-03-01T17:30:00Z", "2026-03-03T08:00:00Z", "2026-03-03T08:01:00Z"],
    "endpoint": ["/chat", "/embed", "/chat", "/chat", "/embed"],
    "status": [500, 200, 503, 200, 502],
})
original = L.copy(deep=True)
out = daily_errors(L, "2026-03-01", "2026-03-03")
days = lambda t: [d.strftime("%Y-%m-%d") for d in t.index]
test("returns a wide DataFrame, one column per endpoint", lambda: isinstance(out, pd.DataFrame) and list(out.columns) == ["/chat", "/embed"])
test("every calendar day is a row, including the quiet one", lambda: days(out) == ["2026-03-01", "2026-03-02", "2026-03-03"] and out.index.name == "day")
test("counts only server errors per day and endpoint", lambda: out.values.tolist() == [[2, 0], [0, 0], [0, 1]])
test("counts are integers", lambda: all(pd.api.types.is_integer_dtype(t) for t in out.dtypes))
test("the input log is unchanged", lambda: L.equals(original))
M = pd.DataFrame({
    "at": ["2026-02-28T23:59:00Z", "2026-03-02T23:30:00-05:00", "2026-03-02T10:00:00+02:00", "2026-03-02T11:00:00Z", "2026-03-02T12:00:00Z", "2026-03-04T00:00:00Z"],
    "endpoint": ["/old", "/search", "/search", "/health", "/search", "/late"],
    "status": [500, 504, 404, 200, 500, 500],
})
m = daily_errors(M, "2026-03-01", "2026-03-03")
test("offsets are converted to UTC days before counting", lambda: m.loc[pd.Timestamp("2026-03-03", tz="UTC"), "/search"] == 1 and m.loc[pd.Timestamp("2026-03-02", tz="UTC"), "/search"] == 1)
test("4xx responses are not server errors and healthy endpoints still appear", lambda: list(m.columns) == ["/health", "/search"] and m["/health"].tolist() == [0, 0, 0])
test("requests outside the window are ignored", lambda: "/old" not in m.columns and "/late" not in m.columns and int(m.values.sum()) == 2)
quiet = daily_errors(L, "2026-04-01", "2026-04-02")
test("a window with no traffic still lists its days", lambda: days(quiet) == ["2026-04-01", "2026-04-02"] and quiet.shape == (2, 0))
test("a one-day window works", lambda: daily_errors(L, "2026-03-03", "2026-03-03").values.tolist() == [[0, 1]])
try:
    daily_errors(L, "2026-03-03", "2026-03-01")
    rejected = False
except ValueError:
    rejected = True
test("end before start is rejected", lambda: rejected)
@@hint
Parse with `pd.to_datetime(logs["at"], utc=True)` and floor to `"D"`. Keep rows whose day falls between the first and last day of `pd.date_range(start, end, freq="D", tz="UTC", name="day")`, and add a boolean `errors` column with `logs["status"] >= 500`.
@@hint
`pivot_table(index="day", columns="endpoint", values="errors", aggfunc="sum", fill_value=0)` sums the booleans per cell (healthy endpoints sum to 0). Then `.reindex(days, fill_value=0).astype(int)` adds the missing days. An empty `date_range` means `end` came before `start`.
@@q
Why doesn't `fill_value=0` in `pivot_table` add a day with no log rows?
@@a
pivot_table only creates rows for index values that appear in the data. Reindex onto the full calendar to add missing days.
@@q
What does `pivot_table` do when several rows land in the same day/endpoint cell?
@@a
It combines them with `aggfunc` (here `sum`), unlike `pivot`, which raises on duplicates.
@@real
Monitoring stacks (Databricks SQL dashboards, Grafana) query this exact shape. In Spark the same reshape is `df.groupBy("day").pivot("endpoint").agg(F.sum("errors"))`, and a calendar table joined on the left fills the quiet days.
