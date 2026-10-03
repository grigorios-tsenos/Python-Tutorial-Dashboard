---
id: py-embed-cache
track: python
order: 6
title: Never Pay to Embed the Same Text Twice
tagline: A cache in front of an API turns repeated work into a dictionary lookup.
kind: build
xp: 55
minutes: 7
---
@@body
# Cache expensive calls by their input

Embedding APIs charge per token, and real corpora repeat themselves. The same model returns the same vector for the same text, so re-embedding it is pure waste. A cache needs three ideas:

- a `dict` from text to vector
- **dedupe, keep order**: `list(dict.fromkeys(texts))` keeps the first occurrence of each text
- **batch the misses**: one request for every unseen text

> **Mission:** finish `EmbeddingCache`. `embed(texts)` returns one vector per input text, **in input order, duplicates included**:
>
> - send each unseen text to `embed_batch` **once**, together in **one** call, in first-seen order; no call when everything is cached or the input is empty
> - accept any iterable, including a one-shot generator
> - count `misses` (texts sent to the API) and `hits` (every other requested text, repeats included)
> - raise `ValueError` if `embed_batch` returns the wrong number of vectors, caching nothing from that call; if it raises, propagate with nothing cached
>
> Each instance is independent.
@@starter
class EmbeddingCache:
    def __init__(self, embed_batch):
        self.embed_batch = embed_batch   # function: list[str] -> list[vector]
        self.store = {}
        self.hits = 0
        self.misses = 0

    def embed(self, texts):
        """Vectors for texts, in order, sending only unseen texts to embed_batch (in one call)."""
        # TODO: reuse cached vectors; send each unseen text once, in a single call
        return self.embed_batch(list(texts))

calls = []
def fake_embed_batch(texts):
    calls.append(list(texts))
    return [[float(len(t)), float(t.count(" "))] for t in texts]

cache = EmbeddingCache(fake_embed_batch)
cache.embed(["reset password", "refund please", "reset password"])
cache.embed(["refund please", "cancel plan"])
print("API calls:", calls)
print("hits:", cache.hits, "misses:", cache.misses)
@@solution
class EmbeddingCache:
    def __init__(self, embed_batch):
        self.embed_batch = embed_batch   # function: list[str] -> list[vector]
        self.store = {}
        self.hits = 0
        self.misses = 0

    def embed(self, texts):
        """Vectors for texts, in order, sending only unseen texts to embed_batch (in one call)."""
        texts = list(texts)
        unseen = [text for text in dict.fromkeys(texts) if text not in self.store]
        if unseen:
            vectors = self.embed_batch(unseen)
            if len(vectors) != len(unseen):
                raise ValueError(f"expected {len(unseen)} vectors, got {len(vectors)}")
            self.store.update(zip(unseen, vectors))
        self.misses += len(unseen)
        self.hits += len(texts) - len(unseen)
        return [self.store[text] for text in texts]

calls = []
def fake_embed_batch(texts):
    calls.append(list(texts))
    return [[float(len(t)), float(t.count(" "))] for t in texts]

cache = EmbeddingCache(fake_embed_batch)
cache.embed(["reset password", "refund please", "reset password"])
cache.embed(["refund please", "cancel plan"])
print("API calls:", calls)
print("hits:", cache.hits, "misses:", cache.misses)
@@check
sent = []
def api(texts):
    sent.append(list(texts))
    return [[len(t), t.count("a")] for t in texts]

c = EmbeddingCache(api)
first = c.embed(["alpha", "beta", "alpha"])
test("vectors come back in input order, duplicates included", lambda: first == [[5, 2], [4, 1], [5, 2]])
test("duplicates inside one request are sent once", lambda: sent == [["alpha", "beta"]])
second = c.embed(["beta", "gamma", "delta", "gamma"])
test("only unseen texts are sent, together, in first-seen order", lambda: sent == [["alpha", "beta"], ["gamma", "delta"]] and second == [[4, 1], [5, 2], [5, 1], [5, 2]])
test("hits and misses are counted per requested text", lambda: (c.hits, c.misses) == (3, 4))
before = len(sent)
test("a fully cached request makes no API call", lambda: c.embed(["alpha", "delta"]) == [[5, 2], [5, 1]] and len(sent) == before and c.hits == 5)
test("empty input makes no API call", lambda: c.embed([]) == [] and len(sent) == before)
test("a one-shot generator works", lambda: c.embed(t for t in ["omega", "alpha"]) == [[5, 1], [5, 2]] and sent[-1] == ["omega"])
def short_api(texts):
    return [[0.0]]
broken = EmbeddingCache(short_api)
try:
    broken.embed(["x", "y"])
    rejected = False
except ValueError:
    rejected = True
test("a wrong-length reply is rejected and nothing is cached", lambda: rejected and broken.store == {} and broken.misses == 0)
flaky_calls = []
def flaky(texts):
    flaky_calls.append(list(texts))
    if len(flaky_calls) == 1:
        raise TimeoutError("slow")
    return [[1.0] for _ in texts]
f = EmbeddingCache(flaky)
try:
    f.embed(["q"])
    propagated = False
except TimeoutError:
    propagated = True
test("API errors propagate and the text is retried next time", lambda: propagated and f.embed(["q"]) == [[1.0]] and flaky_calls == [["q"], ["q"]])
test("separate caches do not share vectors", lambda: EmbeddingCache(api).store == {} and EmbeddingCache(api).hits == 0)
@@hint
Materialize the input once with `texts = list(texts)`. Then `unseen = [t for t in dict.fromkeys(texts) if t not in self.store]` gives each new text once, in first-seen order.
@@hint
Only call `self.embed_batch(unseen)` when `unseen` is non-empty. Check the reply length before `self.store.update(zip(unseen, vectors))`, then update `misses += len(unseen)` and `hits += len(texts) - len(unseen)` and return `[self.store[t] for t in texts]`.
@@q
How do you deduplicate a list while keeping first-seen order?
@@a
`list(dict.fromkeys(items))`: dict keys are unique and keep insertion order.
@@q
Why send all cache misses in a single call instead of one call per text?
@@a
Batching amortizes per-request latency and overhead; the API embeds many texts at once.
@@real
Production caches key on **(model name, text)**, because vectors from different embedding models are not comparable, and persist to Redis or disk so restarts stay warm. LangChain's `CacheBackedEmbeddings` wraps any embedding model with exactly this logic.
