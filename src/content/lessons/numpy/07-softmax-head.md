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

A linear classifier turns features into one **logit** (raw score) per class with a single matrix product, then **softmax** turns each row of logits into probabilities:

```
X @ W + b        (n, d) @ (d, k) + (k,)  ->  (n, k)   k logits per ticket
exp(z) / sum(exp(z))   per row              ->  (n, k)   k probabilities per ticket
```

Every classifier ends like this, and so does every LLM: the next token is a softmax over the vocabulary.

> **Mission:** a support-ticket router.
>
> 1. `predict_proba(X, W, b)` → an `(n, k)` array, each row a probability distribution, finite for huge logits. `X` must be `(n, d)`, `W` `(d, k)` and `b` exactly `(k,)`, else `ValueError`. An empty `(0, d)` batch returns `(0, k)`.
> 2. `predict_labels(X, W, b, labels)` → the most likely label per row, as a list; ties go to the first label. A label list whose length isn't `k` raises `ValueError`.

@@step Normalize each row, not the whole batch
The starter divides by `exp.sum()`: the total of the entire batch, so the three rows together add to 1 instead of each row. Sum per row and keep the result as a column:

```python
exp.sum(axis=1)                 # (n,)    flat: lines up against k, not n
exp.sum(axis=1, keepdims=True)  # (n, 1)  a column: each total stays beside its row
```

Divide by the `(n, 1)` version and broadcasting divides each row by its own total.

**Do:** fix the division so every row sums to 1, then Run and check the printed rows.
@@stepcheck
import numpy as np
X = np.array([[2.0, 0.0, 0.0], [0.0, 3.0, 1.0], [0.0, 0.0, 2.0]])
W = np.array([[2.0, -1.0, 0.0], [-0.5, 2.0, 0.0], [0.0, 0.5, 1.5]])
P = predict_proba(X, W, np.zeros(3))
test("each row is a probability distribution", lambda: P.shape == (3, 3) and np.allclose(P.sum(axis=1), 1), "divide by exp.sum(axis=1, keepdims=True)")
@@step Subtract the row maximum before exp
`np.exp(1000)` overflows to `inf`, and `inf / inf` is `nan`. Softmax does not change when you add the same constant to every logit in a row, so shift each row so its largest logit is 0:

```python
exp = np.exp(logits - logits.max(axis=1, keepdims=True))
```

Now the biggest term is `exp(0) = 1` and nothing overflows.

**Do:** apply the shift, then Run. The step check feeds logits of 1000.
@@stepcheck
import numpy as np
huge = predict_proba([[1.0]], [[1000.0, 999.0, -1000.0]], [0.0, 0.0, 0.0])
test("huge logits stay finite", lambda: bool(np.isfinite(huge).all()) and np.allclose(huge[0], [1 / (1 + np.exp(-1)), np.exp(-1) / (1 + np.exp(-1)), 0]), "subtract logits.max(axis=1, keepdims=True) before np.exp")
@@step Validate the shapes explicitly
A bias of shape `(1,)` or `(k, 1)` would broadcast *silently* and produce nonsense. NumPy only complains when shapes cannot be stretched, so check them yourself:

```python
if X.ndim != 2 or W.ndim != 2 or X.shape[1] != W.shape[0] or b.shape != (W.shape[1],):
    raise ValueError("expected X (n, d), W (d, k) and b (k,)")
```

**Do:** add the guard before the matrix product, then Run.
@@stepcheck
import numpy as np
W = np.array([[2.0, -1.0, 0.0], [-0.5, 2.0, 0.0], [0.0, 0.5, 1.5]])
X = np.array([[2.0, 0.0, 0.0], [0.0, 3.0, 1.0], [0.0, 0.0, 2.0]])
def rejects(fn):
    try:
        fn()
    except ValueError:
        return True
    return False
test("a bias that would broadcast silently is rejected", lambda: rejects(lambda: predict_proba(X, W, [0.0])) and rejects(lambda: predict_proba(X, W, np.zeros((3, 1)))), "check b.shape == (W.shape[1],)")
@@step Pick the most likely label per row
`argmax(axis=1)` returns the column index of the largest value in each row; ties go to the first. Map indices to names with a list comprehension, after checking there is exactly one label per class:

```python
if len(labels) != np.shape(W)[1]:
    raise ValueError("need exactly one label per class")
return [labels[i] for i in predict_proba(X, W, b).argmax(axis=1)]
```

**Do:** implement `predict_labels`, then Run.
@@stepcheck
import numpy as np
X = np.array([[2.0, 0.0, 0.0], [0.0, 3.0, 1.0], [0.0, 0.0, 2.0]])
W = np.array([[2.0, -1.0, 0.0], [-0.5, 2.0, 0.0], [0.0, 0.5, 1.5]])
L = ["billing", "bug", "feature"]
test("each ticket gets its most likely label", lambda: predict_labels(X, W, np.zeros(3), L) == ["billing", "bug", "feature"], "[labels[i] for i in probs.argmax(axis=1)]")
test("ties go to the first label", lambda: predict_labels([[0.0, 0.0, 0.0]], W, np.zeros(3), L) == ["billing"])
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
