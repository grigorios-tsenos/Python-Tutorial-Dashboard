---
id: nn-neuron
track: nn
order: 1
title: A Neuron Is a Dot Product
tagline: Weights, a bias, a squash. Every network is this, repeated.
kind: run
xp: 25
minutes: 5
---
@@body
# The smallest unit of a neural network

A **neuron** takes an input vector, multiplies each entry by a weight, adds the products up, adds a bias, and squashes the result into a range. That is it:

```
z = w · x + b            a weighted sum: the dot product plus a bias
a = sigmoid(z)           squashed into (0, 1): a probability-like activation
```

With a batch of inputs stacked as rows of `X`, the same thing is one matrix product: `X @ w + b` gives one `z` per row. Everything in this chapter is these two lines, stacked and repeated.

> **Mission:** compute `z` for one input, implement `sigmoid` and apply it to get `a`, then compute `A` for a batch of three inputs at once.
@@starter
import numpy as np

w = np.array([0.5, -1.0])     # one weight per input feature
b = 0.5                       # the bias
x = np.array([2.0, 1.0])      # one input

# TODO 1: the weighted sum
z = 0

# TODO 2: a sigmoid function, and a = sigmoid(z)
a = 0

# TODO 3: the same for a batch of three inputs at once
X = np.array([[2.0, 1.0], [0.0, 0.0], [-1.0, 2.0]])
Z = 0
A = 0

print("z =", z, " a =", a)
print("Z =", Z)
print("A =", A)
@@solution
import numpy as np

w = np.array([0.5, -1.0])     # one weight per input feature
b = 0.5                       # the bias
x = np.array([2.0, 1.0])      # one input

z = w @ x + b

def sigmoid(t):
    return 1 / (1 + np.exp(-t))

a = sigmoid(z)

X = np.array([[2.0, 1.0], [0.0, 0.0], [-1.0, 2.0]])
Z = X @ w + b
A = sigmoid(Z)

print("z =", z, " a =", a)
print("Z =", Z)
print("A =", A)
@@check
import numpy as np
test("z is the dot product plus the bias", lambda: np.isclose(z, 0.5))
test("sigmoid squashes into (0, 1) and is vectorised", lambda: np.isclose(sigmoid(0), 0.5) and sigmoid(10) > 0.99 and sigmoid(-10) < 0.01 and sigmoid(np.array([0.0, 0.0])).shape == (2,))
test("a is sigmoid(z)", lambda: np.isclose(a, 0.6224593))
test("Z holds one weighted sum per row", lambda: np.allclose(Z, [0.5, 0.5, -2.0]))
test("A squashes each one", lambda: A.shape == (3,) and np.allclose(A, 1 / (1 + np.exp(-np.array([0.5, 0.5, -2.0])))))
test("everything is printed", lambda: "z = 0.5" in __stdout__ and "A =" in __stdout__)
@@hint
`w @ x` is the dot product. For the batch, `X @ w` gives one dot product per row and `+ b` broadcasts.
@@hint
`def sigmoid(t): return 1 / (1 + np.exp(-t))` works for scalars and arrays alike.
@@q
What are the three operations inside one neuron?
@@a
A weighted sum of the inputs, plus a bias, then a nonlinear squash such as the sigmoid.
@@q
Why does `X @ w + b` work for a whole batch?
@@a
Matrix multiplication computes every row's dot product at once, and the bias broadcasts to every row.
@@real
A logistic regression *is* this neuron. PyTorch's `nn.Linear(2, 1)` stores exactly `w` and `b`, and `torch.sigmoid` is the squash; the batch dimension is always the first axis, as here.
