---
id: rag-generate
track: rag
order: 7
title: Grounded Prompts with Citations
tagline: Number the context, respect the budget, then check that the answer cites what it was given.
kind: build
xp: 55
minutes: 9
---
@@body
# Stage 5, generate: a prompt the answer can be checked against

Retrieval is only useful if the model **uses** the context and you can **verify** that it did. Three habits make that possible:

- **Number the context.** Each chunk becomes `[n] (source) text`, so the model can cite `[n]` and the reader can follow it back.
- **Respect a budget.** Context windows and costs are finite. Keep chunks in rank order until the next one would overflow, and never let a lower-ranked chunk jump the queue.
- **Check the citations.** An answer must cite at least one block, and only blocks that exist, or admit it doesn't know.

```
[1] (returns.md) Refunds are issued to the original payment method within 14 days of the return.
[2] (shipping.md) Orders over 50 euros ship free. Shipping costs are not refunded.

Question: How fast are refunds?
answer: "... within 14 days of the return. [1]"   cites [1], and [1] exists: grounded
```

`fake_llm` stands in for the model: it answers from the first block, or says it doesn't know when there is no context.

> **Mission:** implement `format_context(ids)`, `fit_budget(ids, max_words)`, `build_prompt(question, ids, max_words=30)`, `citations(answer)` (sorted, distinct) and `grounded(answer, n_blocks)`.
@@starter
import re

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

INSTRUCTIONS = "Answer using only the numbered context. Cite sources like [1]. If the context does not contain the answer, say I don't know."

def fake_llm(prompt):
    """A stand-in model: it answers from the first context block, or admits it doesn't know."""
    blocks = re.findall(r"^\[(\d+)\] \(.+?\) (.+)$", prompt, flags=re.M)
    if not blocks:
        return "I don't know."
    number, text = blocks[0]
    return f"{text} [{number}]"

def format_context(ids):
    # TODO: "[n] (source) text" per chunk, numbered from 1, one per line
    return ""

def fit_budget(ids, max_words):
    # TODO: chunks in order while the total word count fits
    return ids

def build_prompt(question, ids, max_words=30):
    # TODO: instructions, the numbered context, then the question
    return question

def citations(answer):
    # TODO: the distinct [n] numbers in the answer, sorted
    return []

def grounded(answer, n_blocks):
    # TODO: cites only existing blocks, or admits it doesn't know
    return True

ids = fit_budget([0, 3, 1], 30)
answer = fake_llm(build_prompt("How fast are refunds?", ids))
print("answer:", answer)
print("grounded:", grounded(answer, len(ids)))
@@solution
import re

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

INSTRUCTIONS = "Answer using only the numbered context. Cite sources like [1]. If the context does not contain the answer, say I don't know."

def fake_llm(prompt):
    """A stand-in model: it answers from the first context block, or admits it doesn't know."""
    blocks = re.findall(r"^\[(\d+)\] \(.+?\) (.+)$", prompt, flags=re.M)
    if not blocks:
        return "I don't know."
    number, text = blocks[0]
    return f"{text} [{number}]"

def format_context(ids):
    lines = [f"[{n}] ({CHUNKS[i]['source']}) {CHUNKS[i]['text']}" for n, i in enumerate(ids, start=1)]
    return "\n".join(lines)

def fit_budget(ids, max_words):
    kept, used = [], 0
    for i in ids:
        n = len(CHUNKS[i]["text"].split())
        if used + n > max_words:
            break
        kept, used = kept + [i], used + n
    return kept

def build_prompt(question, ids, max_words=30):
    context = format_context(fit_budget(ids, max_words))
    return f"{INSTRUCTIONS}\n\nContext:\n{context}\n\nQuestion: {question}"

def citations(answer):
    return sorted({int(n) for n in re.findall(r"\[(\d+)\]", answer)})

def grounded(answer, n_blocks):
    cited = citations(answer)
    if "I don't know" in answer:
        return True
    return len(cited) > 0 and all(1 <= n <= n_blocks for n in cited)

ids = fit_budget([0, 3, 1], 30)
answer = fake_llm(build_prompt("How fast are refunds?", ids))
print("answer:", answer)
print("grounded:", grounded(answer, len(ids)))
@@check
test("format_context numbers blocks from 1 with their source", lambda: format_context([3, 0]) == "[1] (shipping.md) " + CHUNKS[3]["text"] + "\n[2] (returns.md) " + CHUNKS[0]["text"] and format_context([]) == "")
test("fit_budget keeps rank order and stops at the first overflow", lambda: fit_budget([0, 3, 1], 30) == [0, 3] and fit_budget([0, 3, 1], 40) == [0, 3, 1] and fit_budget([0, 2], 5) == [])
test("fit_budget never lets a later chunk jump the queue", lambda: fit_budget([0, 6, 1], 25) == [0])
p = build_prompt("How fast are refunds?", [0, 3, 1])
test("the prompt has instructions, context and question in order", lambda: p.startswith(INSTRUCTIONS) and p.index("Context:\n[1] (returns.md)") < p.index("Question: How fast are refunds?") and "[3]" not in p)
test("citations are distinct and sorted", lambda: citations("See [2] and [1], also [2].") == [1, 2] and citations("no sources") == [])
test("grounded needs valid citations", lambda: grounded("Yes [1].", 2) and not grounded("Yes [3].", 2) and not grounded("Yes.", 2) and not grounded("Yes [0].", 2))
test("admitting ignorance is grounded", lambda: grounded("I don't know.", 0))
test("an empty context makes the model admit it", lambda: fake_llm(build_prompt("How fast are refunds?", [])) == "I don't know.")
test("the answer and the verdict are printed", lambda: "within 14 days of the return. [1]" in __stdout__ and "grounded: True" in __stdout__)
@@hint
`enumerate(ids, start=1)` numbers the blocks; build each line with an f-string and join with newlines. In `fit_budget`, count each chunk's words with `.split()` and `break` at the first that overflows.
@@hint
`re.findall(r"\[(\d+)\]", answer)` returns the numbers inside square brackets as strings; convert with `int`, deduplicate with a set and sort. `grounded` returns True for an "I don't know" answer, otherwise requires at least one citation, all between 1 and `n_blocks`.
@@q
Why number the context blocks?
@@a
So the model can cite them and a program or reader can check every claim against the exact chunk and source it came from.
@@q
Why stop at the first chunk that overflows the budget instead of skipping it?
@@a
Chunks arrive in rank order; skipping would let a less relevant chunk in while a more relevant one is dropped.
@@real
Budgets are counted in tokens (`tiktoken`, or the provider's token counter), not words. Anthropic's Citations API and LangChain's citation chains return structured references to the supplied documents, and evaluation tools such as Ragas measure *faithfulness*: whether each claim is supported by the retrieved context.
