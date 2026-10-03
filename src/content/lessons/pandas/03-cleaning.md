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

Real data is dirty. Here a latency column arrived as **text**, with a `None` and the word `"oops"` mixed in. Computing a mean on text is meaningless, so pandas refuses.

The fix is a two-step habit you will repeat for the rest of your career:

1. **Convert** to the type you actually mean: `pd.to_numeric(col, errors="coerce")`
2. **Let bad values become `NaN`**: `coerce` turns unparseable text into "missing", and `mean()` skips missing values.

> **Mission:** make `means` the mean latency per endpoint. Expected: `/chat` → `107.5`, `/embed` → `60.0`.
@@starter
import pandas as pd

logs = pd.DataFrame({
    "endpoint": ["/chat", "/chat", "/embed", "/embed", "/chat"],
    "latency_ms": ["120", "95", None, "60", "oops"],
})

# BUG HUNT: this crashes. Convert latency_ms to numbers first.
means = logs.groupby("endpoint")["latency_ms"].mean()
print(means)
@@solution
import pandas as pd

logs = pd.DataFrame({
    "endpoint": ["/chat", "/chat", "/embed", "/embed", "/chat"],
    "latency_ms": ["120", "95", None, "60", "oops"],
})

logs["latency_ms"] = pd.to_numeric(logs["latency_ms"], errors="coerce")
means = logs.groupby("endpoint")["latency_ms"].mean()
print(means)
@@check
test("/chat averages 107.5 (oops ignored)", lambda: means["/chat"] == 107.5)
test("/embed averages 60.0 (None ignored)", lambda: means["/embed"] == 60.0)
@@hint
The column holds strings. You need numbers before you can average: look at `pd.to_numeric`.
@@hint
`logs["latency_ms"] = pd.to_numeric(logs["latency_ms"], errors="coerce")` before the groupby.
@@q
What does `errors="coerce"` do in `pd.to_numeric`?
@@a
Replaces values that can't be parsed with NaN instead of raising an error.
@@q
Does `Series.mean()` count NaN values?
@@a
No. NaN is skipped by default (`skipna=True`).
