---
id: py-batches
track: python
order: 5
title: Batch a Streaming Dataset
tagline: Read just enough for the next request, then pause.
kind: build
xp: 50
minutes: 6
---
@@body
# Small batches from a source you cannot rewind

An embedding API accepts several texts per request. Your dataset might be a generator reading a huge file: converting it to a list first defeats streaming and can exhaust memory.

Python's `itertools` module already contains `batched(iterable, n)`. It returns an iterator of tuples, reading at most `n` items for each batch. Use the standard library rather than rebuilding its buffering logic.

> **Mission:** fix `batches(items, size=3)` so it returns a lazy iterator of tuples, in original order. Keep a partial final batch. It must work with one-shot generators and infinite sources: creating the iterator reads no items, and requesting its first batch reads only that batch. `size <= 0` raises `ValueError`.

Empty input produces no batches. The checker watches how many source items were read, not just the eventual output.
@@starter
from itertools import batched

def batches(items, size=3):
    """Lazily group items into tuples of at most size items."""
    # BUG: this consumes the whole source and creates a single oversized batch.
    return iter([tuple(items)])

texts = (f"document {i}" for i in range(8))
print(list(batches(texts, 3)))
@@solution
from itertools import batched

def batches(items, size=3):
    """Lazily group items into tuples of at most size items."""
    return batched(items, size)

texts = (f"document {i}" for i in range(8))
print(list(batches(texts, 3)))
@@check
from itertools import count, islice
test("full and partial batches preserve order", lambda: list(batches(range(8), 3)) == [(0, 1, 2), (3, 4, 5), (6, 7)])
test("default size and empty source work", lambda: list(batches(["a", "b", "c", "d"])) == [("a", "b", "c"), ("d",)] and list(batches([], 2)) == [])
seen = []
def source():
    for i in range(7):
        seen.append(i)
        yield i
groups = batches(source(), 3)
test("creating a batch iterator reads nothing", lambda: seen == [])
first = next(groups)
test("the first request reads exactly one batch", lambda: first == (0, 1, 2) and seen == [0, 1, 2])
rest = list(groups)
test("one-shot sources are consumed once without lost items", lambda: rest == [(3, 4, 5), (6,)] and seen == list(range(7)))
def guarded_infinite():
    for item in count(10):
        if item >= 17:
            raise AssertionError("the source was read past the requested batches")
        yield item
test("unbounded sources are read only for requested batches", lambda: list(islice(batches(guarded_infinite(), 2), 3)) == [(10, 11), (12, 13), (14, 15)])
def rejects(size):
    try:
        list(batches([1, 2], size))
    except ValueError:
        return True
    return False
test("invalid batch sizes are rejected", lambda: rejects(0) and rejects(-1))
@@hint
`batched(items, size)` already returns the lazy iterator you need. Do not wrap `items` in `list()` or `tuple()` first.
@@hint
Return `batched(items, size)` directly. It preserves order, retains the partial final tuple, and validates that the size is positive.
@@q
Why does `list(source)` before batching defeat a streaming pipeline?
@@a
It reads and stores the whole source immediately, so memory grows with the dataset instead of the batch size.
@@q
What happens to a final batch with fewer than size items?
@@a
It is still returned, as a shorter tuple, so no remaining records are dropped.
@@real
Batching is useful for embedding requests, database writes and streaming transforms. It bounds how much source data each step reads; a separate concurrency limit controls how many batches are being processed at once.
