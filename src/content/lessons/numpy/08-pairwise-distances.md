---
id: np-pairwise
track: numpy
order: 8
title: Compare Every Vector with Every Other
tagline: Broadcasting turns two sets of points into a whole distance table.
kind: build
xp: 60
minutes: 8
---
@@body
# Build a pairwise distance matrix

Clustering, nearest neighbours and retrieval all compare *sets* of vectors. For `left` of shape `(n, d)` and `right` of shape `(m, d)` the answer is an `(n, m)` table: entry `[i, j]` compares left row `i` with right row `j`.

The **squared Euclidean distance** is the sum of squared coordinate differences. Ranking neighbours needs no square root, so skip it.

The trick is `None` indexing, which inserts **one new axis of length 1**:

```python
left[:, None, :]      # (n, d) -> (n, 1, d)
right[None, :, :]     # (m, d) -> (1, m, d)
```

Those length-1 slots are *room for the other collection*. Subtract the two and broadcasting pairs every left point with every right point.

> **Mission:** implement `pairwise_squared(left, right)` without Python loops. Return a floating-point matrix of all squared distances. Accept different row counts and empty matrices. Reject inputs that are not two-dimensional or have different feature counts with `ValueError`. Do not mutate either input.

@@step Convert to float and reject bad shapes
Inside `pairwise_squared`, start by converting both inputs and checking them:

```python
left = np.asarray(left, dtype=float)
right = np.asarray(right, dtype=float)
if left.ndim != 2 or right.ndim != 2 or left.shape[1] != right.shape[1]:
    raise ValueError("expected matrices with matching feature counts")
```

`dtype=float` is not cosmetic: squaring large integers can overflow silently, while floats carry on. The guard rejects flat vectors and points with different feature counts.

**Do:** add the conversion and the guard, then Run.
@@stepcheck
import numpy as np
B = np.array([[0, 0], [0, 4], [3, 0]])
def rejects(left, right):
    try:
        pairwise_squared(left, right)
    except ValueError:
        return True
    return False
test("incompatible input shapes are rejected", lambda: rejects([1, 2], B) and rejects(np.array([[0, 0], [3, 4]]), [[1, 2, 3]]), "compare ndim and the feature counts, raise ValueError")
@@step Write pair_differences: one difference vector per pair
Write a small helper **above** `pairwise_squared` that returns the `(n, m, d)` block of differences:

```python
def pair_differences(left, right):
    """Shape (n, m, d): entry [i, j] is left[i] - right[j]."""
    return left[:, None, :] - right[None, :, :]
```

Follow the shapes: `(n, 1, d) - (1, m, d)` broadcasts to `(n, m, d)`. Without the `None` axes, `left - right` would pair row 0 with row 0 only, and fail when `n != m`.

**Do:** add the helper, then Run.
@@stepcheck
import numpy as np
A = np.array([[0.0, 0.0], [3.0, 4.0]])
B = np.array([[0.0, 0.0], [0.0, 4.0], [3.0, 0.0]])
D = pair_differences(A, B)
test("pair_differences has one difference vector per pair", lambda: D.shape == (2, 3, 2), "left[:, None, :] - right[None, :, :]")
test("entry [1, 2] is left[1] - right[2]", lambda: np.allclose(D[1, 2], [0.0, 4.0]))
@@step Square, then sum away the feature axis
Square every coordinate difference, then sum over the **last** axis so each pair is left with one number:

```python
return np.sum(pair_differences(left, right) ** 2, axis=-1)   # (n, m, d) -> (n, m)
```

`axis=-1` means "the last axis", which is the feature axis whatever `n` and `m` are. Empty inputs work with no special case: broadcasting an axis of length 0 simply yields an empty table.

**Do:** return the summed squares from `pairwise_squared`, then Run.
@@stepcheck
import numpy as np
A = np.array([[0, 0], [3, 4]])
B = np.array([[0, 0], [0, 4], [3, 0]])
distances = pairwise_squared(A, B)
test("every pair appears in the distance table", lambda: distances.shape == (2, 3) and np.allclose(distances, [[0, 16, 9], [25, 9, 16]]), "np.sum(differences ** 2, axis=-1)")
@@starter
import numpy as np

def pairwise_squared(left, right):
    """Squared distances between every left row and every right row."""
    # TODO
    return np.zeros((len(left), len(right)))

left = np.array([[0, 0], [3, 4]])
right = np.array([[0, 0], [0, 4], [3, 0]])
print(pairwise_squared(left, right))
@@solution
import numpy as np

def pair_differences(left, right):
    """Shape (n, m, d): entry [i, j] is left[i] - right[j]."""
    return left[:, None, :] - right[None, :, :]

def pairwise_squared(left, right):
    """Squared distances between every left row and every right row."""
    left = np.asarray(left, dtype=float)
    right = np.asarray(right, dtype=float)
    if left.ndim != 2 or right.ndim != 2 or left.shape[1] != right.shape[1]:
        raise ValueError("expected matrices with matching feature counts")
    # ponytail: n*m*d temporary values; chunk rows when vector collections outgrow memory.
    return np.sum(pair_differences(left, right) ** 2, axis=-1)

left = np.array([[0, 0], [3, 4]])
right = np.array([[0, 0], [0, 4], [3, 0]])
print(pairwise_squared(left, right))
@@check
A = np.array([[0, 0], [3, 4]])
B = np.array([[0, 0], [0, 4], [3, 0]])
a_copy, b_copy = A.copy(), B.copy()
distances = pairwise_squared(A, B)
test("every pair appears in the distance table", lambda: distances.shape == (2, 3) and np.allclose(distances, [[0, 16, 9], [25, 9, 16]]))
test("swapping inputs transposes the answer", lambda: np.allclose(pairwise_squared(B, A), distances.T))
test("self-distance is zero and the matrix is symmetric", lambda: np.allclose(np.diag(pairwise_squared(B, B)), 0) and np.allclose(pairwise_squared(B, B), pairwise_squared(B, B).T))
test("integer arithmetic does not overflow before conversion", lambda: np.allclose(pairwise_squared([[50000]], [[-50000]]), [[10_000_000_000.0]]) and np.issubdtype(pairwise_squared([[1]], [[2]]).dtype, np.floating))
test("inputs stay unchanged", lambda: np.array_equal(A, a_copy) and np.array_equal(B, b_copy))
test("empty inputs preserve both row dimensions", lambda: pairwise_squared(np.empty((0, 2)), B).shape == (0, 3) and pairwise_squared(A, np.empty((0, 2))).shape == (2, 0))
def rejects(left, right):
    try:
        pairwise_squared(left, right)
    except ValueError:
        return True
    return False
test("incompatible input shapes are rejected", lambda: rejects([1, 2], B) and rejects(A, [[1, 2, 3]]))
@@hint
Convert inputs to float before subtracting. `left[:, None, :] - right[None, :, :]` gives one difference vector per pair.
@@hint
Square those differences and use `.sum(axis=-1)` to remove the feature axis, leaving `(n, m)`. Broadcasting also handles zero rows without a special case.
@@q
Why is the result shaped `(n, m)` instead of `(n, m, d)`?
@@a
Summing over the d features leaves one distance for each pair of rows.
@@q
Why can nearest-neighbour ranking use squared distances?
@@a
Square root preserves the order of non-negative numbers, so it cannot change which point is closest.
@@real
This vectorized form is convenient for modest datasets. For large collections, compare chunks or use a nearest-neighbour index so you do not materialize every pair at once.
