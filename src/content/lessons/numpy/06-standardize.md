---
id: np-standardize
track: numpy
order: 6
title: Put Features on the Same Scale
tagline: A useful model should not confuse a large unit with an important feature.
kind: build
xp: 50
minutes: 6
---
@@body
# Put every feature on the same scale

A training matrix is one row per example, one column per feature. Age spans 18–90 while income reaches tens of thousands, so a raw distance between two customers is really just an income difference.

**Standardization** fixes that per column: subtract the column's mean, divide by its standard deviation. Every varying column ends with mean `0` and standard deviation `1`. A constant column has no spread, so it becomes zeros instead of a division by zero.

```python
values.mean(axis=0)   # (d,) one mean per column
values.std(axis=0)    # (d,) one spread per column (population std, ddof=0)
```

> **Mission:** implement `standardize(values)` for a finite, two-dimensional numeric matrix. Return a floating-point array with the same shape, standardizing columns independently. Keep the input unchanged. An empty matrix keeps its shape; a one-dimensional input raises `ValueError`.
@@starter
import numpy as np

def standardize(values):
    """Standardize columns without mutating the input."""
    # TODO
    return np.asarray(values, dtype=float)

features = np.array([[10, 100, 7], [20, 200, 7], [30, 300, 7]])
print(standardize(features))
@@solution
import numpy as np

def standardize(values):
    """Standardize columns without mutating the input."""
    values = np.asarray(values, dtype=float)
    if values.ndim != 2:
        raise ValueError("expected a two-dimensional matrix")
    if len(values) == 0:
        return values.copy()
    centered = values - values.mean(axis=0)
    scales = values.std(axis=0)
    return np.divide(centered, scales, out=np.zeros_like(centered), where=scales != 0)

features = np.array([[10, 100, 7], [20, 200, 7], [30, 300, 7]])
print(standardize(features))
@@check
X = np.array([[10, 100, 7], [20, 200, 7], [30, 300, 7]])
original = X.copy()
out = standardize(X)
test("each varying column is centered and scaled", lambda: np.allclose(out[:, :2].mean(axis=0), 0) and np.allclose(out[:, :2].std(axis=0), 1))
test("constant columns become zeros", lambda: np.allclose(out[:, 2], 0))
test("integer input produces floats without mutation", lambda: np.issubdtype(out.dtype, np.floating) and np.array_equal(X, original))
Y = np.array([[1.0, 9.0], [5.0, 9.0]])
test("unfamiliar shapes use independent column statistics", lambda: np.allclose(standardize(Y), [[-1, 0], [1, 0]]))
test("one row has zero variance everywhere", lambda: np.allclose(standardize([[2, 4, 6]]), [[0, 0, 0]]))
test("empty input retains its two-dimensional shape", lambda: standardize(np.empty((0, 4))).shape == (0, 4))
try:
    standardize(np.array([1, 2, 3]))
    rejected = False
except ValueError:
    rejected = True
test("one-dimensional inputs are rejected", lambda: rejected)
@@hint
`values.mean(axis=0)` and `values.std(axis=0)` each return one number per column. Their shapes broadcast against every row.
@@hint
Use `centered = values - values.mean(axis=0)`, then `np.divide(centered, scales, out=np.zeros_like(centered), where=scales != 0)`. Handle zero rows before computing statistics.
@@q
Why do you standardize columns rather than rows in a training matrix?
@@a
Each column is a feature: its values must be compared on the same scale across examples.
@@q
What should happen to a feature that is constant across every example?
@@a
It becomes a column of zeros; dividing by its zero standard deviation would create invalid values.
@@real
Fit preprocessing statistics on the training set and reuse them for validation and production data. Recomputing them on held-out data leaks information and changes the scale the model learned.
