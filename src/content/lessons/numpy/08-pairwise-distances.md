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

Clustering, nearest neighbours and retrieval all compare sets of vectors. If `left` has shape `(n, d)` and `right` has shape `(m, d)`, the answer has shape `(n, m)`: entry `[i, j]` compares row `i` with row `j`.

The **squared Euclidean distance** is the sum of squared coordinate differences. You can rank neighbours without taking a square root.

> **Mission:** implement `pairwise_squared(left, right)` without Python loops. Return a floating-point matrix of all squared distances. Accept different row counts and empty matrices. Reject inputs that are not two-dimensional or have different feature counts with `ValueError`. Do not mutate either input.

### What `None` actually does (nothing scary)

Indexing with `None` inserts **one new axis of length 1**. No numbers are added, removed or changed; the same values get one more layer of brackets:

```python
v = np.array([3.0, 4.0])   # shape (2,)      [3. 4.]
v[None, :]                  # shape (1, 2)    [[3. 4.]]   same two numbers, inside one row
left[:, None, :]            # (n, d) -> (n, 1, d)
```

Read `left[:, None, :]` out loud, one slot per axis: "**keep** every left point (`:`), **insert** an empty slot (`None`), **keep** every coordinate (`:`)". That empty slot is *room for the other collection*.

### Why bother? Compare what you get with and without it

```python
left  = np.array([[0., 0.], [3., 4.]])          # 2 points
right = np.array([[0., 0.], [0., 4.], [3., 0.]]) # 3 points

left - right                      # ERROR: (2, 2) vs (3, 2) don't line up
left[:, None, :] - right[None, :, :]   # (2, 1, 2) - (1, 3, 2) -> (2, 3, 2): ALL pairs
```

That is the real implication: **without** the `None` axes, subtraction can only pair row 0 with row 0, row 1 with row 1 (and errors outright when the counts differ). **With** them, broadcasting stretches each length-1 slot, so every left point meets every right point. The warm-up above walks this exact alignment: `n` meets `1`, `1` meets `m`, `d` meets `d`.

When any step confuses you, **print the shape after every line** and compare it with this chain:

```
(n, 1, d) - (1, m, d)  ->  (n, m, d)   one difference vector per pair
   ... ** 2             ->  (n, m, d)   still per coordinate
   ... .sum(axis=-1)    ->  (n, m)      coordinates collapse: one distance per pair
```

Only after the differences exist do you square them and sum away the `d` coordinates, leaving the `(n, m)` distance table.
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

def pairwise_squared(left, right):
    """Squared distances between every left row and every right row."""
    left = np.asarray(left, dtype=float)
    right = np.asarray(right, dtype=float)
    if left.ndim != 2 or right.ndim != 2 or left.shape[1] != right.shape[1]:
        raise ValueError("expected matrices with matching feature counts")
    # ponytail: n*m*d temporary values; chunk rows when vector collections outgrow memory.
    differences = left[:, None, :] - right[None, :, :]
    return np.sum(differences ** 2, axis=-1)

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
test("integer arithmetic does not overflow before conversion", lambda: np.allclose(pairwise_squared([[50000]], [[-50000]]), [[10_000_000_000.0]]))
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
