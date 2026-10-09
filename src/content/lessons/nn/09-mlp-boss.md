---
id: nn-mlp-boss
track: nn
order: 9
title: "Boss: Train a Network on Two Moons"
tagline: Initialise, forward, backward, update, repeat. Your own network, learning a curve.
kind: boss
xp: 130
minutes: 15
---
@@body
# Boss: the full training loop

Two interleaved crescents cannot be separated by a straight line; a two-layer network learns the curve. You have every piece: `forward` and `backward` from earlier lessons are given. What remains is the loop that ties them together, and the function that turns probabilities into labels.

> **Mission:**
>
> 1. `init_params(d, hidden_size, k, seed)` → `W1` of shape `(d, hidden)` drawn from `rng.normal(0, 1) * sqrt(2 / d)`, `W2` of shape `(hidden, k)` scaled by `sqrt(2 / hidden)`, zero biases, using one `np.random.default_rng(seed)` (W1 first, then W2)
> 2. `train_mlp(X, y, hidden_size=16, lr=1.0, epochs=500, seed=0)` → `(params, losses)`: full-batch gradient descent, recording the loss **after** each update
> 3. `predict(params, X)` → the most probable class per row
>
> The boss requires at least 93% training accuracy on the moons and a final loss below half the first one.
@@starter
import numpy as np

def relu(x):
    return np.maximum(0, x)

def forward(X, params):
    h = relu(X @ params["W1"] + params["b1"])
    logits = h @ params["W2"] + params["b2"]
    exp = np.exp(logits - logits.max(axis=1, keepdims=True))
    probs = exp / exp.sum(axis=1, keepdims=True)
    return probs, {"X": X, "h": h, "probs": probs}

def loss(probs, y):
    return float(-np.log(probs[np.arange(len(y)), y]).mean())

def backward(params, cache, y):
    n, k = cache["probs"].shape
    onehot = np.zeros((n, k))
    onehot[np.arange(n), y] = 1
    dlogits = (cache["probs"] - onehot) / n
    dW2 = cache["h"].T @ dlogits
    db2 = dlogits.sum(axis=0)
    dz1 = (dlogits @ params["W2"].T) * (cache["h"] > 0)
    return {"dW1": cache["X"].T @ dz1, "db1": dz1.sum(axis=0), "dW2": dW2, "db2": db2}

def make_moons(n, noise=0.1, seed=0):
    rng = np.random.default_rng(seed)
    t = rng.uniform(0, np.pi, n // 2)
    outer = np.column_stack([np.cos(t), np.sin(t)])
    inner = np.column_stack([1 - np.cos(t), 1 - np.sin(t) - 0.5])
    X = np.vstack([outer, inner]) + rng.normal(0, noise, (2 * (n // 2), 2))
    y = np.array([0] * (n // 2) + [1] * (n // 2))
    return X, y

def init_params(d, hidden_size, k, seed=0):
    """He-initialised weights, zero biases, from one seeded generator (W1 first)."""
    # TODO
    return {}

def train_mlp(X, y, hidden_size=16, lr=1.0, epochs=500, seed=0):
    """Full-batch gradient descent. Returns (params, losses), one loss per epoch."""
    # TODO
    return {}, []

def predict(params, X):
    """The most probable class for each row."""
    # TODO
    return np.zeros(len(X), dtype=int)

X, y = make_moons(300, noise=0.1, seed=0)
params, losses = train_mlp(X, y)
print("loss: first", round(losses[0], 3), "last", round(losses[-1], 3))
print("training accuracy:", (predict(params, X) == y).mean())
@@solution
import numpy as np

def relu(x):
    return np.maximum(0, x)

def forward(X, params):
    h = relu(X @ params["W1"] + params["b1"])
    logits = h @ params["W2"] + params["b2"]
    exp = np.exp(logits - logits.max(axis=1, keepdims=True))
    probs = exp / exp.sum(axis=1, keepdims=True)
    return probs, {"X": X, "h": h, "probs": probs}

def loss(probs, y):
    return float(-np.log(probs[np.arange(len(y)), y]).mean())

def backward(params, cache, y):
    n, k = cache["probs"].shape
    onehot = np.zeros((n, k))
    onehot[np.arange(n), y] = 1
    dlogits = (cache["probs"] - onehot) / n
    dW2 = cache["h"].T @ dlogits
    db2 = dlogits.sum(axis=0)
    dz1 = (dlogits @ params["W2"].T) * (cache["h"] > 0)
    return {"dW1": cache["X"].T @ dz1, "db1": dz1.sum(axis=0), "dW2": dW2, "db2": db2}

def make_moons(n, noise=0.1, seed=0):
    rng = np.random.default_rng(seed)
    t = rng.uniform(0, np.pi, n // 2)
    outer = np.column_stack([np.cos(t), np.sin(t)])
    inner = np.column_stack([1 - np.cos(t), 1 - np.sin(t) - 0.5])
    X = np.vstack([outer, inner]) + rng.normal(0, noise, (2 * (n // 2), 2))
    y = np.array([0] * (n // 2) + [1] * (n // 2))
    return X, y

def init_params(d, hidden_size, k, seed=0):
    """He-initialised weights, zero biases, from one seeded generator (W1 first)."""
    rng = np.random.default_rng(seed)
    return {
        "W1": rng.normal(0, 1, (d, hidden_size)) * np.sqrt(2 / d),
        "b1": np.zeros(hidden_size),
        "W2": rng.normal(0, 1, (hidden_size, k)) * np.sqrt(2 / hidden_size),
        "b2": np.zeros(k),
    }

def train_mlp(X, y, hidden_size=16, lr=1.0, epochs=500, seed=0):
    """Full-batch gradient descent. Returns (params, losses), one loss per epoch."""
    params = init_params(X.shape[1], hidden_size, int(y.max()) + 1, seed)
    losses = []
    for _ in range(epochs):
        probs, cache = forward(X, params)
        grads = backward(params, cache, y)
        for name in params:
            params[name] = params[name] - lr * grads["d" + name]
        losses.append(loss(forward(X, params)[0], y))
    return params, losses

def predict(params, X):
    """The most probable class for each row."""
    return forward(X, params)[0].argmax(axis=1)

X, y = make_moons(300, noise=0.1, seed=0)
params, losses = train_mlp(X, y)
print("loss: first", round(losses[0], 3), "last", round(losses[-1], 3))
print("training accuracy:", (predict(params, X) == y).mean())
@@check
import numpy as np
P = init_params(2, 5, 3, seed=4)
rng = np.random.default_rng(4)
W1 = rng.normal(0, 1, (2, 5)) * np.sqrt(2 / 2)
W2 = rng.normal(0, 1, (5, 3)) * np.sqrt(2 / 5)
test("init_params: shapes, scaling and seed all match", lambda: set(P) == {"W1", "b1", "W2", "b2"} and np.allclose(P["W1"], W1) and np.allclose(P["W2"], W2) and np.array_equal(P["b1"], np.zeros(5)) and np.array_equal(P["b2"], np.zeros(3)))
Xm, ym = make_moons(300, noise=0.1, seed=2)
params, losses = train_mlp(Xm, ym, hidden_size=16, lr=1.0, epochs=500, seed=0)
test("one loss per epoch, all finite, decreasing to below half the start", lambda: len(losses) == 500 and bool(np.isfinite(losses).all()) and losses[-1] < losses[0] / 2)
test("the loss after epoch 1 is lower than the untrained loss", lambda: losses[0] < loss(forward(Xm, init_params(2, 16, 2, 0))[0], ym))
test("training is reproducible from the seed", lambda: np.allclose(train_mlp(Xm, ym, hidden_size=16, lr=1.0, epochs=40, seed=0)[1], train_mlp(Xm, ym, hidden_size=16, lr=1.0, epochs=40, seed=0)[1]))
test("a different seed trains a different network", lambda: not np.allclose(train_mlp(Xm, ym, epochs=40, seed=1)[1], train_mlp(Xm, ym, epochs=40, seed=0)[1]))
pred = predict(params, Xm)
test("predict returns one integer class per row", lambda: pred.shape == (300,) and set(np.unique(pred)).issubset({0, 1}))
test("the network learns the curve: at least 93% accuracy", lambda: (pred == ym).mean() >= 0.93)
test("a wider hidden layer still works", lambda: (predict(*[train_mlp(Xm, ym, hidden_size=32, epochs=300)[0]], Xm) == ym).mean() >= 0.9)
test("the demo reports its accuracy", lambda: "training accuracy:" in __stdout__ and (predict(params_demo := train_mlp(X, y)[0], X) == y).mean() >= 0.93)
@@hint
`init_params` mirrors the earlier lesson: one `np.random.default_rng(seed)`, `W1` first then `W2`, scaled by `np.sqrt(2 / fan_in)`, biases `np.zeros`.
@@hint
Loop: `probs, cache = forward(X, params)`, `grads = backward(params, cache, y)`, then for each name `params[name] = params[name] - lr * grads["d" + name]`, and `losses.append(loss(forward(X, params)[0], y))`. `predict` is `forward(X, params)[0].argmax(axis=1)`.
@@q
What are the four steps of one training epoch?
@@a
Forward pass, loss and gradients via backward, a parameter update against the gradient, and (optionally) recording the loss.
@@q
Why does a two-layer network separate the moons when a line cannot?
@@a
The hidden layer builds nonlinear features (bent by relu) that make the two crescents linearly separable in the hidden space.
@@real
Swap `np` for `torch`, wrap the parameters in `nn.Module`, and this loop is a real PyTorch training script with `loss.backward()` replacing your `backward`. Mini-batches, Adam and validation checkpoints are the next additions, each a few lines.
