---
id: st-stderr
track: stats
order: 7
title: "Bug Hunt: The Interval That Is 20x Too Wide"
tagline: Standard deviation describes the data. Standard error describes your estimate.
kind: bug
xp: 50
minutes: 7
---
@@body
# Standard error, not standard deviation

A confidence interval for a **mean** is `mean ± z · SE`, where the **standard error** is the sample standard deviation divided by the square root of the sample size:

```
SE = s / sqrt(n)         s = sample std (ddof=1)
```

The starter builds the interval with `s` instead of `SE`, and with the population formula for `s`. With 400 samples its interval is twenty times too wide, so every real effect looks "not significant". Two bugs, two fixes.

> **Mission:** fix `mean_ci(x, z=1.96)` so it returns `(low, high)` using the sample standard deviation (`ddof=1`) divided by `sqrt(n)`. A sample with fewer than 2 values raises `ValueError`.

@@step Divide by the square root of n
Run the starter: with 400 latencies the interval spans hundreds of milliseconds around a mean that moves by a few. The spread of the *data* is not the uncertainty of the *mean*. Divide by `sqrt(n)`:

```python
se = np.std(x) / np.sqrt(len(x))
```

**Do:** fix the scaling, then Run.
@@stepcheck
import numpy as np
big = np.random.default_rng(0).normal(130, 20, 400)
low, high = mean_ci(big)
half = (high - low) / 2
test("the half-width scales with 1/sqrt(n)", lambda: abs(half - 1.96 * np.std(big, ddof=1) / 20) < 0.3, "se = std / np.sqrt(len(x))")
@@step Use the sample standard deviation
`np.std` divides by `n` by default. For a sample, `ddof=1` divides by `n − 1`, which matters when `n` is small. Also, one value has no spread at all, so refuse it:

```python
if len(x) < 2:
    raise ValueError("need at least two values for an interval")
se = np.std(x, ddof=1) / np.sqrt(len(x))
```

**Do:** add `ddof=1` and the guard, then Run.
@@stepcheck
import numpy as np
small = np.array([10.0, 12.0, 11.0, 13.0, 9.0])
low, high = mean_ci(small)
test("small samples use ddof=1", lambda: np.isclose((high - low) / 2, 1.96 * np.std(small, ddof=1) / np.sqrt(5)), "np.std(x, ddof=1)")
def rejected():
    try:
        mean_ci([4.0])
    except ValueError:
        return True
    return False
test("a single value is rejected", rejected)
@@starter
import numpy as np

def mean_ci(x, z=1.96):
    """(low, high) confidence interval for the mean of x."""
    x = np.asarray(x, dtype=float)
    # BUG HUNT: this uses the spread of the data, not the uncertainty of the mean
    se = np.std(x)
    return float(x.mean() - z * se), float(x.mean() + z * se)

rng = np.random.default_rng(0)
before = rng.normal(130, 20, 400)        # 400 latencies before a change
after = rng.normal(125, 20, 400)         # 400 after: 5 ms faster on average
print("before:", mean_ci(before))
print("after: ", mean_ci(after))
@@solution
import numpy as np

def mean_ci(x, z=1.96):
    """(low, high) confidence interval for the mean of x."""
    x = np.asarray(x, dtype=float)
    if len(x) < 2:
        raise ValueError("need at least two values for an interval")
    se = np.std(x, ddof=1) / np.sqrt(len(x))
    return float(x.mean() - z * se), float(x.mean() + z * se)

rng = np.random.default_rng(0)
before = rng.normal(130, 20, 400)        # 400 latencies before a change
after = rng.normal(125, 20, 400)         # 400 after: 5 ms faster on average
print("before:", mean_ci(before))
print("after: ", mean_ci(after))
@@check
import numpy as np
big = np.random.default_rng(0).normal(130, 20, 400)
low, high = mean_ci(big)
test("the interval is centred on the mean", lambda: np.isclose((low + high) / 2, big.mean()))
test("the half-width is z * s / sqrt(n)", lambda: np.isclose((high - low) / 2, 1.96 * np.std(big, ddof=1) / 20))
small = np.array([10.0, 12.0, 11.0, 13.0, 9.0])
test("small samples use the sample standard deviation", lambda: np.isclose((mean_ci(small)[1] - mean_ci(small)[0]) / 2, 1.96 * np.std(small, ddof=1) / np.sqrt(5)))
test("z controls the width", lambda: (lambda a, b: np.isclose((b[1] - b[0]) / (a[1] - a[0]), 2.576 / 1.96))(mean_ci(small), mean_ci(small, z=2.576)))
test("the two intervals in the demo no longer overlap", lambda: mean_ci(after)[1] < mean_ci(before)[0])
test("plain floats come back", lambda: all(type(v) is float for v in mean_ci(small)))
def rejected():
    try:
        mean_ci([4.0])
    except ValueError:
        return True
    return False
test("a single value is rejected", rejected)
@@hint
The uncertainty of a mean shrinks with sample size: divide the standard deviation by `np.sqrt(len(x))`.
@@hint
`se = np.std(x, ddof=1) / np.sqrt(len(x))`, and `raise ValueError` when `len(x) < 2`.
@@q
What is the difference between standard deviation and standard error?
@@a
Standard deviation measures how spread out the data are; standard error measures how uncertain an estimate (like the mean) is, and shrinks as the sample grows.
@@q
Why does the sample size change the standard error but not the standard deviation?
@@a
More data does not make the population less spread out, but it does make the mean's estimate more precise.
@@real
`scipy.stats.sem(x)` computes the standard error directly, and `scipy.stats.t.interval` replaces 1.96 with the t-distribution for small samples. Most "no significant difference" results in dashboards come from exactly this bug or from samples too small to detect the effect.
