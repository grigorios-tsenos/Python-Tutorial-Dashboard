---
id: rag-rerank
track: rag
order: 6
title: Rerank the Shortlist
tagline: Retrieve wide and cheap, then let a sharper scorer reorder the few that matter.
kind: build
xp: 55
minutes: 9
---
@@body
# Stage 4, rerank: a second, sharper opinion

Vector search embeds the query and each chunk **separately** and compares the results. That is fast enough for millions of chunks, but coarse: the shipping-times chunk is so full of *delivery* and *days* that it outscores the lost-package chunk for *"My delivery is lost, how many days do I have?"*

A **reranker** reads the query and one candidate **together** and scores the pair. It is too slow for the whole collection, so pipelines run it on a short list:

```
search(query, k=4)   ->  [2, 4, 3, 5]        cheap, wide: recall
pair_score each      ->   0.67 1.0 0.33 0.33  slow, sharp: precision
keep the top 2       ->  [4, 2]
```

This lesson's pair scorer asks one question a separate embedding cannot: **what fraction of the query's concepts does this chunk cover?**

> **Mission:** implement `concepts(text)` (the set of concept ids), `pair_score(query, text)`, `rerank(query, candidates, top=2)` (stable: ties keep retrieval order) and `retrieve_then_rerank(query, n=4, top=2)`.
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

def search(query, k=4):
    """First stage: the k best chunk indices by cosine similarity."""
    scores = CHUNK_VECS @ embed(query)
    return [int(i) for i in np.argsort(-scores, kind="stable")[:k] if scores[i] > 0]

def concepts(text):
    # TODO: the set of concept ids in the text
    return set()

def pair_score(query, text):
    # TODO: fraction of the query's concepts the text covers
    return 0.0

def rerank(query, candidates, top=2):
    # TODO: highest pair_score first, ties in retrieval order
    return candidates[:top]

def retrieve_then_rerank(query, n=4, top=2):
    # TODO: shortlist with search, then rerank
    return []

question = "My delivery is lost, how many days do I have?"
print("retrieved:", search(question))
print("reranked: ", retrieve_then_rerank(question))
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

def search(query, k=4):
    """First stage: the k best chunk indices by cosine similarity."""
    scores = CHUNK_VECS @ embed(query)
    return [int(i) for i in np.argsort(-scores, kind="stable")[:k] if scores[i] > 0]

def concepts(text):
    return {CONCEPTS[t] for t in tokens(text) if t in CONCEPTS}

def pair_score(query, text):
    wanted = concepts(query)
    if not wanted:
        return 0.0
    return len(wanted & concepts(text)) / len(wanted)

def rerank(query, candidates, top=2):
    ranked = sorted(candidates, key=lambda i: -pair_score(query, CHUNKS[i]["text"]))
    return ranked[:top]

def retrieve_then_rerank(query, n=4, top=2):
    return rerank(query, search(query, k=n), top)

question = "My delivery is lost, how many days do I have?"
print("retrieved:", search(question))
print("reranked: ", retrieve_then_rerank(question))
@@check
q = "My delivery is lost, how many days do I have?"
test("concepts is the set of concept ids", lambda: concepts("Refunded to my card, refund!") == {0, 1} and concepts("hello") == set())
test("pair_score is the covered fraction of the query's concepts", lambda: pair_score(q, CHUNKS[4]["text"]) == 1.0 and abs(pair_score(q, CHUNKS[2]["text"]) - 2 / 3) < 1e-9 and pair_score("hello", CHUNKS[0]["text"]) == 0.0)
test("vector search alone puts the shipping chunk first", lambda: search(q) == [2, 4, 3, 5])
test("rerank orders by pair score, ties in retrieval order", lambda: rerank(q, [2, 4, 3, 5], top=4) == [4, 2, 3, 5] and rerank(q, [5, 3], top=2) == [5, 3])
test("rerank does not change its input", lambda: (lambda c: (rerank(q, c), c)[1] == [2, 4, 3, 5])([2, 4, 3, 5]))
test("retrieve_then_rerank fixes the ranking", lambda: retrieve_then_rerank(q) == [4, 2])
test("nothing retrieved, nothing reranked", lambda: retrieve_then_rerank("What is the capital of France?") == [])
test("both rankings are printed", lambda: "retrieved: [2, 4, 3, 5]" in __stdout__ and "reranked:  [4, 2]" in __stdout__)
@@hint
`concepts` is a set comprehension over `tokens(text)` keeping known words. `pair_score` divides the size of the intersection of the two concept sets by the number of query concepts, returning 0.0 when the query has none.
@@hint
`sorted(candidates, key=lambda i: -pair_score(query, CHUNKS[i]["text"]))` is stable, so ties keep retrieval order; slice to `top`.
@@q
Why not run the reranker on every chunk?
@@a
It scores each query-chunk pair separately, so its cost grows with the collection; on a shortlist of tens it is affordable, on millions it is not.
@@q
What does a cross-encoder see that a bi-encoder (embedding) search does not?
@@a
The query and the chunk together, so it can judge how well this chunk answers this question instead of comparing two independent summaries.
@@real
Real rerankers are cross-encoders such as `cross-encoder/ms-marco-MiniLM-L-6-v2` in `sentence-transformers`, Cohere Rerank or BGE-reranker. A common setup retrieves 50 to 100 candidates and keeps the reranked top 3 to 5; LangChain wraps this as `ContextualCompressionRetriever`.
