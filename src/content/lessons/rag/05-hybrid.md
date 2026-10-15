---
id: rag-hybrid
track: rag
order: 5
title: Hybrid Search with Rank Fusion
tagline: Vectors catch paraphrases, keywords catch error codes. Fuse the two rankings.
kind: build
xp: 55
minutes: 9
---
@@body
# Stage 3, search: two retrievers are better than one

Each retriever has a blind spot. Vector search understands that a *parcel* is a *package*, but `E42` is not a concept, so an error-code question embeds to nothing. Keyword search finds `E42` instantly, but knows nothing about synonyms. **Hybrid search** runs both and merges their rankings.

Scores from different retrievers are on different scales, so fuse **ranks**, not scores. **Reciprocal rank fusion (RRF)** gives every chunk `1 / (k + rank)` from each list it appears in, with `k = 60`:

```
vector ranking:   [4, 1, 0]        chunk 4 gets 1/61 from here
keyword ranking:  [7]              chunk 7 gets 1/61 from here
fused:            4: 1/61   7: 1/61   1: 1/62   ...     ties keep the lower chunk index first
```

> **Mission:** implement `keyword_scores(query)` (distinct non-stopword query words found in each chunk), `ranking(scores)` (indices best first, dropping zeros), `rrf(rankings, k=60)` and `hybrid_search(query, top=3)`.
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

STOPWORDS = {"a", "an", "the", "is", "are", "my", "i", "do", "does", "what", "how", "to", "of", "for", "on", "in", "it"}

def cosine_scores(query):
    return CHUNK_VECS @ embed(query)

def keyword_scores(query):
    # TODO: per chunk, how many distinct non-stopword query words it contains
    return np.zeros(len(CHUNKS))

def ranking(scores):
    # TODO: indices best first, ties in order, zero scores dropped
    return []

def rrf(rankings, k=60):
    # TODO: chunk indices sorted by summed 1 / (k + rank)
    return []

def hybrid_search(query, top=3):
    # TODO: fuse the vector ranking and the keyword ranking
    return []

for q in ["What does error E42 mean?", "My parcel is lost"]:
    print(q, "->", [CHUNKS[i]["source"] for i in hybrid_search(q)])
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

STOPWORDS = {"a", "an", "the", "is", "are", "my", "i", "do", "does", "what", "how", "to", "of", "for", "on", "in", "it"}

def cosine_scores(query):
    return CHUNK_VECS @ embed(query)

def keyword_scores(query):
    words = set(tokens(query)) - STOPWORDS
    return np.array([len(words & set(tokens(c["text"]))) for c in CHUNKS])

def ranking(scores):
    order = np.argsort(-scores, kind="stable")
    return [int(i) for i in order if scores[i] > 0]

def rrf(rankings, k=60):
    fused = {}
    for ranked in rankings:
        for rank, i in enumerate(ranked, start=1):
            fused[i] = fused.get(i, 0.0) + 1 / (k + rank)
    return sorted(fused, key=lambda i: (-fused[i], i))

def hybrid_search(query, top=3):
    fused = rrf([ranking(cosine_scores(query)), ranking(keyword_scores(query))])
    return fused[:top]

for q in ["What does error E42 mean?", "My parcel is lost"]:
    print(q, "->", [CHUNKS[i]["source"] for i in hybrid_search(q)])
@@check
import numpy as np
test("keyword_scores counts distinct query words, skipping stopwords", lambda: keyword_scores("what does error E42 mean").tolist() == [0, 0, 0, 0, 0, 0, 0, 2, 0] and keyword_scores("the the the").sum() == 0)
test("ranking is best first, stable, and drops zeros", lambda: ranking(np.array([0.0, 0.5, 0.9, 0.5])) == [2, 1, 3] and ranking(np.zeros(3)) == [])
test("rrf sums 1 / (k + rank) across rankings", lambda: rrf([[2, 0], [0, 1]]) == [0, 2, 1] and rrf([[5]], k=0) == [5] and rrf([]) == [])
test("rrf breaks ties by chunk index", lambda: rrf([[3], [1]]) == [1, 3])
test("an error code is found by the keyword side", lambda: hybrid_search("What does error E42 mean?")[0] == 7)
test("a paraphrase is found by the vector side", lambda: hybrid_search("My parcel is lost")[0] == 4)
test("both retrievers agreeing ranks a chunk first", lambda: hybrid_search("reset link E42", top=2) == [7, 6])
test("top limits the results", lambda: len(hybrid_search("shipping refund", top=2)) == 2)
test("the results are printed", lambda: "E42 mean? -> ['account.md']" in __stdout__ and "lost -> ['lost.md'" in __stdout__)
@@hint
Subtract `STOPWORDS` from the query's token set, then intersect it with each chunk's token set and take the size. `ranking` is `np.argsort(-scores, kind="stable")` filtered to positive scores.
@@hint
In `rrf`, `enumerate(ranked, start=1)` gives 1-based ranks; accumulate in a dict with `fused.get(i, 0.0)`, then `sorted(fused, key=lambda i: (-fused[i], i))`.
@@q
Why does RRF fuse ranks instead of adding the raw scores?
@@a
Cosine scores and keyword counts live on different scales; ranks are comparable across any retrievers, and RRF needs no tuning beyond k.
@@q
What kind of query does keyword search handle better than embeddings?
@@a
Exact identifiers the embedding model does not understand: error codes, product SKUs, names and version numbers.
@@real
Production keyword search is BM25 (Elasticsearch, OpenSearch, `rank_bm25`), which also weights rare words higher. Weaviate, Qdrant, Elasticsearch and LangChain's `EnsembleRetriever` all offer hybrid search, and `EnsembleRetriever` fuses with weighted reciprocal rank fusion, `k = 60` by default.
