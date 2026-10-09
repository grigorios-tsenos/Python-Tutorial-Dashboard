---
id: nn-train-bug
track: nn
order: 7
title: "Bug Hunt: The Loss That Goes Up"
tagline: Two one-character bugs that every practitioner has shipped at least once.
kind: bug
xp: 55
minutes: 8
---
@@body
# When training makes things worse

A single neuron (logistic regression) is trained on two clearly separable clusters, and the loss climbs every epoch. Two bugs hide in six lines:

1. The gradient is **summed** over the batch instead of averaged, so the step size grows with the dataset: 200 examples make the step 200× too large.
2. The update **adds** the gradient (`w += lr · dw`), climbing the loss instead of descending it.

> **Mission:** fix `gradient` so it returns the **mean** gradient over the batch, and fix `train` so it steps against the gradient. Afterwards the loss must fall below half its starting value and the accuracy must exceed 0.9.

@@step Average the gradient over the batch
The loss is a mean over examples, so its gradient is too. Divide both parts by the batch size:

```python
n = len(y)
return X.T @ (p - y) / n, (p - y).sum() / n
```

**Do:** fix `gradient`, then Run. (The loss still climbs; that is the next bug.)
@@stepcheck
import numpy as np
Xs = np.array([[1.0, 2.0], [-1.0, 0.5], [0.3, -0.7]])
ys = np.array([1, 0, 1])
w0, b0 = np.array([0.2, -0.1]), 0.05
p = sigmoid(Xs @ w0 + b0)
dw, db = gradient(w0, b0, Xs, ys)
test("the gradient is averaged over the batch", lambda: np.allclose(dw, Xs.T @ (p - ys) / 3) and np.isclose(db, (p - ys).sum() / 3), "divide both by len(y)")
@@step Step downhill
The update rule is `w ← w − lr · dw`. Flip the sign on both lines:

```python
w -= lr * dw
b -= lr * db
```

**Do:** fix the update, then Run. The loss should drop quickly and the accuracy reach 1.0.
@@stepcheck
import numpy as np
w, b, losses = train(X, y, lr=0.5, epochs=200)
test("the loss falls below half its starting value", lambda: losses[-1] < losses[0] / 2 and losses[-1] < losses[len(losses) // 2], "w -= lr * dw; b -= lr * db")
test("the trained neuron classifies the clusters", lambda: ((sigmoid(X @ w + b) > 0.5).astype(int) == y).mean() > 0.9)
@@starter
import numpy as np

def sigmoid(x):
    return 0.5 * (1 + np.tanh(x / 2))

def loss(w, b, X, y):
    p = sigmoid(X @ w + b)
    return float(-np.mean(y * np.log(p + 1e-12) + (1 - y) * np.log(1 - p + 1e-12)))

def gradient(w, b, X, y):
    """dloss/dw, dloss/db for the mean cross-entropy."""
    p = sigmoid(X @ w + b)
    # BUG HUNT: summed over the batch, so the step grows with the dataset
    return X.T @ (p - y), (p - y).sum()

def train(X, y, lr=0.5, epochs=200):
    w, b = np.zeros(X.shape[1]), 0.0
    losses = []
    for _ in range(epochs):
        dw, db = gradient(w, b, X, y)
        # BUG HUNT: this climbs the loss
        w += lr * dw
        b += lr * db
        losses.append(loss(w, b, X, y))
    return w, b, losses

rng = np.random.default_rng(0)
X = np.vstack([rng.normal([-2, -2], 1, (100, 2)), rng.normal([2, 2], 1, (100, 2))])
y = np.array([0] * 100 + [1] * 100)
w, b, losses = train(X, y)
print("loss: first", round(losses[0], 3), "last", round(losses[-1], 3))
print("accuracy:", ((sigmoid(X @ w + b) > 0.5).astype(int) == y).mean())
@@solution
import numpy as np

def sigmoid(x):
    return 0.5 * (1 + np.tanh(x / 2))

def loss(w, b, X, y):
    p = sigmoid(X @ w + b)
    return float(-np.mean(y * np.log(p + 1e-12) + (1 - y) * np.log(1 - p + 1e-12)))

def gradient(w, b, X, y):
    """dloss/dw, dloss/db for the mean cross-entropy."""
    p = sigmoid(X @ w + b)
    n = len(y)
    return X.T @ (p - y) / n, (p - y).sum() / n

def train(X, y, lr=0.5, epochs=200):
    w, b = np.zeros(X.shape[1]), 0.0
    losses = []
    for _ in range(epochs):
        dw, db = gradient(w, b, X, y)
        w -= lr * dw
        b -= lr * db
        losses.append(loss(w, b, X, y))
    return w, b, losses

rng = np.random.default_rng(0)
X = np.vstack([rng.normal([-2, -2], 1, (100, 2)), rng.normal([2, 2], 1, (100, 2))])
y = np.array([0] * 100 + [1] * 100)
w, b, losses = train(X, y)
print("loss: first", round(losses[0], 3), "last", round(losses[-1], 3))
print("accuracy:", ((sigmoid(X @ w + b) > 0.5).astype(int) == y).mean())
@@check
import numpy as np
Xs = np.array([[1.0, 2.0], [-1.0, 0.5], [0.3, -0.7]])
ys = np.array([1, 0, 1])
w0, b0 = np.array([0.2, -0.1]), 0.05
p = sigmoid(Xs @ w0 + b0)
dw, db = gradient(w0, b0, Xs, ys)
test("the gradient is averaged over the batch", lambda: np.allclose(dw, Xs.T @ (p - ys) / 3) and np.isclose(db, (p - ys).sum() / 3))
h = 1e-5
num = [(loss(w0 + np.eye(2)[i] * h, b0, Xs, ys) - loss(w0 - np.eye(2)[i] * h, b0, Xs, ys)) / (2 * h) for i in range(2)]
test("the gradient matches finite differences of the loss", lambda: np.allclose(dw, num, atol=1e-5))
w, b, losses = train(X, y, lr=0.5, epochs=200)
test("the loss falls every few epochs and ends far below the start", lambda: losses[-1] < losses[0] / 2 and losses[-1] < 0.1)
test("the trained neuron separates the clusters", lambda: ((sigmoid(X @ w + b) > 0.5).astype(int) == y).mean() > 0.95)
test("weights point from the negative cluster to the positive one", lambda: w[0] > 0 and w[1] > 0)
test("200 losses were recorded and all are finite", lambda: len(losses) == 200 and bool(np.isfinite(losses).all()))
test("the summary is printed", lambda: "accuracy:" in __stdout__)
@@hint
A mean loss has a mean gradient: divide `X.T @ (p - y)` and `(p - y).sum()` by `len(y)`.
@@hint
Gradient *descent* subtracts: `w -= lr * dw` and `b -= lr * db`.
@@q
Why does summing the gradient over the batch cause trouble?
@@a
The effective step size scales with the batch size, so a learning rate that works for 10 examples explodes for 1000.
@@q
What is the quickest diagnostic that an update rule has the wrong sign?
@@a
The loss rises monotonically from the first epoch; a correct step must lower the loss for a small enough learning rate.
@@real
PyTorch's `optimizer.step()` always subtracts, and losses are means by default (`reduction="mean"`), which is why these bugs usually appear in hand-written training loops and custom losses. Plotting the loss curve after the first few steps catches both in seconds.
