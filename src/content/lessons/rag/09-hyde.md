---
id: rag-hyde
track: rag
order: 9
title: "Boss: HyDE"
tagline: Search with the answer you wish you had, not with the question you were asked.
kind: boss
xp: 120
minutes: 14
---
@@body
# Boss: Hypothetical Document Embeddings

Questions and answers are written differently. *"How long until I get my money back?"* shares no concept with *"Refunds are issued to the original payment method within 14 days"*, except time, and the shipping-times chunk owns that word. Plain search retrieves shipping.

**HyDE** (Gao et al., 2022) asks an LLM to **write a hypothetical answer** first and searches with *its* embedding. The draft may be factually wrong (the stand-in below says 30 days, not 14), but it is phrased like the documents, so it lands next to the right chunk:

```
question ──> LLM drafts n answers ──> embed each ─┐
   └──────────────────────────────> embed ────────┴─> mean ──> unit length ──> search
```

Averaging several drafts and the question itself smooths out any one draft's quirks. Here `draft_answer(question, seed)` plays the LLM.

> **Mission:**
> 1. `drafts(question, n=2)`: `n` hypothetical answers, one per seed
> 2. `hyde_vector(question, n=2)`: the mean of the drafts' embeddings and the question's embedding, rescaled to unit length (zero stays zero)
> 3. `top1(vector)`: the best chunk index for any query vector, or `None` when nothing scores above 0
> 4. `hit_rate(to_vector)`: the fraction of `EVAL` questions whose top chunk comes from the expected source, for any function mapping a question to a vector

Then print the hit rate of plain `embed` next to `hyde_vector`.
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

DRAFTS = {   # what a model might write; the facts may be wrong, only the wording matters
    "money": ["You will be refunded to your card within 30 days.", "Refunds reach the original payment method in about a week."],
    "parcel": ["If your package is lost, report it and we will send a replacement.", "Missing parcels can be claimed and replaced within a few days."],
    "screen": ["Accidental damage like a cracked screen is not covered by the warranty.", "The warranty covers defects, so a screen broken in a fall needs a paid repair."],
    "account": ["Use the reset link on the login page to choose a new password.", "If you are locked out, reset your password from the email link."],
}

def draft_answer(question, seed=0):
    """A stand-in LLM: writes a plausible answer, a different one per seed."""
    for cue, drafts in DRAFTS.items():
        if cue in question.lower():
            return drafts[seed % len(drafts)]
    return "I am not sure."

EVAL = [   # (question, the source that answers it)
    ("How long until I get my money back?", "returns.md"),
    ("My parcel never showed up. What now?", "lost.md"),
    ("I dropped my phone and the screen cracked. Is that covered?", "warranty.md"),
    ("I can't get into my account.", "account.md"),
]

def drafts(question, n=2):
    # TODO
    return []

def hyde_vector(question, n=2):
    # TODO
    return embed(question)

def top1(vector):
    # TODO
    return 0

def hit_rate(to_vector):
    # TODO
    return 0.0

print("plain:", hit_rate(embed))
print("HyDE: ", hit_rate(hyde_vector))
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

DRAFTS = {   # what a model might write; the facts may be wrong, only the wording matters
    "money": ["You will be refunded to your card within 30 days.", "Refunds reach the original payment method in about a week."],
    "parcel": ["If your package is lost, report it and we will send a replacement.", "Missing parcels can be claimed and replaced within a few days."],
    "screen": ["Accidental damage like a cracked screen is not covered by the warranty.", "The warranty covers defects, so a screen broken in a fall needs a paid repair."],
    "account": ["Use the reset link on the login page to choose a new password.", "If you are locked out, reset your password from the email link."],
}

def draft_answer(question, seed=0):
    """A stand-in LLM: writes a plausible answer, a different one per seed."""
    for cue, drafts in DRAFTS.items():
        if cue in question.lower():
            return drafts[seed % len(drafts)]
    return "I am not sure."

EVAL = [   # (question, the source that answers it)
    ("How long until I get my money back?", "returns.md"),
    ("My parcel never showed up. What now?", "lost.md"),
    ("I dropped my phone and the screen cracked. Is that covered?", "warranty.md"),
    ("I can't get into my account.", "account.md"),
]

def drafts(question, n=2):
    return [draft_answer(question, seed) for seed in range(n)]

def hyde_vector(question, n=2):
    vecs = [embed(d) for d in drafts(question, n)] + [embed(question)]
    v = np.mean(vecs, axis=0)
    norm = np.linalg.norm(v)
    return v / norm if norm > 0 else v

def top1(vector):
    scores = CHUNK_VECS @ vector
    best = int(np.argmax(scores))
    return best if scores[best] > 0 else None

def hit_rate(to_vector):
    hits = 0
    for question, source in EVAL:
        best = top1(to_vector(question))
        hits += best is not None and CHUNKS[best]["source"] == source
    return hits / len(EVAL)

print("plain:", hit_rate(embed))
print("HyDE: ", hit_rate(hyde_vector))
@@check
import numpy as np
q = EVAL[0][0]
test("drafts writes one answer per seed", lambda: drafts(q, 3) == [draft_answer(q, 0), draft_answer(q, 1), draft_answer(q, 2)] and drafts(q, 0) == [])
manual = np.mean([embed(draft_answer(q, 0)), embed(draft_answer(q, 1)), embed(q)], axis=0)
test("hyde_vector averages the drafts with the question", lambda: np.allclose(hyde_vector(q), manual / np.linalg.norm(manual)))
test("hyde_vector has unit length", lambda: all(np.isclose(np.linalg.norm(hyde_vector(question)), 1.0) for question, _ in EVAL))
test("hyde_vector stays zero when nothing is known", lambda: np.array_equal(hyde_vector("Zxq?"), np.zeros(DIM)))
test("top1 works on any vector", lambda: top1(embed("reset password")) == 6 and top1(np.zeros(DIM)) is None)
test("plain search misses three of four", lambda: hit_rate(embed) == 0.25)
test("HyDE finds all four", lambda: hit_rate(hyde_vector) == 1.0)
test("hit_rate accepts any question-to-vector function", lambda: hit_rate(lambda question: embed("refund")) == 0.25 and hit_rate(lambda question: np.zeros(DIM)) == 0.0)
test("both rates are printed", lambda: "plain: 0.25" in __stdout__ and "HyDE:  1.0" in __stdout__)
@@hint
`hyde_vector`: embed each draft and the question, take `np.mean(..., axis=0)` of the list, then divide by `np.linalg.norm` when it is positive. `top1`: `np.argmax` of `CHUNK_VECS @ vector`, and `None` unless that best score is above 0.
@@hint
`hit_rate` loops over `EVAL`, calls `top1(to_vector(question))`, counts a hit when the result is not `None` and `CHUNKS[best]["source"]` equals the expected source, and divides by `len(EVAL)`.
@@q
Why can a factually wrong hypothetical answer still retrieve the right chunk?
@@a
Retrieval only needs the draft to be phrased like the relevant document; the facts in the final answer come from the retrieved chunk, not from the draft.
@@q
What does HyDE cost compared with plain search?
@@a
One or more LLM calls before every search: extra latency and money, and a risk of drafting toward the wrong topic when the model misreads the question.
@@q
How do you know HyDE helps on your data?
@@a
Measure it: compare hit rate (or recall@k) of plain and HyDE retrieval on a labelled set of real questions, as this lesson does.
@@real
LangChain ships `HypotheticalDocumentEmbedder`, which wraps an LLM chain and an embedding model and averages the embeddings of the generated documents; LlamaIndex has `HyDEQueryTransform`. In the paper, HyDE with no labelled data rivalled fine-tuned retrievers, but it helps most when questions and documents are worded very differently.
