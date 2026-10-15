---
id: rag-dot-or-cosine
track: rag
order: 4
title: Dot Product or Cosine?
tagline: A long chunk that mentions the topic twice versus a short one that is only about it.
kind: predict
xp: 30
minutes: 4
answer: 0
---
@@body
# Predict the output

Two chunks are compared with the query `refund`, using **raw count vectors** over three concepts: refund, shipping and time. The short chunk is entirely about refunds; the long one is a shipping FAQ that mentions refunds twice.

Each line prints the chunk's name, its raw dot product with the query, and its cosine similarity rounded to two decimals. What comes out?
@@starter
import numpy as np

query = np.array([1.0, 0.0, 0.0])        # refund, shipping, time
short = np.array([1.0, 0.0, 1.0])        # "Refunds take 14 days."
long = np.array([2.0, 5.0, 3.0])         # a shipping FAQ that mentions refunds twice

for name, v in [("short", short), ("long", long)]:
    dot = query @ v
    cos = dot / (np.linalg.norm(query) * np.linalg.norm(v))
    print(name, dot, round(cos, 2))
@@choice
short 1.0 0.71
long 2.0 0.32
@@choice
short 1.0 0.71
long 2.0 0.95
@@choice
short 1.0 1.0
long 2.0 1.0
@@choice
short 1.0 0.5
long 2.0 0.2
@@explain
The dot product counts shared mass, so the long FAQ wins 2.0 to 1.0 just by being long. Cosine divides by the lengths: the short chunk has length √2, giving 1 / 1.41 ≈ 0.71, while the FAQ has length √(4 + 25 + 9) ≈ 6.16, giving 2 / 6.16 ≈ 0.32. Cosine ranks the chunk that is *about* refunds first, which is why the embedding lesson made every vector unit length: then the cheap dot product and the cosine agree.
@@hint
The dot product with `[1, 0, 0]` just reads the first entry of each vector.
@@hint
The norms are √(1 + 0 + 1) ≈ 1.41 and √(4 + 25 + 9) ≈ 6.16; the query has norm 1.
@@q
Why can a raw dot product prefer the wrong chunk?
@@a
It grows with vector length, so a long chunk that touches the topic beats a short chunk that is entirely about it.
@@q
When are the dot product and cosine similarity the same?
@@a
When both vectors have unit length, because cosine is the dot product divided by the two lengths.
