---
id: np-shapes
track: numpy
order: 1
title: Arrays Have a Shape
tagline: A list knows its length. An array knows its geometry.
kind: run
xp: 25
minutes: 4
---
@@body
# Every number has a home address

Embeddings, images, batches of tokens: in AI work everything is an **n-dimensional array**, and the first thing you ask of any array is *"what shape are you?"*

```python
import numpy as np

a = np.arange(6)        # [0 1 2 3 4 5]
a.shape                 # (6,)  -> one axis, six items
a.reshape(2, 3)         # 2 rows x 3 columns, same data
a.reshape(2, 3).sum(axis=0)   # collapse the rows -> one total per column
```

`axis` is the idea to burn into memory: **`axis=0` runs down the rows, `axis=1` runs across the columns**, and the axis you name is the one that *disappears*.

> **Mission:** turn the 12 numbers into a 3 × 4 grid called `grid`, then read the column sums.
@@starter
import numpy as np

a = np.arange(12)
print(a.shape)

# TODO: reshape `a` into 3 rows x 4 columns and store it in `grid`
grid = a

print(grid.shape)
print(grid.sum(axis=0))   # one total per column
@@solution
import numpy as np

a = np.arange(12)
print(a.shape)

grid = a.reshape(3, 4)

print(grid.shape)
print(grid.sum(axis=0))   # one total per column
@@check
test("grid is 3 rows x 4 columns", lambda: grid.shape == (3, 4), "grid.shape should be (3, 4)")
test("no numbers were lost", lambda: int(grid.sum()) == 66)
test("column sums printed", lambda: "[12 15 18 21]" in __stdout__, "print(grid.sum(axis=0)) should show [12 15 18 21]")
@@hint
Arrays have a `.reshape(rows, cols)` method. It returns a new view of the same data.
@@hint
`grid = a.reshape(3, 4)`. Then `axis=0` sums down each column, giving 4 totals.
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
