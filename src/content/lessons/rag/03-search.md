---
id: rag-search
track: rag
order: 3
title: Top-k Cosine Search
tagline: One matrix product scores every chunk; argsort picks the best.
kind: build
xp: 45
minutes: 7
---
@@body
# Stage 3, search: score everything, keep the best k

With unit-length vectors, cosine similarity is a dot product, and the dot products of a query with every chunk are one matrix product:

```
CHUNK_VECS (9, 13)  @  embed(query) (13,)   ->   scores (9,)      one cosine per chunk
np.argsort(-scores, kind="stable")[:k]       ->   the k best rows, ties in chunk order
```

Two guards make a search usable: `k` larger than the collection returns everything (and `k <= 0` nothing), and a **minimum score** drops chunks that share nothing with the query, so a question about something the documents never mention gets no context instead of random context.

> **Mission:** implement `cosine_scores(query)`, `top_k(scores, k)` (indices, best first, stable) and `search(query, k=3, min_score=0.0)`, which returns `(chunk index, score)` pairs whose score is above `min_score`.
@@starter
import re
import numpy as np

CONCEPTS = {   # word -> concept dimension; synonyms share one
    "refund": 0, "refunds": 0, "refunded": 0, "reimbursed": 0,
    "payment": 1, "card": 1, "charged": 1,
    "days": 2, "day": 2, "hours": 2, "minutes": 2, "long": 2, "week": 2,
    "shipping": 3, "ship": 3, "shipped": 3, "delivery": 3, "delivered": 3, "arrives": 3,
    "package": 4, "parcel": 4, "order": 4, "orders": 4, "item": 4, "items": 4,
    "missing": 5, "lost": 5, "stolen": 5,
    "claim": 6, "report": 6,
    "replacement": 7, "replace": 7, "resend": 7,
    "password": 8, "login": 8, "reset": 8, "locked": 8,
    "link": 9, "email": 9,
    "warranty": 10, "defects": 10, "defect": 10, "repair": 10,
    "damage": 11, "damaged": 11, "accidental": 11, "broken": 11,
    "return": 12, "returns": 12, "returned": 12, "unused": 12, "packaging": 12,
}
DIM = max(CONCEPTS.values()) + 1

CHUNKS = [
    {"source": "returns.md", "text": "Refunds are issued to the original payment method within 14 days of the return."},
    {"source": "returns.md", "text": "Returned items must be unused and in their original packaging."},
    {"source": "shipping.md", "text": "Standard shipping takes 3 to 5 days. Express delivery arrives the next day."},
    {"source": "shipping.md", "text": "Orders over 50 euros ship free. Shipping costs are not refunded."},
    {"source": "lost.md", "text": "If a package is marked delivered but is missing, file a claim within 7 days."},
    {"source": "lost.md", "text": "After a claim is approved we ship a replacement at no cost."},
    {"source": "account.md", "text": "Reset your password from the login page. The reset link expires after 30 minutes."},
    {"source": "account.md", "text": "Error E42 means the reset link was already used. Request a new one."},
    {"source": "warranty.md", "text": "Electronics carry a two year warranty against defects, not accidental damage."},
]

def tokens(text):
    return re.findall(r"[a-z0-9]+", text.lower())

def embed(text):
    """Unit-length concept counts: a readable stand-in for an embedding model."""
    v = np.zeros(DIM)
    for t in tokens(text):
        if t in CONCEPTS:
            v[CONCEPTS[t]] += 1
    norm = np.linalg.norm(v)
    return v / norm if norm > 0 else v

CHUNK_VECS = np.array([embed(c["text"]) for c in CHUNKS])   # one unit row per chunk

def cosine_scores(query):
    # TODO: one cosine similarity per chunk
    return np.zeros(len(CHUNKS))

def top_k(scores, k):
    # TODO: indices of the k best scores, best first, ties in order
    return list(range(k))

def search(query, k=3, min_score=0.0):
    # TODO: (index, score) pairs above min_score
    return []

for i, score in search("How do I reset my password?"):
    print(round(score, 2), CHUNKS[i]["source"], "|", CHUNKS[i]["text"])
@@solution
import re
import numpy as np

CONCEPTS = {   # word -> concept dimension; synonyms share one
    "refund": 0, "refunds": 0, "refunded": 0, "reimbursed": 0,
    "payment": 1, "card": 1, "charged": 1,
    "days": 2, "day": 2, "hours": 2, "minutes": 2, "long": 2, "week": 2,
    "shipping": 3, "ship": 3, "shipped": 3, "delivery": 3, "delivered": 3, "arrives": 3,
    "package": 4, "parcel": 4, "order": 4, "orders": 4, "item": 4, "items": 4,
    "missing": 5, "lost": 5, "stolen": 5,
    "claim": 6, "report": 6,
    "replacement": 7, "replace": 7, "resend": 7,
    "password": 8, "login": 8, "reset": 8, "locked": 8,
    "link": 9, "email": 9,
    "warranty": 10, "defects": 10, "defect": 10, "repair": 10,
    "damage": 11, "damaged": 11, "accidental": 11, "broken": 11,
    "return": 12, "returns": 12, "returned": 12, "unused": 12, "packaging": 12,
}
DIM = max(CONCEPTS.values()) + 1

CHUNKS = [
    {"source": "returns.md", "text": "Refunds are issued to the original payment method within 14 days of the return."},
    {"source": "returns.md", "text": "Returned items must be unused and in their original packaging."},
    {"source": "shipping.md", "text": "Standard shipping takes 3 to 5 days. Express delivery arrives the next day."},
    {"source": "shipping.md", "text": "Orders over 50 euros ship free. Shipping costs are not refunded."},
    {"source": "lost.md", "text": "If a package is marked delivered but is missing, file a claim within 7 days."},
    {"source": "lost.md", "text": "After a claim is approved we ship a replacement at no cost."},
    {"source": "account.md", "text": "Reset your password from the login page. The reset link expires after 30 minutes."},
    {"source": "account.md", "text": "Error E42 means the reset link was already used. Request a new one."},
    {"source": "warranty.md", "text": "Electronics carry a two year warranty against defects, not accidental damage."},
]

def tokens(text):
    return re.findall(r"[a-z0-9]+", text.lower())

def embed(text):
    """Unit-length concept counts: a readable stand-in for an embedding model."""
    v = np.zeros(DIM)
    for t in tokens(text):
        if t in CONCEPTS:
            v[CONCEPTS[t]] += 1
    norm = np.linalg.norm(v)
    return v / norm if norm > 0 else v

CHUNK_VECS = np.array([embed(c["text"]) for c in CHUNKS])   # one unit row per chunk

def cosine_scores(query):
    return CHUNK_VECS @ embed(query)

def top_k(scores, k):
    order = np.argsort(-scores, kind="stable")
    return [int(i) for i in order[:max(k, 0)]]

def search(query, k=3, min_score=0.0):
    scores = cosine_scores(query)
    return [(i, float(scores[i])) for i in top_k(scores, k) if scores[i] > min_score]

for i, score in search("How do I reset my password?"):
    print(round(score, 2), CHUNKS[i]["source"], "|", CHUNKS[i]["text"])
@@check
import numpy as np
q = "How do I reset my password?"
test("cosine_scores is one matrix-vector product", lambda: cosine_scores(q).shape == (len(CHUNKS),) and np.allclose(cosine_scores(q), [CHUNK_VECS[i] @ embed(q) for i in range(len(CHUNKS))]))
test("top_k returns the best indices, ties in order", lambda: top_k(np.array([0.2, 0.9, 0.9, 0.1]), 2) == [1, 2] and all(isinstance(i, int) for i in top_k(np.array([0.5, 0.1]), 2)))
test("k beyond the collection or below 1 is safe", lambda: top_k(np.array([0.2, 0.9]), 10) == [1, 0] and top_k(np.array([0.2, 0.9]), 0) == [] and top_k(np.array([0.2, 0.9]), -1) == [])
r = search(q)
test("the password chunk ranks first", lambda: r[0][0] == 6 and r[1][0] == 7 and len(r) == 2)
test("scores are floats, best first", lambda: all(isinstance(sc, float) for _, sc in r) and r[0][1] >= r[1][1])
test("min_score drops weak matches", lambda: [i for i, _ in search(q, min_score=0.8)] == [6])
test("an unrelated question finds nothing", lambda: search("What is the capital of France?") == [])
test("the results are printed", lambda: "account.md | Reset your password" in __stdout__)
@@hint
Because every row of `CHUNK_VECS` and every embedding has unit length, `CHUNK_VECS @ embed(query)` is already the cosine similarity of each chunk.
@@hint
Negate the scores to sort best first: `np.argsort(-scores, kind="stable")`, then slice with `max(k, 0)` and convert each index with `int`. In `search`, keep `(i, float(scores[i]))` only when `scores[i] > min_score`.
@@q
Why sort `-scores` instead of `scores`?
@@a
`np.argsort` sorts ascending; negating the scores puts the highest similarity first.
@@q
What does a minimum score protect against?
@@a
Retrieving unrelated chunks for a question the documents cannot answer, which would push the model to answer from irrelevant context.
@@real
Vector databases (FAISS, pgvector, Chroma, Pinecone) do this same scoring, but use approximate nearest-neighbour indexes such as HNSW so they never compare the query with all of millions of rows. LangChain exposes the threshold as `search_type="similarity_score_threshold"`.
