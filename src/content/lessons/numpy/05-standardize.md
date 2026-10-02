---
id: np-standardize
track: numpy
order: 5
title: Put Features on the Same Scale
tagline: A useful model should not confuse a large unit with an important feature.
kind: build
xp: 50
minutes: 6
---
@@body
# Standardize each feature column

A training matrix has one row per example and one column per feature. Age might range from 18 to 90 while income reaches thousands: equal numerical distances do not mean equal changes.

**Standardization** subtracts each column's mean and divides by its population standard deviation (`ddof=0`). Varying columns then have mean `0` and standard deviation `1`. A constant column has no variation: return zeros for it rather than dividing by zero.

> **Mission:** implement `standardize(values)` for a finite, two-dimensional numeric matrix. Return a floating-point array with the same shape, standardizing columns independently. Keep the input unchanged. An empty matrix keeps its shape; a one-dimensional input raises `ValueError`.

Use reductions over `axis=0` and broadcasting. `np.divide` can write zeros where a denominator is zero.
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
