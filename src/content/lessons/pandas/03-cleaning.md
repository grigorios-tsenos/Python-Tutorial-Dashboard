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
