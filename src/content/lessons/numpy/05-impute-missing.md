---
id: np-impute
track: numpy
order: 5
title: Fill the Gaps with Masks
tagline: One missing reading should not turn a whole feature into NaN.
kind: build
xp: 45
minutes: 6
---
@@body
# Boolean masks: count, select and replace without loops

Real feature matrices have holes, stored as `NaN`, and `NaN` is contagious: any sum that touches it becomes `NaN`, so one missing reading ruins a whole column's mean.

A **mask** is a boolean array shaped like your data. Three moves do all the work:

```python
mask = np.isnan(X)         # True where a cell is missing
(~mask).sum(axis=0)        # how many real values per column
np.where(mask, 0.0, X)     # gaps -> 0, everything else kept
```

> **Mission:** implement `impute_columns(values)` for a 2-D matrix. Replace every `NaN` with the mean of the observed values in the same column.
>
> - return `(filled, filled_per_column)`: a float array with the input's shape, and an integer count per column
> - a column with **no** observed values is filled with `0.0`, without dividing by zero or triggering the "Mean of empty slice" warning
> - keep the input unchanged, keep observed values exactly, keep an empty `(0, d)` shape
> - a 1-D input raises `ValueError`

@@step Refuse anything that is not a matrix
Column statistics only make sense with columns. Right after the `np.asarray(...)` line, guard the shape:

```python
if values.ndim != 2:
    raise ValueError("expected a two-dimensional matrix")
```

`ndim` is the number of axes. A flat vector has 1; a table has 2. Failing loudly here beats a confusing `IndexError` three lines later.

**Do:** add the guard, then Run. (Your output will still show gaps; that is the next step.)
@@stepcheck
import numpy as np
def rejects():
    try:
        impute_columns([1.0, np.nan, 3.0])
    except ValueError:
        return True
    return False
test("one-dimensional input is rejected with ValueError", rejects, "if values.ndim != 2: raise ValueError(...)")
@@step Build the mask and report the gaps
`np.isnan(values)` gives a boolean array the same shape as the input. Summing booleans counts the `True`s, and `axis=0` counts down each column:

```python
missing = np.isnan(values)
report = missing.sum(axis=0)    # how many gaps per column
```

Return that report as the second value while the first value is still the input. The printed report should read `[1 1 1]` for the sample data.

**Do:** compute `missing` and return `values, missing.sum(axis=0)`, then Run.
@@stepcheck
import numpy as np
X = np.array([[30.0, np.nan, 12.0], [np.nan, 50000.0, 3.0], [34.0, 60000.0, np.nan], [38.0, 55000.0, 6.0]])
test("the report counts filled cells per column", lambda: np.asarray(impute_columns(X)[1]).tolist() == [1, 1, 1], "return missing.sum(axis=0) as the second value")
@@step Fill each gap with its column's mean
You need the mean of the **observed** values only. Zero out the gaps, sum, and divide by the observed count:

```python
observed = (~missing).sum(axis=0)                  # (d,) real values per column
totals = np.where(missing, 0.0, values).sum(axis=0)
means = totals / observed                          # (d,) one mean per column
filled = np.where(missing, means, values)
```

Read the last line aloud: *where a cell is missing, take that column's mean; otherwise keep the value.* `means` has shape `(d,)`, so broadcasting repeats it down the rows and every gap receives **its own column's** mean.

**Do:** compute `filled` and return it as the first value, then Run.
@@stepcheck
import numpy as np
X = np.array([[30.0, np.nan, 12.0], [np.nan, 50000.0, 3.0], [34.0, 60000.0, np.nan], [38.0, 55000.0, 6.0]])
test("each gap gets its own column's observed mean", lambda: np.allclose(impute_columns(X)[0], [[30, 55000, 12], [34, 50000, 3], [34, 60000, 7], [38, 55000, 6]]), "np.where(missing, means, values)")
@@step Keep empty columns quiet
If a column has no observed values, `totals / observed` is `0 / 0`: a warning and a `NaN`. `np.divide` can skip those positions and write a default instead:

```python
means = np.divide(totals, observed, out=np.zeros(values.shape[1]), where=observed > 0)
```

- `out=` is the array that receives the results, pre-filled with zeros.
- `where=` says which positions to actually compute. Skipped positions keep their zero.

**Do:** replace the plain division with `np.divide(...)`, then Run. The final checks also try an empty matrix and integer input.
@@stepcheck
import numpy as np, warnings
def quiet():
    with warnings.catch_warnings():
        warnings.simplefilter("error")
        filled, report = impute_columns([[np.nan, 1.0], [np.nan, 3.0]])
    return np.allclose(filled, [[0, 1], [0, 3]]) and np.asarray(report).tolist() == [2, 0]
test("an all-missing column becomes zeros without warnings", quiet, "np.divide(totals, observed, out=np.zeros(...), where=observed > 0)")
@@starter
import numpy as np

def impute_columns(values):
    """Replace NaN with each column's observed mean; report how many cells were filled per column."""
    values = np.asarray(values, dtype=float)
    # TODO: build a mask, compute per-column means from observed values only, fill the gaps
    return values, np.zeros(values.shape[1], dtype=int)

features = np.array([
    # age   income    sessions
    [30.0,  np.nan,   12.0],
    [np.nan, 50000.0,  3.0],
    [34.0,  60000.0,  np.nan],
    [38.0,  55000.0,   6.0],
])
filled, report = impute_columns(features)
print(filled)
print("filled per column:", report)
@@solution
import numpy as np

def impute_columns(values):
    """Replace NaN with each column's observed mean; report how many cells were filled per column."""
    values = np.asarray(values, dtype=float)
    if values.ndim != 2:
        raise ValueError("expected a two-dimensional matrix")
    missing = np.isnan(values)
    observed = (~missing).sum(axis=0)
    totals = np.where(missing, 0.0, values).sum(axis=0)
    means = np.divide(totals, observed, out=np.zeros(values.shape[1]), where=observed > 0)
    return np.where(missing, means, values), missing.sum(axis=0)

features = np.array([
    # age   income    sessions
    [30.0,  np.nan,   12.0],
    [np.nan, 50000.0,  3.0],
    [34.0,  60000.0,  np.nan],
    [38.0,  55000.0,   6.0],
])
filled, report = impute_columns(features)
print(filled)
print("filled per column:", report)
@@check
import warnings
X = np.array([[30.0, np.nan, 12.0], [np.nan, 50000.0, 3.0], [34.0, 60000.0, np.nan], [38.0, 55000.0, 6.0]])
original = X.copy()
out, counts = impute_columns(X)
test("each gap gets its own column's observed mean", lambda: np.allclose(out, [[30, 55000, 12], [34, 50000, 3], [34, 60000, 7], [38, 55000, 6]]))
test("observed values are kept exactly", lambda: np.array_equal(out[~np.isnan(original)], original[~np.isnan(original)]))
test("the report counts filled cells per column", lambda: np.issubdtype(np.asarray(counts).dtype, np.integer) and np.asarray(counts).tolist() == [1, 1, 1])
test("the input keeps its gaps", lambda: np.array_equal(X, original, equal_nan=True))
Y = np.array([[np.nan, 2.0], [np.nan, np.nan], [5.0, 4.0], [7.0, np.nan]])
y_out, y_counts = impute_columns(Y)
test("unfamiliar data uses independent column means", lambda: np.allclose(y_out, [[6, 2], [6, 3], [5, 4], [7, 3]]) and np.asarray(y_counts).tolist() == [2, 2])
def all_missing_is_quiet():
    with warnings.catch_warnings():
        warnings.simplefilter("error")
        filled, report = impute_columns([[np.nan, 1.0], [np.nan, 3.0]])
    return np.allclose(filled, [[0, 1], [0, 3]]) and np.asarray(report).tolist() == [2, 0]
test("an all-missing column becomes zeros without warnings", all_missing_is_quiet)
test("integer input without gaps comes back as floats", lambda: np.issubdtype(impute_columns([[1, 2], [3, 4]])[0].dtype, np.floating) and np.asarray(impute_columns([[1, 2], [3, 4]])[1]).tolist() == [0, 0])
test("an empty matrix keeps its shape", lambda: impute_columns(np.empty((0, 3)))[0].shape == (0, 3) and np.asarray(impute_columns(np.empty((0, 3)))[1]).tolist() == [0, 0, 0])
try:
    impute_columns([1.0, np.nan, 3.0])
    rejected = False
except ValueError:
    rejected = True
test("one-dimensional input is rejected", lambda: rejected)
@@hint
`missing = np.isnan(values)` is your mask. `(~missing).sum(axis=0)` counts observed values per column, and `np.where(missing, 0.0, values).sum(axis=0)` adds up only the observed ones.
@@hint
Divide with `np.divide(totals, observed, out=np.zeros(values.shape[1]), where=observed > 0)` so empty columns stay 0. Then `np.where(missing, means, values)` broadcasts each column's mean into its gaps; `missing.sum(axis=0)` is the report.
@@q
Why does `X.mean(axis=0)` return NaN for a column with a single missing value?
@@a
NaN propagates through arithmetic: any sum that includes NaN is NaN.
@@q
What does `np.where(mask, means, X)` do when `mask` is (n, d) and `means` is (d,)?
@@a
It broadcasts `means` across the rows: masked cells take their column's mean, every other cell keeps its value.
@@real
scikit-learn's `SimpleImputer(strategy="mean")` does exactly this: fit the column means on training data and reuse them for validation and production. Its `add_indicator=True` keeps "this value was missing" as a feature, which is often predictive on its own.
