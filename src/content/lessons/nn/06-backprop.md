---
id: nn-backprop
track: nn
order: 6
title: Backpropagation by Hand
tagline: The chain rule, applied layer by layer, backwards. Verified against finite differences.
kind: build
xp: 60
minutes: 10
---
@@body
# Gradients flow backwards through the cache

The forward pass computed `h = relu(X @ W1 + b1)`, `logits = h @ W2 + b2`, `probs = softmax(logits)` and the mean cross-entropy loss. Backprop runs the chain rule in reverse, one layer at a time, reusing the cached values:

```
dlogits = (probs − onehot(y)) / n       softmax + cross-entropy have this famous joint gradient
dW2 = hᵀ @ dlogits        db2 = dlogits.sum(axis=0)
dh  = dlogits @ W2ᵀ
dz1 = dh · (h > 0)                      relu passes gradient only where it was active
dW1 = Xᵀ @ dz1            db1 = dz1.sum(axis=0)
```

Every gradient has the shape of the parameter it belongs to. The check compares yours with **numerical** gradients from finite differences, the gold standard.

> **Mission:** implement `output_grad(probs, y)` → `dlogits`, and `backward(params, cache, y)` → a dict with `dW1`, `db1`, `dW2`, `db2`. `forward` and `loss` are given.
@@starter
import numpy as np

def relu(x):
    return np.maximum(0, x)

def init_params(d, hidden_size, k, seed=0):
    rng = np.random.default_rng(seed)
    return {"W1": rng.normal(0, 1, (d, hidden_size)) * np.sqrt(2 / d), "b1": np.zeros(hidden_size),
            "W2": rng.normal(0, 1, (hidden_size, k)) * np.sqrt(2 / hidden_size), "b2": np.zeros(k)}

def forward(X, params):
    h = relu(X @ params["W1"] + params["b1"])
    logits = h @ params["W2"] + params["b2"]
    exp = np.exp(logits - logits.max(axis=1, keepdims=True))
    probs = exp / exp.sum(axis=1, keepdims=True)
    return probs, {"X": X, "h": h, "probs": probs}

def loss(probs, y):
    """Mean cross-entropy of the true classes."""
    return float(-np.log(probs[np.arange(len(y)), y]).mean())

def output_grad(probs, y):
    """dloss/dlogits for softmax + mean cross-entropy: (probs - onehot) / n."""
    # TODO
    return probs

def backward(params, cache, y):
    """Gradients dW1, db1, dW2, db2 with the shapes of their parameters."""
    # TODO
    return {name: np.zeros_like(value) for name, value in params.items()}

params = init_params(2, 4, 3)
X = np.array([[1.0, 2.0], [-1.0, 0.5], [3.0, -2.0], [0.2, 0.1]])
y = np.array([0, 1, 2, 1])
probs, cache = forward(X, params)
print("loss:", loss(probs, y))
for name, value in backward(params, cache, y).items():
    print(name, value.shape, "mean |grad| =", np.abs(value).mean().round(4))
@@solution
import numpy as np

def relu(x):
    return np.maximum(0, x)

def init_params(d, hidden_size, k, seed=0):
    rng = np.random.default_rng(seed)
    return {"W1": rng.normal(0, 1, (d, hidden_size)) * np.sqrt(2 / d), "b1": np.zeros(hidden_size),
            "W2": rng.normal(0, 1, (hidden_size, k)) * np.sqrt(2 / hidden_size), "b2": np.zeros(k)}

def forward(X, params):
    h = relu(X @ params["W1"] + params["b1"])
    logits = h @ params["W2"] + params["b2"]
    exp = np.exp(logits - logits.max(axis=1, keepdims=True))
    probs = exp / exp.sum(axis=1, keepdims=True)
    return probs, {"X": X, "h": h, "probs": probs}

def loss(probs, y):
    """Mean cross-entropy of the true classes."""
    return float(-np.log(probs[np.arange(len(y)), y]).mean())

def output_grad(probs, y):
    """dloss/dlogits for softmax + mean cross-entropy: (probs - onehot) / n."""
    n, k = probs.shape
    onehot = np.zeros((n, k))
    onehot[np.arange(n), y] = 1
    return (probs - onehot) / n

def backward(params, cache, y):
    """Gradients dW1, db1, dW2, db2 with the shapes of their parameters."""
    dlogits = output_grad(cache["probs"], y)
    dW2 = cache["h"].T @ dlogits
    db2 = dlogits.sum(axis=0)
    dh = dlogits @ params["W2"].T
    dz1 = dh * (cache["h"] > 0)
    dW1 = cache["X"].T @ dz1
    db1 = dz1.sum(axis=0)
    return {"dW1": dW1, "db1": db1, "dW2": dW2, "db2": db2}

params = init_params(2, 4, 3)
X = np.array([[1.0, 2.0], [-1.0, 0.5], [3.0, -2.0], [0.2, 0.1]])
y = np.array([0, 1, 2, 1])
probs, cache = forward(X, params)
print("loss:", loss(probs, y))
for name, value in backward(params, cache, y).items():
    print(name, value.shape, "mean |grad| =", np.abs(value).mean().round(4))
@@check
import numpy as np
p = np.array([[0.7, 0.3], [0.2, 0.8], [0.5, 0.5]])
test("output_grad is (probs - onehot) / n", lambda: np.allclose(output_grad(p, np.array([0, 0, 1])), (p - np.array([[1, 0], [1, 0], [0, 1]])) / 3))
P = init_params(2, 3, 2, seed=2)
Xs = np.array([[1.0, -1.0], [0.5, 2.0], [-2.0, 0.3], [0.1, 0.1]])
ys = np.array([0, 1, 1, 0])
probs, cache = forward(Xs, P)
g = backward(P, cache, ys)
def numgrad(name):
    out = np.zeros_like(P[name])
    it = np.nditer(P[name], flags=["multi_index"])
    for _ in it:
        i = it.multi_index
        old = P[name][i]
        P[name][i] = old + 1e-5; lp = loss(forward(Xs, P)[0], ys)
        P[name][i] = old - 1e-5; lm = loss(forward(Xs, P)[0], ys)
        P[name][i] = old
        out[i] = (lp - lm) / 2e-5
    return out
test("every gradient has its parameter's shape", lambda: all(g["d" + n].shape == P[n].shape for n in ("W1", "b1", "W2", "b2")))
test("dW2 and db2 match finite differences", lambda: np.allclose(g["dW2"], numgrad("W2"), atol=1e-6) and np.allclose(g["db2"], numgrad("b2"), atol=1e-6))
test("dW1 and db1 match finite differences", lambda: np.allclose(g["dW1"], numgrad("W1"), atol=1e-6) and np.allclose(g["db1"], numgrad("b1"), atol=1e-6))
test("one descent step lowers the loss", lambda: loss(forward(Xs, {n: P[n] - 0.5 * g["d" + n] for n in P})[0], ys) < loss(probs, ys))
Q = init_params(3, 5, 4, seed=5)
Xq = np.random.default_rng(1).normal(size=(6, 3))
yq = np.array([0, 1, 2, 3, 1, 2])
gq = backward(Q, forward(Xq, Q)[1], yq)
test("other sizes work", lambda: gq["dW1"].shape == (3, 5) and gq["dW2"].shape == (5, 4))
test("the demo prints the four gradient shapes", lambda: "dW1 (2, 4)" in __stdout__ and "db2 (3,)" in __stdout__)
@@hint
`onehot = np.zeros((n, k)); onehot[np.arange(n), y] = 1` builds the targets. `dW2 = cache["h"].T @ dlogits` and `db2 = dlogits.sum(axis=0)`.
@@hint
`dh = dlogits @ params["W2"].T`, `dz1 = dh * (cache["h"] > 0)`, `dW1 = cache["X"].T @ dz1`, `db1 = dz1.sum(axis=0)`. Return them in a dict keyed `dW1, db1, dW2, db2`.
@@q
Why is the gradient of softmax + cross-entropy simply probs − onehot?
@@a
The two derivatives cancel almost entirely when combined; the result is the difference between the predicted and the true distribution, which is why this pairing is standard.
@@q
What does multiplying by (h > 0) do during backprop?
@@a
It applies relu's slope: gradient passes through units that were active and is blocked for units that output zero.
@@real
`loss.backward()` in PyTorch performs these exact operations by walking the recorded graph in reverse. Writing it once by hand is how you understand vanishing gradients, dead relus and why initialisation matters.
