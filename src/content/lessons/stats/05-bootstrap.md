---
id: st-bootstrap
track: stats
order: 5
title: The Bootstrap: Confidence Without Formulas
tagline: Resample your own data to see how much your estimate could move.
kind: build
xp: 50
minutes: 8
---
@@body
# A confidence interval from resampling

You measured a mean from one sample. How different could it have been with another sample? The **bootstrap** answers by pretending your sample is the population: draw many new samples *with replacement* from it, compute the statistic each time, and read off the middle 95% of those values.

```python
rng.choice(x, size=(n_boot, len(x)), replace=True)   # n_boot resamples, one per row
stat(resamples, axis=1)                               # the statistic of every row at once
np.percentile(stats, [2.5, 97.5])                     # the 95% interval
```

It works for any statistic, mean or median or p95, and needs no formula.

> **Mission:** implement `bootstrap_stats(x, stat=np.mean, n_boot=1000, seed=0)` → an array of `n_boot` resampled statistics, and `bootstrap_ci(x, stat=np.mean, n_boot=1000, alpha=0.05, seed=0)` → `(low, high)`, the `alpha/2` and `1 − alpha/2` percentiles of those statistics. Reject an empty `x` and an `alpha` outside `(0, 1)` with `ValueError`.

@@step Resample with replacement, many times at once
One `rng.choice` call builds the whole matrix of resamples; `axis=1` computes the statistic for every row without a loop:

```python
x = np.asarray(x, dtype=float)
rng = np.random.default_rng(seed)
resamples = rng.choice(x, size=(n_boot, len(x)), replace=True)
return stat(resamples, axis=1)
```

**Do:** implement `bootstrap_stats`, then Run.
@@stepcheck
import numpy as np
x = np.array([120.0, 135, 128, 142, 131, 119, 125, 900])
s = bootstrap_stats(x, n_boot=500, seed=1)
ref = np.mean(np.random.default_rng(1).choice(x, size=(500, 8), replace=True), axis=1)
test("one statistic per resample, drawn with replacement from the seed", lambda: s.shape == (500,) and np.allclose(s, ref), "rng.choice(x, size=(n_boot, len(x)), replace=True) then stat(..., axis=1)")
test("any statistic works", lambda: bootstrap_stats(x, stat=np.median, n_boot=50).shape == (50,))
@@step Read the interval off the percentiles
The interval is the middle `1 − alpha` of the bootstrap distribution:

```python
stats = bootstrap_stats(x, stat, n_boot, seed)
low, high = np.percentile(stats, [100 * alpha / 2, 100 * (1 - alpha / 2)])
return float(low), float(high)
```

**Do:** implement `bootstrap_ci`, then Run. The interval should contain the sample mean.
@@stepcheck
import numpy as np
x = np.array([120.0, 135, 128, 142, 131, 119, 125, 900])
low, high = bootstrap_ci(x, n_boot=2000, seed=0)
test("the interval brackets the sample statistic", lambda: low < x.mean() < high and high - low > 0, "np.percentile(stats, [100 * alpha / 2, 100 * (1 - alpha / 2)])")
test("a wider alpha gives a narrower interval", lambda: (lambda a, b: (b[1] - b[0]) < (a[1] - a[0]))(bootstrap_ci(x, alpha=0.05), bootstrap_ci(x, alpha=0.5)))
@@step Refuse inputs that cannot produce an interval
No data means nothing to resample, and `alpha` must leave room for an interval:

```python
if len(x) == 0:
    raise ValueError("cannot bootstrap an empty sample")
if not 0 < alpha < 1:
    raise ValueError("alpha must be between 0 and 1")
```

Put the first guard in `bootstrap_stats` and the second in `bootstrap_ci`.

**Do:** add both guards, then Run.
@@stepcheck
def rejects(fn):
    try:
        fn()
    except ValueError:
        return True
    return False
test("empty samples and impossible alphas are rejected", lambda: rejects(lambda: bootstrap_stats([])) and rejects(lambda: bootstrap_ci([1, 2, 3], alpha=0)) and rejects(lambda: bootstrap_ci([1, 2, 3], alpha=1.5)), "raise ValueError")
@@starter
import numpy as np

def bootstrap_stats(x, stat=np.mean, n_boot=1000, seed=0):
    """n_boot values of `stat`, each computed on a resample of x drawn with replacement."""
    # TODO
    return np.zeros(n_boot)

def bootstrap_ci(x, stat=np.mean, n_boot=1000, alpha=0.05, seed=0):
    """(low, high): the middle 1 - alpha of the bootstrap distribution."""
    # TODO
    return (0.0, 0.0)

latency = [120, 135, 128, 142, 131, 119, 125, 900]
print("mean:", np.mean(latency))
print("95% CI for the mean:", bootstrap_ci(latency))
print("95% CI for the median:", bootstrap_ci(latency, stat=np.median))
@@solution
import numpy as np

def bootstrap_stats(x, stat=np.mean, n_boot=1000, seed=0):
    """n_boot values of `stat`, each computed on a resample of x drawn with replacement."""
    x = np.asarray(x, dtype=float)
    if len(x) == 0:
        raise ValueError("cannot bootstrap an empty sample")
    rng = np.random.default_rng(seed)
    resamples = rng.choice(x, size=(n_boot, len(x)), replace=True)
    return stat(resamples, axis=1)

def bootstrap_ci(x, stat=np.mean, n_boot=1000, alpha=0.05, seed=0):
    """(low, high): the middle 1 - alpha of the bootstrap distribution."""
    if not 0 < alpha < 1:
        raise ValueError("alpha must be between 0 and 1")
    stats = bootstrap_stats(x, stat, n_boot, seed)
    low, high = np.percentile(stats, [100 * alpha / 2, 100 * (1 - alpha / 2)])
    return float(low), float(high)

latency = [120, 135, 128, 142, 131, 119, 125, 900]
print("mean:", np.mean(latency))
print("95% CI for the mean:", bootstrap_ci(latency))
print("95% CI for the median:", bootstrap_ci(latency, stat=np.median))
@@check
import numpy as np
x = np.array([120.0, 135, 128, 142, 131, 119, 125, 900])
s = bootstrap_stats(x, n_boot=500, seed=1)
ref = np.mean(np.random.default_rng(1).choice(x, size=(500, 8), replace=True), axis=1)
test("bootstrap_stats resamples with replacement from the seed", lambda: s.shape == (500,) and np.allclose(s, ref))
test("every resampled statistic lies within the data's range", lambda: bool((s >= x.min()).all() and (s <= x.max()).all()))
low, high = bootstrap_ci(x, n_boot=2000, seed=0)
test("the interval brackets the sample mean", lambda: low < x.mean() < high)
test("the interval is reproducible and alpha controls its width", lambda: bootstrap_ci(x, n_boot=2000, seed=0) == (low, high) and (lambda w: w[1] - w[0] < high - low)(bootstrap_ci(x, alpha=0.5, n_boot=2000, seed=0)))
test("the median works as a statistic and is less sensitive to the outlier", lambda: bootstrap_ci(x, stat=np.median, n_boot=2000)[1] < 200)
test("a constant sample gives a zero-width interval", lambda: bootstrap_ci([5.0] * 10) == (5.0, 5.0))
test("results are plain floats", lambda: all(type(v) is float for v in bootstrap_ci(x)))
def rejects(fn):
    try:
        fn()
    except ValueError:
        return True
    return False
test("empty samples and impossible alphas are rejected", lambda: rejects(lambda: bootstrap_stats([])) and rejects(lambda: bootstrap_ci([1, 2, 3], alpha=0)) and rejects(lambda: bootstrap_ci([1, 2, 3], alpha=1.5)))
test("the input list is unchanged", lambda: latency == [120, 135, 128, 142, 131, 119, 125, 900])
@@hint
`rng.choice(x, size=(n_boot, len(x)), replace=True)` makes every resample in one call; `stat(resamples, axis=1)` evaluates them all. Convert `x` with `np.asarray` first.
@@hint
`np.percentile(stats, [100 * alpha / 2, 100 * (1 - alpha / 2)])` gives the two ends; wrap them in `float(...)`. Guard `len(x) == 0` in `bootstrap_stats` and `0 < alpha < 1` in `bootstrap_ci`.
@@q
What does a bootstrap resample do differently from the original sample?
@@a
It draws the same number of values with replacement, so some values repeat and some are left out, mimicking the variation of drawing a fresh sample.
@@q
Why can the bootstrap give an interval for the median or p95 when textbook formulas only cover the mean?
@@a
It never needs a formula: it measures the statistic's variability directly by recomputing it on resampled data.
@@real
`scipy.stats.bootstrap(data, statistic, confidence_level=0.95)` implements this with bias corrections. The same idea estimates uncertainty for model metrics: bootstrap the test set to get a confidence interval on accuracy or AUC.
