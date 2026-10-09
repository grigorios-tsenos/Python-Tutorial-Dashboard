---
id: st-spread
track: stats
order: 2
title: Spread: Percentiles Tell the Tail's Story
tagline: Two services with the same median can feel completely different.
kind: build
xp: 35
minutes: 6
---
@@body
# One number for the center, a few for the spread

The median says where the middle is. **Percentiles** say how far the tail reaches: p95 is the value below which 95% of observations fall. The **interquartile range** (IQR, p75 − p25) is the width of the middle half, immune to outliers. The **sample standard deviation** is the classic spread measure for bell-shaped data.

```python
np.percentile(x, 95)          # the 95th percentile
np.percentile(x, [25, 75])    # several at once -> an array
np.std(x, ddof=1)             # SAMPLE std: divide by n - 1, not n
```

`ddof=1` matters: a sample underestimates the population's spread, and dividing by `n − 1` corrects for it. Models and papers use the sample version.

> **Mission:** implement `summarize(x)` → a dict with `p50`, `p95`, `p99`, `iqr` and `std` (sample, `ddof=1`), accepting a list or array. An empty input raises `ValueError`.
@@starter
import numpy as np

def summarize(x):
    """p50, p95, p99, iqr and sample std of a list or array of numbers."""
    # TODO
    return {}

latency = [120, 135, 128, 142, 131, 119, 125, 900]
for key, value in summarize(latency).items():
    print(f"{key:>4}: {value:.1f}")
@@solution
import numpy as np

def summarize(x):
    """p50, p95, p99, iqr and sample std of a list or array of numbers."""
    x = np.asarray(x, dtype=float)
    if x.size == 0:
        raise ValueError("summarize needs at least one value")
    p25, p50, p75, p95, p99 = np.percentile(x, [25, 50, 75, 95, 99])
    return {"p50": p50, "p95": p95, "p99": p99, "iqr": p75 - p25, "std": np.std(x, ddof=1)}

latency = [120, 135, 128, 142, 131, 119, 125, 900]
for key, value in summarize(latency).items():
    print(f"{key:>4}: {value:.1f}")
@@check
import numpy as np
L = [120, 135, 128, 142, 131, 119, 125, 900]
out = summarize(L)
test("the five keys are present", lambda: set(out) == {"p50", "p95", "p99", "iqr", "std"})
test("percentiles match numpy", lambda: all(np.isclose(out[k], np.percentile(L, q)) for k, q in [("p50", 50), ("p95", 95), ("p99", 99)]))
test("iqr is p75 - p25", lambda: np.isclose(out["iqr"], np.percentile(L, 75) - np.percentile(L, 25)))
test("std uses ddof=1", lambda: np.isclose(out["std"], np.std(L, ddof=1)) and not np.isclose(out["std"], np.std(L)))
arr = np.array([3.0, 1.0, 2.0])
test("arrays and lists both work", lambda: np.isclose(summarize(arr)["p50"], 2.0) and np.isclose(summarize([5])["iqr"], 0.0))
test("an outlier does not change the iqr", lambda: np.isclose(summarize(L)["iqr"], summarize([v if v < 500 else 90000 for v in L])["iqr"]))
def rejected():
    try:
        summarize([])
    except ValueError:
        return True
    return False
test("an empty input is rejected", rejected)
test("the input is unchanged", lambda: L == [120, 135, 128, 142, 131, 119, 125, 900])
@@hint
`np.percentile(x, [25, 50, 75, 95, 99])` returns five numbers in one call. Unpack them into variables.
@@hint
`"iqr": p75 - p25` and `"std": np.std(x, ddof=1)`. Check `x.size == 0` right after `np.asarray`.
@@q
Why divide by n − 1 for the sample standard deviation?
@@a
A sample's values sit closer to their own mean than to the true population mean, so dividing by n underestimates the spread; n − 1 corrects the bias.
@@q
What does p95 = 400 ms mean for a service?
@@a
95% of requests finished within 400 ms; the slowest 5% took longer.
@@real
`pandas.Series.describe(percentiles=[.5, .95, .99])` and `scipy.stats.iqr` give the same numbers. Latency SLOs are written against p95 or p99, never the mean.
