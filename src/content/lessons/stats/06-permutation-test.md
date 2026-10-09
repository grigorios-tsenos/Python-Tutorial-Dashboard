---
id: st-permutation
track: stats
order: 6
title: Is the Difference Real? Shuffle and See
tagline: A permutation test asks how often chance alone produces a gap this big.
kind: build
xp: 55
minutes: 8
---
@@body
# The null hypothesis, simulated

Group B converted 2 points better than group A. Would that gap appear if the two groups were really identical? Under that **null hypothesis** the labels are meaningless, so shuffle them: pool both groups, deal them out at random, and measure the gap again. Do it thousands of times; the share of shuffles that produce a gap at least as big as yours is the **p-value**.

```python
pooled = np.concatenate([a, b])
shuffled = rng.permutation(pooled)
shuffled[:len(a)].mean() - shuffled[len(a):].mean()    # one fake gap
```

> **Mission:** implement `mean_diff(a, b)` → `mean(b) − mean(a)`, `permutation_diffs(a, b, n_perm=2000, seed=0)` → an array of `n_perm` shuffled gaps, and `permutation_pvalue(a, b, n_perm=2000, seed=0)` → the two-sided p-value `(count + 1) / (n_perm + 1)`, where `count` is how many shuffled gaps have `|gap| >= |observed gap|`. Empty groups raise `ValueError`.

@@step The observed gap
Define the statistic you will test. Treatment minus control, so a positive number means B did better:

```python
def mean_diff(a, b):
    return float(np.mean(b) - np.mean(a))
```

**Do:** implement `mean_diff`, then Run.
@@stepcheck
import numpy as np
test("mean_diff is mean(b) - mean(a)", lambda: np.isclose(mean_diff([1, 2, 3], [2, 3, 7]), 2.0) and np.isclose(mean_diff([5, 5], [1, 1]), -4.0), "float(np.mean(b) - np.mean(a))")
@@step Shuffle the labels many times
Pool the groups, permute, split at the original group size, measure. A list comprehension over `range(n_perm)` is fine here:

```python
a, b = np.asarray(a, dtype=float), np.asarray(b, dtype=float)
rng = np.random.default_rng(seed)
pooled = np.concatenate([a, b])
diffs = []
for _ in range(n_perm):
    shuffled = rng.permutation(pooled)
    diffs.append(shuffled[len(a):].mean() - shuffled[:len(a)].mean())
return np.array(diffs)
```

Keep the order of operations exactly like this (permute, then `b` is the tail) so the check can reproduce it.

**Do:** implement `permutation_diffs`, then Run.
@@stepcheck
import numpy as np
a = np.array([0.0, 1, 0, 0, 1, 0, 0, 0, 1, 0])
b = np.array([1.0, 1, 0, 1, 1, 0, 1, 1, 0, 1])
d = permutation_diffs(a, b, n_perm=300, seed=2)
rng = np.random.default_rng(2)
pooled = np.concatenate([a, b])
ref = np.array([(lambda s: s[10:].mean() - s[:10].mean())(rng.permutation(pooled)) for _ in range(300)])
test("one shuffled gap per permutation, reproducible", lambda: d.shape == (300,) and np.allclose(d, ref), "rng.permutation(pooled), then tail minus head")
test("shuffled gaps are centred on zero", lambda: abs(d.mean()) < 0.1)
@@step The p-value, two-sided and never zero
Count shuffles at least as extreme as the real gap in **either** direction, and add one to both numerator and denominator so a p-value is never exactly 0 (the observed arrangement is itself one of the possible shuffles):

```python
if len(a) == 0 or len(b) == 0:
    raise ValueError("both groups need data")
observed = abs(mean_diff(a, b))
diffs = permutation_diffs(a, b, n_perm, seed)
count = int((np.abs(diffs) >= observed).sum())
return (count + 1) / (n_perm + 1)
```

**Do:** implement `permutation_pvalue` with the guard, then Run.
@@stepcheck
import numpy as np
rng = np.random.default_rng(0)
same_a = rng.normal(0, 1, 40)
far_a, far_b = rng.normal(0, 1, 40), rng.normal(2, 1, 40)
test("identical groups give a p-value of 1", lambda: permutation_pvalue(same_a, same_a.copy(), n_perm=500) == 1.0, "count shuffles with |gap| >= |observed|; a zero gap is matched by every shuffle")
test("a real difference gives a tiny p-value, never zero", lambda: 0 < permutation_pvalue(far_a, far_b, n_perm=500) < 0.01, "(count + 1) / (n_perm + 1)")
def rejected():
    try:
        permutation_pvalue([], [1, 2])
    except ValueError:
        return True
    return False
test("empty groups are rejected", rejected)
@@starter
import numpy as np

def mean_diff(a, b):
    """mean(b) - mean(a): positive when b did better."""
    # TODO
    return 0.0

def permutation_diffs(a, b, n_perm=2000, seed=0):
    """Gaps measured after shuffling the pooled data n_perm times."""
    # TODO
    return np.zeros(n_perm)

def permutation_pvalue(a, b, n_perm=2000, seed=0):
    """Two-sided p-value: share of shuffles at least as extreme as the observed gap."""
    # TODO
    return 1.0

control = [0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0]
treatment = [1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0]
print("gap:", mean_diff(control, treatment))
print("p-value:", permutation_pvalue(control, treatment))
@@solution
import numpy as np

def mean_diff(a, b):
    """mean(b) - mean(a): positive when b did better."""
    return float(np.mean(b) - np.mean(a))

def permutation_diffs(a, b, n_perm=2000, seed=0):
    """Gaps measured after shuffling the pooled data n_perm times."""
    a, b = np.asarray(a, dtype=float), np.asarray(b, dtype=float)
    rng = np.random.default_rng(seed)
    pooled = np.concatenate([a, b])
    diffs = []
    for _ in range(n_perm):
        shuffled = rng.permutation(pooled)
        diffs.append(shuffled[len(a):].mean() - shuffled[:len(a)].mean())
    return np.array(diffs)

def permutation_pvalue(a, b, n_perm=2000, seed=0):
    """Two-sided p-value: share of shuffles at least as extreme as the observed gap."""
    if len(a) == 0 or len(b) == 0:
        raise ValueError("both groups need data")
    observed = abs(mean_diff(a, b))
    diffs = permutation_diffs(a, b, n_perm, seed)
    count = int((np.abs(diffs) >= observed).sum())
    return (count + 1) / (n_perm + 1)

control = [0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0]
treatment = [1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0]
print("gap:", mean_diff(control, treatment))
print("p-value:", permutation_pvalue(control, treatment))
@@check
import numpy as np
test("mean_diff is mean(b) - mean(a)", lambda: np.isclose(mean_diff([1, 2, 3], [2, 3, 7]), 2.0) and np.isclose(mean_diff(control, treatment), 0.4))
a = np.array([0.0, 1, 0, 0, 1, 0, 0, 0, 1, 0])
b = np.array([1.0, 1, 0, 1, 1, 0, 1, 1, 0, 1])
d = permutation_diffs(a, b, n_perm=300, seed=2)
rng = np.random.default_rng(2)
pooled = np.concatenate([a, b])
ref = np.array([(lambda s: s[10:].mean() - s[:10].mean())(rng.permutation(pooled)) for _ in range(300)])
test("permutation_diffs shuffles the pooled data reproducibly", lambda: d.shape == (300,) and np.allclose(d, ref))
test("unequal group sizes split at the right place", lambda: permutation_diffs([1, 2, 3], [10, 20, 30, 40], n_perm=5).shape == (5,))
rng = np.random.default_rng(0)
same_a = rng.normal(0, 1, 40)
far_a, far_b = rng.normal(0, 1, 40), rng.normal(2, 1, 40)
test("identical groups give a p-value of 1", lambda: permutation_pvalue(same_a, same_a.copy(), n_perm=500) == 1.0)
test("a real difference gives a tiny p-value, never zero", lambda: 0 < permutation_pvalue(far_a, far_b, n_perm=500) < 0.01)
test("the test is two-sided", lambda: np.isclose(permutation_pvalue(far_a, far_b, n_perm=500), permutation_pvalue(far_b, far_a, n_perm=500)))
test("the p-value is reproducible from the seed", lambda: permutation_pvalue(far_a, far_b, n_perm=200) == permutation_pvalue(far_a, far_b, n_perm=200))
def rejected():
    try:
        permutation_pvalue([], [1, 2])
    except ValueError:
        return True
    return False
test("empty groups are rejected", rejected)
@@hint
`np.concatenate([a, b])` pools the groups and `rng.permutation(pooled)` shuffles them. The first `len(a)` shuffled values play the role of group a.
@@hint
Compare absolute values: `(np.abs(diffs) >= abs(observed)).sum()`. Return `(count + 1) / (n_perm + 1)`.
@@q
What does a p-value of 0.03 mean in a permutation test?
@@a
About 3% of random relabelings produced a gap at least as large as the observed one; the gap is unlikely under the null hypothesis.
@@q
Why add one to the numerator and denominator?
@@a
The observed arrangement counts as one permutation, and it keeps the p-value from being exactly zero after a finite number of shuffles.
@@real
`scipy.stats.permutation_test((a, b), statistic, n_resamples=...)` does this with vectorised shuffles. For large samples the classical `scipy.stats.ttest_ind` gives nearly the same answer much faster.
