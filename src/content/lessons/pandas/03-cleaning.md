---
id: pd-clean
track: pandas
order: 3
title: "Bug Hunt: The Latency That Won't Average"
tagline: 80% of data science is fixing columns that lie about their type.
kind: bug
xp: 35
minutes: 6
---
@@body
# This code crashes. Make it tell the truth.

A latency column arrived as **text**, with a `None` and the word `"oops"` mixed in. pandas refuses to average text, so the cell dies on the `groupby`.

The fix is a conversion, and the discipline is to **count what the conversion threw away**. Silent data loss is worse than a crash.

> **Mission:** make `means` the mean latency per endpoint (`/chat` → `107.5`, `/embed` → `60.0`) and store how many latencies could not be parsed in `lost`.

@@step Convert the column to numbers
Run the starter once and read the error: it names the `mean` and the text dtype. Now convert before averaging:

```python
logs["latency_ms"] = pd.to_numeric(logs["latency_ms"], errors="coerce")
```

- `pd.to_numeric` parses `"120"` into `120.0`.
- `errors="coerce"` turns anything unparseable (`"oops"`, `None`) into `NaN` instead of raising.
- `.mean()` skips `NaN` by default, so the averages come out right.

**Do:** add the line above the `groupby`, then Run.
@@stepcheck
import pandas as pd
test("latency_ms is numeric now", lambda: pd.api.types.is_numeric_dtype(logs["latency_ms"]), 'pd.to_numeric(logs["latency_ms"], errors="coerce")')
test("/chat averages 107.5 (oops ignored)", lambda: means["/chat"] == 107.5)
@@step Count what coerce threw away
`coerce` is convenient and dangerous: it never tells you how much it discarded. Count the gaps and print them, so a broken upstream feed shows up as a number instead of a quietly wrong average:

```python
lost = logs["latency_ms"].isna().sum()
print("unparseable:", lost)
```

`isna()` is a boolean mask of missing cells; summing it counts them.

**Do:** add both lines after the conversion, then Run. `lost` should be `2`.
@@stepcheck
test("lost counts the unparseable latencies", lambda: int(lost) == 2, 'lost = logs["latency_ms"].isna().sum()')
test("the count is printed", lambda: "unparseable: 2" in __stdout__)
@@starter
import pandas as pd

logs = pd.DataFrame({
    "endpoint": ["/chat", "/chat", "/embed", "/embed", "/chat"],
    "latency_ms": ["120", "95", None, "60", "oops"],
})

# BUG HUNT: this crashes. Convert latency_ms to numbers first, then count the values that could not be parsed.
means = logs.groupby("endpoint")["latency_ms"].mean()
print(means)
@@solution
import pandas as pd

logs = pd.DataFrame({
    "endpoint": ["/chat", "/chat", "/embed", "/embed", "/chat"],
    "latency_ms": ["120", "95", None, "60", "oops"],
})

logs["latency_ms"] = pd.to_numeric(logs["latency_ms"], errors="coerce")
lost = logs["latency_ms"].isna().sum()
print("unparseable:", lost)
means = logs.groupby("endpoint")["latency_ms"].mean()
print(means)
@@check
test("/chat averages 107.5 (oops ignored)", lambda: means["/chat"] == 107.5)
test("/embed averages 60.0 (None ignored)", lambda: means["/embed"] == 60.0)
test("lost counts the two unparseable values", lambda: int(lost) == 2)
@@hint
The column holds strings. You need numbers before you can average: look at `pd.to_numeric`.
@@hint
`logs["latency_ms"] = pd.to_numeric(logs["latency_ms"], errors="coerce")` before the groupby, then `lost = logs["latency_ms"].isna().sum()`.
@@q
What does `errors="coerce"` do in `pd.to_numeric`?
@@a
Replaces values that can't be parsed with NaN instead of raising an error.
@@q
Does `Series.mean()` count NaN values?
@@a
No. NaN is skipped by default (`skipna=True`).
@@real
In production, log the coerced count as a metric and alert when it jumps: a sudden rise in unparseable values usually means an upstream schema change.
