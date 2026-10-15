---
id: rag-embed
track: rag
order: 2
title: Embeddings You Can Read
tagline: Text in, unit vector out: synonyms land in the same place.
kind: build
xp: 45
minutes: 8
---
@@body
# Stage 2, embedding: meaning as a direction

An **embedding model** turns text into a vector so that texts with similar meaning point in similar directions. Real models learn hundreds of opaque dimensions; this chapter uses a toy you can read, where each dimension is one **concept** and a lookup table sends synonyms to the same one:

```
"refunded to my card"      tokens:  refunded  to  my  card
                           concept: 0 (refund)        1 (payment)     unknown words are ignored
counts  [1, 1, 0, 0, ...]  ->  unit length  [0.71, 0.71, 0, 0, ...]
```

Dividing by the length (the L2 norm) makes every vector unit length, so later a plain dot product *is* the cosine similarity, and a long chunk can't win just by repeating words. Text with no known concept stays the zero vector instead of becoming `nan`.

> **Mission:** implement `tokens(text)` (lowercase runs of letters and digits), `count_vector(text)`, `embed(text)` (unit length, zero-safe), and build `CHUNK_VECS`, one embedded row per chunk.
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
    # TODO: lowercase runs of letters and digits
    return text.split()

def count_vector(text):
    # TODO: one count per concept dimension
    return np.zeros(DIM)

def embed(text):
    # TODO: unit length, and the zero vector stays zero
    return count_vector(text)

CHUNK_VECS = np.zeros((len(CHUNKS), DIM))   # TODO

print("matrix:", CHUNK_VECS.shape)
print("refund vs reimbursed:", round(embed("refund") @ embed("reimbursed"), 2))
print("refund vs password:", round(embed("refund") @ embed("password"), 2))
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

def count_vector(text):
    v = np.zeros(DIM)
    for t in tokens(text):
        if t in CONCEPTS:
            v[CONCEPTS[t]] += 1
    return v

def embed(text):
    v = count_vector(text)
    norm = np.linalg.norm(v)
    return v / norm if norm > 0 else v

CHUNK_VECS = np.array([embed(c["text"]) for c in CHUNKS])   # one unit row per chunk

print("matrix:", CHUNK_VECS.shape)
print("refund vs reimbursed:", round(embed("refund") @ embed("reimbursed"), 2))
print("refund vs password:", round(embed("refund") @ embed("password"), 2))
@@check
import numpy as np
test("tokens are lowercase letters and digits", lambda: tokens("Error E42: Reset NOW!") == ["error", "e42", "reset", "now"])
v = count_vector("Refund refunded to my card")
test("count_vector counts concepts, ignoring unknown words", lambda: v.shape == (DIM,) and v[0] == 2 and v[1] == 1 and v.sum() == 3)
test("embed has unit length", lambda: np.isclose(np.linalg.norm(embed("refund to my card")), 1.0))
test("text with no concept stays the zero vector", lambda: np.array_equal(embed("hello there"), np.zeros(DIM)))
test("repetition does not change the direction", lambda: np.allclose(embed("refund"), embed("refund refund refund")))
test("synonyms embed identically", lambda: np.isclose(embed("refund") @ embed("reimbursed"), 1.0))
test("CHUNK_VECS holds one unit row per chunk", lambda: CHUNK_VECS.shape == (len(CHUNKS), DIM) and np.allclose(np.linalg.norm(CHUNK_VECS, axis=1), 1.0) and np.allclose(CHUNK_VECS[4], embed(CHUNKS[4]["text"])))
test("the comparison is printed", lambda: "refund vs reimbursed: 1.0" in __stdout__ and "refund vs password: 0.0" in __stdout__)
@@hint
`re.findall(r"[a-z0-9]+", text.lower())` returns the runs of letters and digits. For the counts, start from `np.zeros(DIM)` and add 1 at `CONCEPTS[t]` for every known token.
@@hint
Divide by `np.linalg.norm(v)` only when the norm is positive. Build the matrix with `np.array([... for c in CHUNKS])`.
@@q
Why normalise embeddings to unit length?
@@a
Then the dot product of two vectors equals their cosine similarity, which compares direction (meaning) and ignores length (how much text there was).
@@q
What does an embedding model have that a keyword match does not?
@@a
Synonyms and paraphrases land close together, so "refunded" can match "reimbursed" with no shared word.
@@real
Production embeddings come from models such as OpenAI `text-embedding-3-small` (1536 dimensions) or open `sentence-transformers` models (384 to 1024). Most return unit-length vectors already, which is why vector databases default to dot-product or cosine distance.
