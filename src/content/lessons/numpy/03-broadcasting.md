---
id: np-broadcast
track: numpy
order: 3
title: Broadcasting Lab
tagline: The rule that deletes your for-loops.
kind: lab
xp: 35
minutes: 6
---
@@body
# Stretching arrays without copying

Multiply a column of 3 prices by a row of 4 discount factors and NumPy *broadcasts*: it virtually stretches each array until the shapes agree, then does the maths for every combination.

**The rule:** align the shapes from the **right**. Two dimensions are compatible when they are **equal** or one of them is **1**. A missing dimension counts as 1.

```
prices     (3, 1)
factors       (4,)   ->  treated as (1, 4)
result     (3, 4)
```

When a result surprises you, `print(a.shape, b.shape)` first. The starter opens the **Broadcast Lab**, which draws both inputs and the stretched result.

> **Mission:** build a full 3 × 4 price table where each row is a product and each column is a discount: `prices * (1 - discounts)`. Store it in `table`.
@@starter
import numpy as np
import orbit

prices = np.array([[10.0], [20.0], [30.0]])   # shape (3, 1)
discounts = np.array([0.0, 0.1, 0.25, 0.5])   # shape (4,)
# TODO 1: factors = the fraction of the price you still pay

# TODO 2: price after each discount, for every product -> shape (3, 4)
table = prices

# Peek at how NumPy stretched the shapes:
orbit.show_broadcast(prices, 1 - discounts, "*")
table
@@solution
import numpy as np
import orbit

prices = np.array([[10.0], [20.0], [30.0]])   # shape (3, 1)
discounts = np.array([0.0, 0.1, 0.25, 0.5])   # shape (4,)
factors = 1 - discounts

table = prices * factors

orbit.show_broadcast(prices, factors, "*")
table
@@check
test("table is 3 x 4", lambda: table.shape == (3, 4), "you need one column per discount: shape (3, 4)")
test("first column is the undiscounted price", lambda: list(table[:, 0]) == [10.0, 20.0, 30.0])
test("30 at 50% off is 15", lambda: table[2, 3] == 15.0)
@@hint
`prices` is (3, 1) and `factors` is (4,). Multiplying them directly already triggers broadcasting.
@@hint
`factors = 1 - discounts`, then `table = prices * factors`. No loop and no `np.tile` needed.
@@q
Shapes `(3, 1)` and `(4,)` broadcast to which shape?
@@a
`(3, 4)`: align from the right, stretch the 1s.
@@q
When can two shapes NOT broadcast?
@@a
When a pair of aligned dimensions differs and neither is 1, e.g. `(3,)` with `(4,)`.
@@real
This is how real vectorised code is written: broadcasting avoids Python loops and extra memory copies. Try `orbit.show_broadcast(np.ones(3), np.ones(4))` to see the error NumPy raises.
