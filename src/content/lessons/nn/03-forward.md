---
id: nn-forward
track: nn
order: 3
title: The Forward Pass of a Two-Layer Net
tagline: Inputs become hidden features, hidden features become class probabilities.
kind: build
xp: 45
minutes: 8
---
@@body
# Two matrix products and a softmax

A two-layer network (one hidden layer) is:

```
h      = relu(X @ W1 + b1)       (n, d) -> (n, hidden)   features the network invents
logits = h @ W2 + b2             (n, hidden) -> (n, k)   one raw score per class
probs  = softmax(logits)         each row sums to 1
```

Shapes are the whole story: `W1` is `(d, hidden)`, `W2` is `(hidden, k)`, and the biases are one per output column. The **cache** of intermediate values (`X`, `h`, `probs`) is what backpropagation will need later, so the forward pass returns it.

> **Mission:** implement `hidden(X, params)` → `h`, and `forward(X, params)` → `(probs, cache)` where `cache` is a dict with keys `X`, `h` and `probs`. Softmax must subtract each row's maximum before `exp`.

@@step The hidden layer
One product, one bias, one bend:

```python
def hidden(X, params):
    return relu(X @ params["W1"] + params["b1"])
```

**Do:** implement `hidden`, then Run.
@@stepcheck
import numpy as np
P = init_params(2, 3, 2, seed=1)
Xs = np.array([[1.0, -1.0], [0.5, 2.0]])
ref = np.maximum(0, Xs @ P["W1"] + P["b1"])
test("hidden is relu(X @ W1 + b1) with shape (n, hidden)", lambda: hidden(Xs, P).shape == (2, 3) and np.allclose(hidden(Xs, P), ref), 'relu(X @ params["W1"] + params["b1"])')
@@step Logits and a stable softmax
Scores per class, then probabilities per row. Subtract the row maximum first so `exp` cannot overflow (the probabilities are unchanged by that shift):

```python
h = hidden(X, params)
logits = h @ params["W2"] + params["b2"]
shifted = logits - logits.max(axis=1, keepdims=True)
exp = np.exp(shifted)
probs = exp / exp.sum(axis=1, keepdims=True)
```

**Do:** compute `probs` and return `probs, {}` for now, then Run.
@@stepcheck
import numpy as np
P = init_params(2, 3, 2, seed=1)
Xs = np.array([[1.0, -1.0], [0.5, 2.0], [100.0, 100.0]])
probs, _ = forward(Xs, P)
h = np.maximum(0, Xs @ P["W1"] + P["b1"])
logits = h @ P["W2"] + P["b2"]
e = np.exp(logits - logits.max(axis=1, keepdims=True))
test("probs has one distribution per row, matching the reference", lambda: probs.shape == (3, 2) and np.allclose(probs.sum(axis=1), 1) and np.allclose(probs, e / e.sum(axis=1, keepdims=True)) and bool(np.isfinite(probs).all()), "subtract logits.max(axis=1, keepdims=True) before np.exp")
@@step Return the cache
Backprop needs the inputs, the hidden activations and the output probabilities. Pack them:

```python
return probs, {"X": X, "h": h, "probs": probs}
```

**Do:** fill the cache, then Run.
@@stepcheck
import numpy as np
P = init_params(2, 3, 2, seed=1)
Xs = np.array([[1.0, -1.0], [0.5, 2.0]])
probs, cache = forward(Xs, P)
test("the cache holds X, h and probs", lambda: set(cache) == {"X", "h", "probs"} and cache["X"] is Xs and np.allclose(cache["h"], hidden(Xs, P)) and np.allclose(cache["probs"], probs), '{"X": X, "h": h, "probs": probs}')
@@starter
import numpy as np

def relu(x):
    return np.maximum(0, x)

def init_params(d, hidden_size, k, seed=0):
    """Small random weights, zero biases."""
    rng = np.random.default_rng(seed)
    return {
        "W1": rng.normal(0, 1, (d, hidden_size)) * np.sqrt(2 / d),
        "b1": np.zeros(hidden_size),
        "W2": rng.normal(0, 1, (hidden_size, k)) * np.sqrt(2 / hidden_size),
        "b2": np.zeros(k),
    }

def hidden(X, params):
    """relu(X @ W1 + b1)"""
    # TODO
    return X

def forward(X, params):
    """(probs, cache): class probabilities per row, and the values backprop needs."""
    # TODO
    return X, {}

params = init_params(d=2, hidden_size=4, k=3)
X = np.array([[1.0, 2.0], [-1.0, 0.5], [3.0, -2.0]])
probs, cache = forward(X, params)
print(np.round(probs, 3))
print("rows sum to", probs.sum(axis=1))
@@solution
import numpy as np

def relu(x):
    return np.maximum(0, x)

def init_params(d, hidden_size, k, seed=0):
    """Small random weights, zero biases."""
    rng = np.random.default_rng(seed)
    return {
        "W1": rng.normal(0, 1, (d, hidden_size)) * np.sqrt(2 / d),
        "b1": np.zeros(hidden_size),
        "W2": rng.normal(0, 1, (hidden_size, k)) * np.sqrt(2 / hidden_size),
        "b2": np.zeros(k),
    }

def hidden(X, params):
    """relu(X @ W1 + b1)"""
    return relu(X @ params["W1"] + params["b1"])

def forward(X, params):
    """(probs, cache): class probabilities per row, and the values backprop needs."""
    h = hidden(X, params)
    logits = h @ params["W2"] + params["b2"]
    shifted = logits - logits.max(axis=1, keepdims=True)
    exp = np.exp(shifted)
    probs = exp / exp.sum(axis=1, keepdims=True)
    return probs, {"X": X, "h": h, "probs": probs}

params = init_params(d=2, hidden_size=4, k=3)
X = np.array([[1.0, 2.0], [-1.0, 0.5], [3.0, -2.0]])
probs, cache = forward(X, params)
print(np.round(probs, 3))
print("rows sum to", probs.sum(axis=1))
@@check
import numpy as np
P = init_params(2, 3, 2, seed=1)
Xs = np.array([[1.0, -1.0], [0.5, 2.0], [100.0, 100.0]])
h_ref = np.maximum(0, Xs @ P["W1"] + P["b1"])
test("hidden is relu(X @ W1 + b1)", lambda: hidden(Xs, P).shape == (3, 3) and np.allclose(hidden(Xs, P), h_ref) and bool((hidden(Xs, P) >= 0).all()))
probs, cache = forward(Xs, P)
logits = h_ref @ P["W2"] + P["b2"]
e = np.exp(logits - logits.max(axis=1, keepdims=True))
test("probs matches the reference and each row sums to 1", lambda: probs.shape == (3, 2) and np.allclose(probs, e / e.sum(axis=1, keepdims=True)) and np.allclose(probs.sum(axis=1), 1))
test("huge inputs stay finite (max subtraction)", lambda: bool(np.isfinite(probs).all()))
test("the cache holds X, h and probs", lambda: set(cache) == {"X", "h", "probs"} and cache["X"] is Xs and np.allclose(cache["h"], h_ref) and np.allclose(cache["probs"], probs))
test("the demo prints three rows that sum to 1", lambda: "rows sum to [1. 1. 1.]" in __stdout__)
Q = init_params(5, 7, 4, seed=3)
test("other sizes work: (n, 5) -> (n, 4)", lambda: forward(np.ones((6, 5)), Q)[0].shape == (6, 4))
@@hint
`hidden` is one line: `relu(X @ params["W1"] + params["b1"])`. Logits are `h @ params["W2"] + params["b2"]`.
@@hint
Softmax: `shifted = logits - logits.max(axis=1, keepdims=True)`, `exp = np.exp(shifted)`, `probs = exp / exp.sum(axis=1, keepdims=True)`; return `probs, {"X": X, "h": h, "probs": probs}`.
@@q
What shape must W1 have for inputs with d features and a hidden layer of size h?
@@a
(d, h): it maps each d-dimensional row to h hidden values.
@@q
Why subtract the row maximum inside softmax?
@@a
It prevents exp from overflowing on large logits, and the probabilities are unchanged because the shift cancels in the ratio.
@@real
In PyTorch this is `nn.Sequential(nn.Linear(d, h), nn.ReLU(), nn.Linear(h, k))` followed by `F.softmax`. Frameworks keep the cache for you (that is what autograd's computation graph is), but the shapes are exactly these.
