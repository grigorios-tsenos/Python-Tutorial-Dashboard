---
id: np-cosine
track: numpy
order: 8
title: "Boss: Semantic Search in 6 Lines"
tagline: Rank documents by meaning with nothing but NumPy.
kind: boss
xp: 100
minutes: 10
---
@@body
# Boss: build the heart of a vector database

Every RAG system, recommender and semantic search engine does one thing at its core: *find the rows of a matrix most similar to a query vector*. Similarity here is **cosine similarity**: the angle between two vectors, ignoring their length.

```
cos(a, b) = (a · b) / (‖a‖ ‖b‖)
```

Why not just the dot product? Because a long, off-topic vector can out-score a short, perfectly aligned one. The starter below has that bug built in.

> **Mission:** finish `top_k(query, matrix, k)`. It must return the **row indices** of the `k` rows most cosine-similar to `query`, best first. Do it for all rows at once, with no Python loops.

The boss checks new data too: zero-length vectors have similarity `0`, ties keep the original row order, `k <= 0` returns no indices, and oversized `k` returns every available row. Keep the input arrays unchanged.
@@starter
import numpy as np

def top_k(query, matrix, k):
    """Indices of the k rows of `matrix` most cosine-similar to `query`, best first."""
    # BUG: a raw dot product rewards long vectors. Normalise first.
    scores = matrix @ query
    return np.argsort(-scores)[:k]

docs = np.array([
    [1.0, 0.0, 0.0],
    [0.9, 0.1, 0.0],
    [30.0, 30.0, 0.0],   # long but only 45 degrees off
    [0.0, 0.0, 1.0],
    [-1.0, 0.0, 0.0],
])
query = np.array([1.0, 0.05, 0.0])
print(top_k(query, docs, 3))
@@solution
import numpy as np

def top_k(query, matrix, k):
    """Indices of the k rows of `matrix` most cosine-similar to `query`, best first."""
    norms = np.linalg.norm(matrix, axis=1) * np.linalg.norm(query)
    scores = np.divide(matrix @ query, norms, out=np.zeros(len(matrix)), where=norms != 0)
    return np.argsort(-scores, kind="stable")[:max(0, k)]

docs = np.array([
    [1.0, 0.0, 0.0],
    [0.9, 0.1, 0.0],
    [30.0, 30.0, 0.0],   # long but only 45 degrees off
    [0.0, 0.0, 1.0],
    [-1.0, 0.0, 0.0],
])
query = np.array([1.0, 0.05, 0.0])
print(top_k(query, docs, 3))
@@check
import numpy as np
D = np.array([[1.0, 0.0, 0.0], [0.9, 0.1, 0.0], [30.0, 30.0, 0.0], [0.0, 0.0, 1.0], [-1.0, 0.0, 0.0]])
Q = np.array([1.0, 0.05, 0.0])
test("best match is the aligned row, not the longest", lambda: int(top_k(Q, D, 1)[0]) == 0, "row 0 points the same way as the query; row 2 is just longer")
test("top 3 in order", lambda: [int(i) for i in top_k(Q, D, 3)] == [0, 1, 2])
test("returns exactly k indices", lambda: len(top_k(Q, D, 2)) == 2)
test("scale-invariant", lambda: [int(i) for i in top_k(Q * 1000, D, 3)] == [0, 1, 2], "multiplying the query by 1000 must not change the ranking")
test("works for a single-row matrix", lambda: [int(i) for i in top_k(Q, D[:1], 1)] == [0])
edge = np.array([[0.0, 0.0], [1.0, 0.0], [2.0, 0.0], [-1.0, 0.0]])
original = edge.copy()
test("zero rows and tied scores rank predictably", lambda: [int(i) for i in top_k(np.array([1.0, 0.0]), edge, 10)] == [1, 2, 0, 3])
test("zero query keeps the original row order", lambda: [int(i) for i in top_k(np.zeros(2), edge, 3)] == [0, 1, 2])
test("non-positive k returns no indices", lambda: len(top_k(Q, D, 0)) == 0 and len(top_k(Q, D, -2)) == 0)
test("empty matrix returns no indices", lambda: len(top_k(Q, np.empty((0, 3)), 2)) == 0)
test("input vectors stay unchanged", lambda: np.array_equal(edge, original) and np.array_equal(Q, np.array([1.0, 0.05, 0.0])))
@@hint
Cosine scores are `(matrix @ query) / (row_norms * query_norm)`. Use `np.divide(..., out=np.zeros(len(matrix)), where=norms != 0)` to give zero vectors a score of `0`.
@@hint
`np.argsort(-scores, kind="stable")` keeps row order when scores tie. Slice with `[:max(0, k)]`: a negative Python slice would otherwise keep unwanted rows.
@@q
Why use cosine similarity instead of a raw dot product for embeddings?
@@a
It ignores vector length and compares direction (meaning) only, so long vectors don't win unfairly.
@@q
What does `keepdims=True` do in `np.linalg.norm(m, axis=1, keepdims=True)`?
@@a
Keeps the result as shape (n, 1) instead of (n,), so it broadcasts against the (n, d) matrix.
@@real
Production vector stores (FAISS, pgvector, Databricks Vector Search) use the same maths with approximate indexes for speed. Pre-normalising your vectors once turns cosine similarity into a plain dot product.
