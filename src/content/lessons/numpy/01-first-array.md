---
id: np-first-array
track: numpy
order: 1
title: Your Data Becomes Numbers
tagline: Before any AI magic happens, everything turns into an array.
kind: run
xp: 25
minutes: 4
---
@@body
# The big picture: AI runs on arrays

Every input an AI system touches becomes **a list of numbers** first: a sentence becomes an embedding, an image a grid of pixels, a user a row of features. Everything ahead is arrays underneath.

NumPy's array is a Python list with one superpower: **math applies to every number at once**.

```python
scores = np.array([0.2, 0.5, 0.9])   # a Python list, upgraded
scores + 0.1       # [0.3, 0.6, 1.0]   no loop: every value at once
scores.mean()      # 0.533...          one number for all of them
scores > 0.4       # [False, True, True]
```

You say *what* you want; NumPy does it to everything. One habit from day one: **when in doubt, print it** (`print(scores)`, `print(len(scores))`).

> **Mission:** a search engine returned similarity scores as a plain list. Turn it into an array `scores`, make `boosted` by adding `0.05` to every score at once (no loop), and print the average of `boosted`.
@@starter
import numpy as np

raw = [0.31, 0.68, 0.44, 0.91, 0.27]

# TODO 1: upgrade the list to a NumPy array
scores = raw

# TODO 2: add 0.05 to EVERY score in one line (no loop)
boosted = scores

# TODO 3: print the average of the boosted scores
print(boosted)
@@solution
import numpy as np

raw = [0.31, 0.68, 0.44, 0.91, 0.27]

scores = np.array(raw)

boosted = scores + 0.05

print(boosted.mean())
@@check
import numpy as np
test("scores is a NumPy array, not a list", lambda: isinstance(scores, np.ndarray), "wrap the list: np.array(raw)")
test("the original values are all there", lambda: np.allclose(np.sort(scores), [0.27, 0.31, 0.44, 0.68, 0.91]))
test("boosted adds 0.05 to every score", lambda: isinstance(boosted, np.ndarray) and np.allclose(np.sort(boosted), [0.32, 0.36, 0.49, 0.73, 0.96]))
test("the boosted average is printed", lambda: "0.572" in __stdout__, "print(boosted.mean()) should show 0.572")
test("the raw list is untouched", lambda: raw == [0.31, 0.68, 0.44, 0.91, 0.27])
@@hint
`np.array(some_list)` upgrades a list. After that, `scores + 0.05` already touches every value: that's the whole point of arrays.
@@hint
`scores = np.array(raw)`, `boosted = scores + 0.05`, then `print(boosted.mean())`.
@@q
What happens when you add a number to a NumPy array?
@@a
The number is added to every element at once, with no loop.
@@q
Why do AI systems turn text and images into arrays of numbers?
@@a
Models only compute with numbers; embeddings and pixel grids are how real-world data becomes computable.
@@real
Real embeddings look exactly like this, just longer: `model.encode("hello")` in sentence-transformers returns a NumPy array of 384 floats. The `+ 0.05` you wrote is the same vectorized math that compares millions of embeddings per second.
