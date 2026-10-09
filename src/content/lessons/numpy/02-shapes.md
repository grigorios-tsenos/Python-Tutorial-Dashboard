---
id: np-shapes
track: numpy
order: 2
title: Arrays Have a Shape
tagline: A list knows its length. An array knows its geometry.
kind: run
xp: 25
minutes: 4
---
@@body
# Every array has a shape

Embeddings, images, batches of tokens: everything is an **n-dimensional array**. The first question to ask any array is *what shape are you?*

```python
a = np.arange(6)              # [0 1 2 3 4 5]
a.shape                       # (6,)   one axis, six items
a.reshape(2, 3)               # 2 rows x 3 columns, same six numbers
a.reshape(2, 3).sum(axis=0)   # [3 5 7]  one total per column
```

The rule to remember: **the axis you name is the one that disappears.** `axis=0` collapses the rows, leaving one number per column. `axis=1` collapses the columns, leaving one number per row.

> **Mission:** turn the 12 numbers into a 3 × 4 grid called `grid`, then print one total per column and one total per row.

@@step Give the 12 numbers rows and columns
`a` is flat: shape `(12,)`. `reshape` lays the same numbers out as a grid without copying them:

```python
grid = a.reshape(3, 4)
```

- `3, 4` means 3 rows and 4 columns. The counts must multiply to 12, or NumPy refuses.
- Reading order is unchanged: row 0 is `0 1 2 3`, row 1 is `4 5 6 7`, and so on.

**Do:** replace `grid = a` with the line above and Run. Watch `grid.shape` change from `(12,)` to `(3, 4)`.
@@stepcheck
test("grid is 3 rows x 4 columns", lambda: grid.shape == (3, 4), "grid = a.reshape(3, 4)")
test("no numbers were lost", lambda: int(grid.sum()) == 66)
@@step Read the column totals
The cell already prints `grid.sum(axis=0)`. With a real grid it shows **four** numbers, one per column, because axis 0 (the rows) collapsed:

```
0 1 2 3
4 5 6 7       sum(axis=0)  ->  [12 15 18 21]
8 9 10 11
```

Column 0 is `0 + 4 + 8 = 12`. Check the printed output matches before moving on.

**Do:** confirm the output shows `[12 15 18 21]`. If it still shows `66`, `grid` is not a grid yet.
@@stepcheck
test("column sums printed", lambda: "[12 15 18 21]" in __stdout__, "print(grid.sum(axis=0)) should show [12 15 18 21]")
@@step Print one total per row
Now collapse the other axis. Naming `axis=1` removes the columns, so three numbers remain, one per row:

```python
print(grid.sum(axis=1))   # [ 6 22 38]
```

Row 0 is `0 + 1 + 2 + 3 = 6`. Same grid, different axis, different question answered.

**Do:** add the line above at the end of the cell, then Run.
@@stepcheck
test("row sums printed", lambda: "[ 6 22 38]" in __stdout__, "print(grid.sum(axis=1)) should show [ 6 22 38]")
@@starter
import numpy as np

a = np.arange(12)
print(a.shape)

# TODO 1: reshape `a` into 3 rows x 4 columns and store it in `grid`
grid = a

print(grid.shape)
print(grid.sum(axis=0))   # one total per column

# TODO 2: print one total per ROW
@@solution
import numpy as np

a = np.arange(12)
print(a.shape)

grid = a.reshape(3, 4)

print(grid.shape)
print(grid.sum(axis=0))   # one total per column

print(grid.sum(axis=1))   # one total per row
@@check
test("grid is 3 rows x 4 columns", lambda: grid.shape == (3, 4), "grid.shape should be (3, 4)")
test("no numbers were lost", lambda: int(grid.sum()) == 66)
test("column sums printed", lambda: "[12 15 18 21]" in __stdout__, "print(grid.sum(axis=0)) should show [12 15 18 21]")
test("row sums printed", lambda: "[ 6 22 38]" in __stdout__, "print(grid.sum(axis=1)) should show [ 6 22 38]")
@@hint
Arrays have a `.reshape(rows, cols)` method. It returns a new view of the same data.
@@hint
`grid = a.reshape(3, 4)`. Then `axis=0` sums down each column (4 totals) and `axis=1` sums across each row (3 totals).
@@q
In `arr.sum(axis=0)` on a 3 x 4 array, what is the result's shape?
@@a
`(4,)`: axis 0 (the rows) is collapsed, leaving one total per column.
@@q
What does `.reshape(3, 4)` do to the underlying data?
@@a
Nothing: it gives a new shape over the same values (usually a view, not a copy).
@@real
Real NumPy behaves exactly like this: `pip install numpy`. You can also pass `-1` to let NumPy infer a dimension, e.g. `a.reshape(3, -1)`.
