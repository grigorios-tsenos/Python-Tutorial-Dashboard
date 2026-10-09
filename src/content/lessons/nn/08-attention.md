---
id: nn-attention
track: nn
order: 8
title: Attention in Twenty Lines
tagline: The operation inside every transformer: compare, weigh, mix.
kind: build
xp: 65
minutes: 10
---
@@body
# Queries, keys, values

**Attention** lets each position in a sequence gather information from the others. Every position has a query `q` (what am I looking for?), a key `k` (what do I contain?) and a value `v` (what do I pass on?). Three steps:

```
scores  = Q @ Kᵀ / sqrt(d)        how well each query matches each key   (n, n)
weights = softmax(scores, rows)    each row: a distribution over positions
output  = weights @ V              a weighted mix of the values           (n, d_v)
```

The `sqrt(d)` keeps the scores in a range where softmax is not saturated. A **causal** mask sets every score "in the future" (`j > i`) to `−inf` before the softmax, so position `i` can only look backwards: that is what makes a language model unable to peek at the next token.

> **Mission:** implement `scores(Q, K)`, `attention_weights(Q, K, causal=False)` and `attention(Q, K, V, causal=False)`.
@@starter
import numpy as np

def scores(Q, K):
    """Scaled dot-product scores, shape (n_queries, n_keys)."""
    # TODO
    return np.zeros((len(Q), len(K)))

def attention_weights(Q, K, causal=False):
    """Softmax over each row of the scores; with causal=True, no query sees a later key."""
    # TODO
    return np.zeros((len(Q), len(K)))

def attention(Q, K, V, causal=False):
    """The attention output: weights @ V."""
    # TODO
    return V

rng = np.random.default_rng(0)
X = rng.normal(size=(4, 3))          # 4 tokens, 3 dims
Wq, Wk, Wv = (rng.normal(size=(3, 3)) for _ in range(3))
Q, K, V = X @ Wq, X @ Wk, X @ Wv
print("weights:\n", np.round(attention_weights(Q, K), 2))
print("causal weights:\n", np.round(attention_weights(Q, K, causal=True), 2))
print("output shape:", attention(Q, K, V, causal=True).shape)
@@solution
import numpy as np

def scores(Q, K):
    """Scaled dot-product scores, shape (n_queries, n_keys)."""
    return Q @ K.T / np.sqrt(K.shape[1])

def attention_weights(Q, K, causal=False):
    """Softmax over each row of the scores; with causal=True, no query sees a later key."""
    s = scores(Q, K)
    if causal:
        mask = np.triu(np.ones_like(s, dtype=bool), k=1)
        s = np.where(mask, -np.inf, s)
    s = s - s.max(axis=1, keepdims=True)
    e = np.exp(s)
    return e / e.sum(axis=1, keepdims=True)

def attention(Q, K, V, causal=False):
    """The attention output: weights @ V."""
    return attention_weights(Q, K, causal) @ V

rng = np.random.default_rng(0)
X = rng.normal(size=(4, 3))          # 4 tokens, 3 dims
Wq, Wk, Wv = (rng.normal(size=(3, 3)) for _ in range(3))
Q, K, V = X @ Wq, X @ Wk, X @ Wv
print("weights:\n", np.round(attention_weights(Q, K), 2))
print("causal weights:\n", np.round(attention_weights(Q, K, causal=True), 2))
print("output shape:", attention(Q, K, V, causal=True).shape)
@@check
import numpy as np
Qs = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]])
Ks = np.array([[1.0, 0.0], [0.0, 2.0], [1.0, 1.0]])
Vs = np.array([[10.0, 0.0], [0.0, 10.0], [5.0, 5.0]])
test("scores are Q @ K.T scaled by sqrt(d)", lambda: np.allclose(scores(Qs, Ks), Qs @ Ks.T / np.sqrt(2)))
s = Qs @ Ks.T / np.sqrt(2)
e = np.exp(s - s.max(axis=1, keepdims=True))
test("weights are a softmax over each row", lambda: np.allclose(attention_weights(Qs, Ks), e / e.sum(axis=1, keepdims=True)))
w = attention_weights(Qs, Ks, causal=True)
test("causal weights hide the future and still sum to 1", lambda: np.allclose(np.triu(w, k=1), 0) and np.allclose(w.sum(axis=1), 1) and bool(np.isfinite(w).all()))
test("the first position attends only to itself", lambda: np.allclose(attention(Qs, Ks, Vs, causal=True)[0], Vs[0]))
test("the last position's causal weights match the unmasked ones", lambda: np.allclose(w[-1], attention_weights(Qs, Ks)[-1]))
test("attention mixes the values with the weights", lambda: np.allclose(attention(Qs, Ks, Vs), attention_weights(Qs, Ks) @ Vs))
test("a query identical to one key attends to it most", lambda: attention_weights(np.array([[0.0, 5.0]]), Ks)[0].argmax() == 1)
test("rectangular shapes work: 2 queries, 3 keys, 4-dim values", lambda: attention(np.ones((2, 2)), Ks, np.ones((3, 4))).shape == (2, 4))
test("scaling matters: scores are not plain dot products", lambda: not np.allclose(scores(Qs, Ks), Qs @ Ks.T))
@@hint
`scores`: `Q @ K.T / np.sqrt(K.shape[1])`. Softmax per row: subtract the row max, `np.exp`, divide by the row sum.
@@hint
Causal mask: `mask = np.triu(np.ones_like(s, dtype=bool), k=1)` then `s = np.where(mask, -np.inf, s)` **before** the softmax. `attention` is `attention_weights(Q, K, causal) @ V`.
@@q
What does the causal mask guarantee?
@@a
Position i's output depends only on positions ≤ i, so a model trained to predict the next token cannot cheat by reading it.
@@q
Why divide the scores by sqrt(d)?
@@a
Dot products grow with the dimension; without scaling the softmax saturates and gradients vanish.
@@real
Multi-head attention runs this several times with different projections and concatenates the outputs; `torch.nn.functional.scaled_dot_product_attention(Q, K, V, is_causal=True)` is this function, fused and fast. Everything else in a transformer is linear layers, layer norm and residual connections.
