---
id: np-views
track: numpy
order: 4
title: The Slice That Bites Back
tagline: Change one array, secretly change another.
kind: predict
xp: 25
minutes: 3
answer: 1
---
@@body
# Predict the output

Slicing a NumPy array does **not** copy. It returns a *view*: a window onto the same memory. That makes NumPy fast — and causes some of the most confusing bugs in data science.

Read the code and commit to a guess before the output unlocks.
@@starter
import numpy as np

a = np.arange(5)
b = a[1:4]
b[0] = 99
print(a)
@@choice
[0 1 2 3 4]
@@choice
[ 0 99  2  3  4]
@@choice
[99  1  2  3  4]
@@choice
[ 0  1  2  3  4 99]
@@explain
`b` is a **view** of `a[1:4]`, so `b[0]` *is* `a[1]`. Writing 99 through `b` changes `a`. Use `a[1:4].copy()` when you want independence.
@@hint
Ask yourself: does `b = a[1:4]` make new memory, or point at the old memory?
@@hint
Index 0 of `b` is index 1 of `a`.
@@q
How do you get an independent copy of a slice?
@@a
`a[1:4].copy()`
@@q
Slicing with `a[1:4]` returns a view or a copy?
@@a
A view: it shares memory with `a`, so writes show up in both.
