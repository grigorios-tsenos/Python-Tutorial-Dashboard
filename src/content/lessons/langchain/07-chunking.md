---
id: lc-chunking
track: langchain
order: 7
title: Split Documents into Overlapping Chunks
tagline: Retrieval can only find what your splitter kept together.
kind: build
xp: 55
minutes: 8
---
@@body
# Chunking: the step before every RAG index

A 40-page runbook cannot be one vector: its meaning averages into mush. RAG **splits** documents into chunks, embeds each, and retrieves only the relevant ones. Two details decide retrieval quality:

- **Overlap.** Consecutive chunks share a few words, so a sentence on a boundary is whole in at least one chunk.
- **Metadata.** Each chunk keeps its source and position, so answers can cite.

```
words:   w0 w1 w2 w3 w4 w5 w6 w7 w8 w9      chunk_size=4, overlap=1  ->  step 3
chunk 0: w0 w1 w2 w3
chunk 1:          w3 w4 w5 w6
chunk 2:                   w6 w7 w8 w9      <- reached the end: stop
```

> **Mission:** implement `split_documents(docs, chunk_size, overlap)` for a list of `Document`s, counting **words** (whitespace-separated):
>
> - each chunk holds up to `chunk_size` words joined by single spaces; consecutive chunks start `chunk_size - overlap` words apart
> - stop once a chunk reaches the last word: no trailing chunk of pure overlap
> - every chunk is a new `Document` whose metadata is a **copy** of the source's plus `chunk` (0-based per document) and `start_word`
> - blank documents produce no chunks; don't modify the inputs
> - require `chunk_size >= 1` and `0 <= overlap < chunk_size`, else `ValueError`

Real splitters count tokens rather than words; the windowing is the same.
@@starter
from langchain_core.documents import Document

def split_documents(docs, chunk_size, overlap):
    """Overlapping word windows; each chunk keeps its source metadata plus its position."""
    # TODO: one Document per window, with chunk and start_word metadata
    return [Document(doc.page_content, doc.metadata) for doc in docs]

runbook = Document(
    "If the nightly job fails, check the Delta table history first. "
    "Restore the last good version before rerunning the pipeline.",
    {"source": "runbook.md"},
)
for chunk in split_documents([runbook], chunk_size=8, overlap=2):
    print(chunk.metadata, "|", chunk.page_content)
@@solution
from langchain_core.documents import Document

def split_documents(docs, chunk_size, overlap):
    """Overlapping word windows; each chunk keeps its source metadata plus its position."""
    if chunk_size < 1 or not 0 <= overlap < chunk_size:
        raise ValueError("need chunk_size >= 1 and 0 <= overlap < chunk_size")
    chunks = []
    for doc in docs:
        words = doc.page_content.split()
        start, number = 0, 0
        while start < len(words):
            text = " ".join(words[start:start + chunk_size])
            chunks.append(Document(text, {**doc.metadata, "chunk": number, "start_word": start}))
            if start + chunk_size >= len(words):
                break
            start += chunk_size - overlap
            number += 1
    return chunks

runbook = Document(
    "If the nightly job fails, check the Delta table history first. "
    "Restore the last good version before rerunning the pipeline.",
    {"source": "runbook.md"},
)
for chunk in split_documents([runbook], chunk_size=8, overlap=2):
    print(chunk.metadata, "|", chunk.page_content)
@@check
ten = Document(" ".join(f"w{i}" for i in range(10)), {"source": "a.md"})
parts = split_documents([ten], 4, 1)
test("windows overlap by exactly `overlap` words", lambda: [c.page_content for c in parts] == ["w0 w1 w2 w3", "w3 w4 w5 w6", "w6 w7 w8 w9"])
test("chunks record their number and first word", lambda: [(c.metadata["chunk"], c.metadata["start_word"]) for c in parts] == [(0, 0), (1, 3), (2, 6)])
test("chunks are Documents that keep the source", lambda: all(isinstance(c, Document) and c.metadata["source"] == "a.md" for c in parts))
seven = Document("a b c d e f g", {"source": "b.md"})
test("no trailing chunk that only repeats overlap", lambda: [c.page_content for c in split_documents([seven], 4, 1)] == ["a b c d", "d e f g"])
test("zero overlap tiles the words", lambda: [c.page_content for c in split_documents([ten], 5, 0)] == ["w0 w1 w2 w3 w4", "w5 w6 w7 w8 w9"])
test("a short document becomes one chunk with normalized spacing", lambda: [c.page_content for c in split_documents([Document("one\n\n two\tthree ", {})], 8, 2)] == ["one two three"])
meta = {"source": "c.md", "team": "data"}
docs = [Document("x y z", meta), Document("   ", {"source": "blank.md"}), Document("p q r s t", {"source": "d.md"})]
many = split_documents(docs, 3, 1)
test("numbering restarts per document and blank documents are skipped", lambda: [(c.metadata["source"], c.metadata["chunk"]) for c in many] == [("c.md", 0), ("d.md", 0), ("d.md", 1)])
test("metadata is copied, never shared or modified", lambda: meta == {"source": "c.md", "team": "data"} and many[0].metadata is not meta and many[0].metadata["team"] == "data")
test("source text is unchanged", lambda: docs[2].page_content == "p q r s t" and ten.metadata == {"source": "a.md"})
def covers(words, size, overlap):
    chunks = split_documents([Document(" ".join(words), {})], size, overlap)
    seen = set()
    for c in chunks:
        seen.update(range(c.metadata["start_word"], c.metadata["start_word"] + len(c.page_content.split())))
    return seen == set(range(len(words))) and chunks[-1].page_content.split()[-1] == words[-1]
test("every word lands in a chunk for other sizes", lambda: covers([str(i) for i in range(23)], 6, 2) and covers([str(i) for i in range(5)], 1, 0))
test("no documents gives no chunks", lambda: split_documents([], 4, 1) == [])
def rejects(size, overlap):
    try:
        split_documents([ten], size, overlap)
    except ValueError:
        return True
    return False
test("invalid sizes are rejected", lambda: rejects(0, 0) and rejects(4, -1) and rejects(4, 4) and rejects(3, 5))
@@hint
Validate first. For each document, `words = doc.page_content.split()` (this also normalizes whitespace). Walk a `start` index forward by `chunk_size - overlap`, taking `words[start:start + chunk_size]` each time.
@@hint
After appending a chunk, `break` when `start + chunk_size >= len(words)`: that chunk already reached the end. Build metadata with `{**doc.metadata, "chunk": number, "start_word": start}` so each chunk gets its own copy.
@@q
Why do chunks overlap?
@@a
So a sentence that straddles a boundary still appears whole in at least one chunk.
@@q
Why keep source metadata on every chunk?
@@a
Retrieval returns chunks, not documents. The metadata lets answers cite and link back to the original source.
@@real
LangChain's `RecursiveCharacterTextSplitter.from_tiktoken_encoder(chunk_size=500, chunk_overlap=50)` splits on paragraphs, then sentences, then words, counting tokens; `add_start_index=True` records each chunk's position. Typical settings: a few hundred tokens with 10–20% overlap.
