---
id: rag-chunking
track: rag
order: 1
title: Chunk by Sentences
tagline: Pack whole sentences under a word budget, with one sentence of overlap.
kind: build
xp: 45
minutes: 8
---
@@body
# Stage 1, data: chunks that keep sentences whole

Retrieval returns **chunks**, never whole documents, so the chunker decides what an answer can ever contain. The word windows from the LangChain chapter cut wherever the count runs out, often mid-sentence. **Sentence-aware chunking** packs whole sentences instead:

```
sentences: [11 words] [10] [5] [5] [2] [6]        max_words = 20, overlap = 1
chunk 0:   [11]                                   11 + 10 would be 21: stop
chunk 1:        [10] [5] [5]                      exactly 20
chunk 2:                 [5] [2] [6]              starts one sentence back: the overlap
```

The overlap repeats the boundary sentence, so a fact that spans two sentences is whole in at least one chunk. A sentence longer than the budget still becomes a chunk on its own: never drop text.

> **Mission:** implement `split_sentences(text)`, `pack(sentences, start, max_words)` (the index just past the last sentence that fits), `chunk_sentences(sentences, max_words, overlap=1)` and `make_chunks(source, text, max_words=20)`, which returns one dict per chunk with `source`, `chunk` (0-based) and `text`.
@@starter
import re

HANDBOOK = (
    "Refunds are issued to the original payment method within 14 days. "
    "Returned items must be unused and in their original packaging. "
    "Sale items cannot be returned! Shipping costs are not refunded. "
    "Need help? Contact support from your account page."
)

def split_sentences(text):
    """Sentences end at . ! or ? followed by whitespace."""
    # TODO
    return [text]

def pack(sentences, start, max_words):
    """Index just past the last sentence that fits, always taking at least one."""
    # TODO
    return start + 1

def chunk_sentences(sentences, max_words, overlap=1):
    """Whole sentences per chunk; neighbouring chunks share `overlap` sentences."""
    # TODO
    return sentences

def make_chunks(source, text, max_words=20):
    """One dict per chunk: where it came from, its position and its text."""
    # TODO
    return []

for c in make_chunks("returns.md", HANDBOOK):
    print(c["chunk"], "|", c["text"])
@@solution
import re

HANDBOOK = (
    "Refunds are issued to the original payment method within 14 days. "
    "Returned items must be unused and in their original packaging. "
    "Sale items cannot be returned! Shipping costs are not refunded. "
    "Need help? Contact support from your account page."
)

def split_sentences(text):
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]

def pack(sentences, start, max_words):
    end, words = start, 0
    while end < len(sentences):
        n = len(sentences[end].split())
        if end > start and words + n > max_words:
            break
        words, end = words + n, end + 1
    return end

def chunk_sentences(sentences, max_words, overlap=1):
    chunks, start, end = [], 0, 0
    while end < len(sentences):
        end = pack(sentences, start, max_words)
        chunks.append(" ".join(sentences[start:end]))
        start = max(end - overlap, start + 1)
    return chunks

def make_chunks(source, text, max_words=20):
    pieces = chunk_sentences(split_sentences(text), max_words)
    return [{"source": source, "chunk": i, "text": t} for i, t in enumerate(pieces)]

for c in make_chunks("returns.md", HANDBOOK):
    print(c["chunk"], "|", c["text"])
@@check
S = split_sentences(HANDBOOK)
test("sentences split after . ! and ?", lambda: len(S) == 6 and S[2] == "Sale items cannot be returned!" and S[4] == "Need help?")
test("blank text gives no sentences", lambda: split_sentences("   ") == [])
test("pack fills up to the word budget", lambda: pack(S, 0, 20) == 1 and pack(S, 1, 20) == 4 and pack(S, 3, 20) == 6)
test("an over-long sentence still gets a chunk", lambda: pack(S, 0, 3) == 1)
C = chunk_sentences(S, 20)
test("chunks hold whole sentences and share one", lambda: C == [S[0], " ".join(S[1:4]), " ".join(S[3:6])])
test("overlap=0 shares nothing", lambda: chunk_sentences(S, 20, overlap=0) == [S[0], " ".join(S[1:4]), " ".join(S[4:6])])
test("no sentences, no chunks", lambda: chunk_sentences([], 20) == [])
M = make_chunks("returns.md", HANDBOOK)
test("each chunk keeps its source and position", lambda: [m["chunk"] for m in M] == [0, 1, 2] and all(m["source"] == "returns.md" for m in M) and M[1]["text"] == C[1])
test("the chunks are printed", lambda: "0 | Refunds" in __stdout__ and "2 | Shipping" in __stdout__)
@@hint
Split with `re.split` on the whitespace that follows `.`, `!` or `?` (a lookbehind keeps the punctuation), strip each piece and drop empty ones. `pack` walks forward adding word counts and stops before the sentence that would exceed the budget, unless it is the first.
@@hint
In `chunk_sentences`, the next chunk starts at `end - overlap`, but never before `start + 1`, or a chunk of one long sentence would loop forever.
@@q
Why do chunks overlap?
@@a
A fact that spans a chunk boundary would otherwise be split in two halves that each retrieve poorly; the shared sentence keeps it whole in at least one chunk.
@@q
What should a chunker do with one sentence longer than the budget?
@@a
Keep it as a chunk on its own. Dropping it would make that text impossible to retrieve.
@@real
LangChain's `RecursiveCharacterTextSplitter` tries paragraph, then sentence, then word boundaries with a `chunk_overlap`; LlamaIndex's `SentenceSplitter` packs whole sentences like this lesson. Budgets are usually counted in tokens, not words, because the embedding model's input limit is in tokens.
