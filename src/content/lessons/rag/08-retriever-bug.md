---
id: rag-retriever-bug
track: rag
order: 8
title: "Bug Hunt: The Backwards Retriever"
tagline: Two quiet bugs that make retrieval return the wrong chunks with plausible scores.
kind: bug
xp: 55
minutes: 8
---
@@body
# When the retriever lies politely

A user asks *"refund to my card"* and the model answers about shipping costs. Nothing crashes: the retriever returns real chunks with real-looking scores. Two bugs hide in three lines:

1. The scores are **filtered before sorting**: `scores[scores > min_score]` builds a shorter array, so position 0 of `keep` is no longer chunk 0, and every index after the first dropped chunk points at the wrong text.
2. `np.argsort` sorts **ascending**, so the least similar chunks come first.

> **Mission:** fix `search` so it returns the `k` best `(chunk index, score)` pairs, best first, keeping only scores above `min_score`, with every index pointing at the chunk its score belongs to.
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

def search(query, k=3, min_score=0.1):
    """The k best (chunk index, score) pairs above min_score."""
    scores = CHUNK_VECS @ embed(query)
    keep = scores[scores > min_score]      # BUG HUNT: filtering first renumbers the positions
    order = np.argsort(keep)[:k]           # BUG HUNT: ascending puts the worst first
    return [(int(i), float(keep[i])) for i in order]

for i, score in search("refund to my card"):
    print(i, round(score, 2), CHUNKS[i]["text"])
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

def search(query, k=3, min_score=0.1):
    """The k best (chunk index, score) pairs above min_score."""
    scores = CHUNK_VECS @ embed(query)
    order = np.argsort(-scores, kind="stable")[:k]
    return [(int(i), float(scores[i])) for i in order if scores[i] > min_score]

for i, score in search("refund to my card"):
    print(i, round(score, 2), CHUNKS[i]["text"])
@@check
import numpy as np
q = "refund to my card"
r = search(q)
test("the best chunk comes first", lambda: r[0][0] == 0 and np.isclose(r[0][1], 0.7071068))
test("every index points at the chunk its score belongs to", lambda: all(np.isclose(sc, CHUNK_VECS[i] @ embed("lost package claim")) for i, sc in search("lost package claim", k=9, min_score=0.0)))
test("results are best first", lambda: [sc for _, sc in search("lost package claim", k=9, min_score=0.0)] == sorted([sc for _, sc in search("lost package claim", k=9, min_score=0.0)], reverse=True))
test("min_score drops weak matches", lambda: all(sc > 0.5 for _, sc in search("lost package claim", k=9, min_score=0.5)) and len(search("lost package claim", k=9, min_score=0.5)) == 1)
test("k limits the results", lambda: len(search("lost package claim", k=2, min_score=0.0)) == 2)
test("an unrelated question returns nothing", lambda: search("What is the capital of France?") == [])
test("the hits are printed", lambda: "0 0.71 Refunds are issued" in __stdout__)
@@hint
Sort the **full** `scores` array so that positions are chunk indices, and filter by `min_score` afterwards, when you build the result list.
@@hint
Best first is `np.argsort(-scores, kind="stable")[:k]`; then keep `(int(i), float(scores[i]))` for each `i` whose score is above `min_score`.
@@q
Why is filtering an array before `argsort` dangerous?
@@a
Boolean indexing returns a new, shorter array, so its positions no longer match the original rows; indices from argsort then refer to the wrong items.
@@q
How can you test that a retriever returns the right chunks, not just plausible ones?
@@a
Recompute each returned score from the returned index (embedding of that chunk times the query) and check they match, and check the scores are in descending order.
@@real
Index misalignment is a classic RAG bug: it also appears when documents are filtered by metadata after embedding, or when a vector store and a document list drift apart. Vector stores avoid it by returning IDs stored with each vector, never array positions.
