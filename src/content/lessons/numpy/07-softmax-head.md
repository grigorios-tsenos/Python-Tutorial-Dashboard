---
id: np-softmax
track: numpy
order: 7
title: From Scores to Probabilities
tagline: Every classifier, and every LLM token, ends with a matrix product and a softmax.
kind: build
xp: 55
minutes: 7
---
@@body
# A classification head in two lines

A linear model turns features into one **score (logit)** per class with a single matrix product:

```
X       (n, d)   n tickets, d features
W       (d, k)   one weight column per class
b       (k,)     one bias per class
X @ W + b  ->  (n, k)   one row of k logits per ticket
```

**Softmax** turns each row of logits into probabilities: `exp(z) / sum(exp(z))`, computed **per row** (`axis=1`). An LLM does the same over ~100k vocabulary tokens for every token it writes. The easy-to-miss part is `keepdims=True`:

```python
exp.sum(axis=1)                 # shape (n,)    one total per row, but FLAT
exp.sum(axis=1, keepdims=True)  # shape (n, 1)  the same totals, kept as a column
```

Dividing `(n, k)` scores by flat `(n,)` totals aligns `k` against `n`: an error, or — when `k == n` — a silently wrong division across the wrong axis. The `(n, 1)` column keeps each total next to its row, so broadcasting divides each row by its own total.

The trap: `np.exp(1000)` overflows to `inf`, and `inf / inf` is `nan`. Adding a constant per row doesn't change softmax, so subtract each row's **maximum** first: the largest value becomes `exp(0) = 1` and nothing overflows.

> **Mission:** a support-ticket router. Implement:
>
> 1. `predict_proba(X, W, b)` → an `(n, k)` array where each row is a probability distribution. It must stay finite for huge logits. Reject shapes that don't fit together with `ValueError`: `X` must be `(n, d)`, `W` must be `(d, k)` and `b` must be exactly `(k,)` (a length-1 bias that would silently broadcast is a bug, not a feature). An empty batch `(0, d)` returns `(0, k)`.
> 2. `predict_labels(X, W, b, labels)` → the most likely label for each row, as a list. Ties go to the first label. A label list whose length isn't `k` raises `ValueError`.
@@starter
import numpy as np

def predict_proba(X, W, b):
    """Class probabilities, one row per example."""
    X, W, b = (np.asarray(a, dtype=float) for a in (X, W, b))
    logits = X @ W + b
    # BUG 1: exp overflows for large logits (inf / inf = nan)
    # BUG 2: this divides by the total of the whole batch, not of each row
    exp = np.exp(logits)
    return exp / exp.sum()

def predict_labels(X, W, b, labels):
    """The most likely label for each row."""
    # TODO
    return []

LABELS = ["billing", "bug", "feature"]
# features: mentions of "invoice", "error", "please add"
X = np.array([[2.0, 0.0, 0.0], [0.0, 3.0, 1.0], [0.0, 0.0, 2.0]])
W = np.array([[2.0, -1.0, 0.0], [-0.5, 2.0, 0.0], [0.0, 0.5, 1.5]])
b = np.zeros(3)
print(predict_proba(X, W, b).round(3))
print(predict_labels(X, W, b, LABELS))
@@solution
import numpy as np

def predict_proba(X, W, b):
    """Class probabilities, one row per example."""
    X, W, b = (np.asarray(a, dtype=float) for a in (X, W, b))
    if X.ndim != 2 or W.ndim != 2 or X.shape[1] != W.shape[0] or b.shape != (W.shape[1],):
        raise ValueError("expected X (n, d), W (d, k) and b (k,)")
    logits = X @ W + b
    exp = np.exp(logits - logits.max(axis=1, keepdims=True))
    return exp / exp.sum(axis=1, keepdims=True)

def predict_labels(X, W, b, labels):
    """The most likely label for each row."""
    if len(labels) != np.shape(W)[1]:
        raise ValueError("need exactly one label per class")
    return [labels[i] for i in predict_proba(X, W, b).argmax(axis=1)]

LABELS = ["billing", "bug", "feature"]
# features: mentions of "invoice", "error", "please add"
X = np.array([[2.0, 0.0, 0.0], [0.0, 3.0, 1.0], [0.0, 0.0, 2.0]])
W = np.array([[2.0, -1.0, 0.0], [-0.5, 2.0, 0.0], [0.0, 0.5, 1.5]])
b = np.zeros(3)
print(predict_proba(X, W, b).round(3))
print(predict_labels(X, W, b, LABELS))
@@check
X = np.array([[2.0, 0.0, 0.0], [0.0, 3.0, 1.0], [0.0, 0.0, 2.0]])
W = np.array([[2.0, -1.0, 0.0], [-0.5, 2.0, 0.0], [0.0, 0.5, 1.5]])
b = np.zeros(3)
L = ["billing", "bug", "feature"]
X0, W0, b0 = X.copy(), W.copy(), b.copy()
P = predict_proba(X, W, b)
test("one probability per class for every row", lambda: P.shape == (3, 3))
test("each row is a probability distribution", lambda: np.allclose(P.sum(axis=1), 1) and bool((P >= 0).all()))
test("probabilities follow the logits", lambda: np.allclose(P[0], np.exp([4, -2, 0]) / np.exp([4, -2, 0]).sum()))
test("each ticket gets its most likely label", lambda: predict_labels(X, W, b, L) == ["billing", "bug", "feature"])
huge = predict_proba([[1.0]], [[1000.0, 999.0, -1000.0]], [0.0, 0.0, 0.0])
test("huge logits stay finite (subtract the row max)", lambda: bool(np.isfinite(huge).all()) and np.allclose(huge[0], [1 / (1 + np.exp(-1)), np.exp(-1) / (1 + np.exp(-1)), 0]))
test("adding the same amount to every logit changes nothing", lambda: np.allclose(predict_proba(X, W, b + 50), P))
test("the bias can tip an otherwise neutral ticket", lambda: predict_labels([[0.0, 0.0, 0.0]], W, [0.0, 0.0, 5.0], L) == ["feature"])
test("ties go to the first label", lambda: predict_labels([[0.0, 0.0, 0.0]], W, b, L) == ["billing"])
test("an empty batch keeps the class axis", lambda: predict_proba(np.empty((0, 3)), W, b).shape == (0, 3) and predict_labels(np.empty((0, 3)), W, b, L) == [])
def rejects(fn):
    try:
        fn()
    except ValueError:
        return True
    return False
test("mismatched shapes are rejected", lambda: rejects(lambda: predict_proba(np.ones((2, 2)), W, b)) and rejects(lambda: predict_proba(X, W, [0.0])) and rejects(lambda: predict_proba(X, W, np.zeros((3, 1)))))
test("the label list must match the classes", lambda: rejects(lambda: predict_labels(X, W, b, ["billing", "bug"])))
test("inputs stay unchanged", lambda: np.array_equal(X, X0) and np.array_equal(W, W0) and np.array_equal(b, b0))
@@hint
`logits = X @ W + b` has shape `(n, k)`. Reduce over classes with `axis=1, keepdims=True` so the `(n, 1)` result broadcasts back over every class in its row.
@@hint
Subtract `logits.max(axis=1, keepdims=True)` before `np.exp`, then divide by the row sums. Validate `b.shape == (W.shape[1],)` explicitly, because a length-1 bias would broadcast silently. Labels: `[labels[i] for i in probs.argmax(axis=1)]`.
@@q
Why subtract each row's maximum logit before `np.exp`?
@@a
It prevents overflow (the largest term becomes exp(0) = 1), and softmax is unchanged when every logit in a row shifts by the same amount.
@@q
What shape does `X @ W` have when X is (n, d) and W is (d, k)?
@@a
(n, k): one score per class for every example.
@@real
PyTorch's `torch.softmax(logits, dim=-1)` and `scipy.special.softmax(x, axis=1)` use the same max-subtraction trick. An LLM's **temperature** divides the logits before this softmax: below 1 sharpens the distribution, above 1 flattens it.
