---
id: lc-context-budget
track: langchain
order: 8
title: Pack the Context Window
tagline: Keep useful passages without cutting a sentence in half.
kind: build
xp: 60
minutes: 8
---
@@body
# Retrieval has a budget

A retriever can return more text than a prompt can hold, so pack complete passages, in retrieval order, into a budget. This exercise counts **characters** to keep the accounting visible; real APIs count tokens.

> **Mission:** implement `pack_context(documents, max_chars)`. Strip surrounding whitespace from each passage, skip blank passages, and join included passages with exactly two newlines. Include a whole passage only if it fits, counting those separators too. Skip an oversized passage and keep trying later passages. Return `""` for an empty collection or a non-positive budget. Keep the input list unchanged.

Do not truncate or reorder passages; the supplied chain inserts your packed context beside the question.
@@starter
from langchain_core.messages import AIMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableLambda

def pack_context(documents, max_chars):
    # TODO: keep complete passages while respecting the total character budget
    return "\n\n".join(documents)

prompt = ChatPromptTemplate.from_template("Context:\n{context}\n\nQuestion: {question}")
context_chain = (
    RunnableLambda(lambda x: {"context": pack_context(x["docs"], x["budget"]), "question": x["question"]})
    | prompt
    | RunnableLambda(lambda pv: AIMessage(pv.to_string()))
    | StrOutputParser()
)
print(context_chain.invoke({"docs": ["Delta stores history.", "Graphs route work."], "budget": 25, "question": "What is Delta?"}))
@@solution
from langchain_core.messages import AIMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableLambda

def pack_context(documents, max_chars):
    if max_chars <= 0:
        return ""
    passages, used = [], 0
    for document in documents:
        passage = document.strip()
        if not passage:
            continue
        size = len(passage) + (2 if passages else 0)
        if used + size <= max_chars:
            passages.append(passage)
            used += size
    return "\n\n".join(passages)

prompt = ChatPromptTemplate.from_template("Context:\n{context}\n\nQuestion: {question}")
context_chain = (
    RunnableLambda(lambda x: {"context": pack_context(x["docs"], x["budget"]), "question": x["question"]})
    | prompt
    | RunnableLambda(lambda pv: AIMessage(pv.to_string()))
    | StrOutputParser()
)
print(context_chain.invoke({"docs": ["Delta stores history.", "Graphs route work."], "budget": 25, "question": "What is Delta?"}))
@@check
test("separators count toward an exact-fit budget", lambda: pack_context(["alpha", "beta", "c"], 11) == "alpha\n\nbeta")
test("oversized passages are skipped so later passages can fit", lambda: pack_context(["this passage is too long", "ok", "go"], 6) == "ok\n\ngo")
test("one fewer character excludes a whole passage", lambda: pack_context(["ok", "go"], 5) == "ok")
test("blank passages are ignored and included passages are stripped", lambda: pack_context(["  ", "  first  ", "\t", "second"], 13) == "first\n\nsecond")
test("empty collections and non-positive budgets give empty context", lambda: pack_context([], 20) == "" and pack_context(["text"], 0) == "" and pack_context(["text"], -2) == "")
docs = ["  short  ", "another passage"]
original = docs.copy()
packed = pack_context(docs, 5)
test("packing leaves the caller's list untouched", lambda: docs == original and packed == "short")
output = context_chain.invoke({"docs": ["relevant", "oversized context"], "budget": 8, "question": "Keep my question?"})
test("the chain receives only packed context and preserves the question", lambda: "Context:\nrelevant\n\nQuestion: Keep my question?" in output and "oversized context" not in output)
@@hint
Track the number of characters already included. A passage after the first also needs two characters for the newline separator.
@@hint
Loop through stripped, non-blank passages. Append only when `used + len(passage) + separator_size <= max_chars`, then finish with `"\n\n".join(passages)`.
@@q
Why count separators in the context budget?
@@a
Separators occupy space in the prompt too; ignoring them can push the final context over its limit.
@@real
Production RAG packs passages with the model tokenizer and reserves tokens for instructions, the question and the answer. The whole-passage accounting stays the same.
