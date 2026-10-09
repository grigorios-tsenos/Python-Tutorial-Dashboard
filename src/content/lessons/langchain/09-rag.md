---
id: lc-rag
track: langchain
order: 9
title: "Boss: Mini RAG"
tagline: Retrieve, then generate.
kind: boss
xp: 110
minutes: 14
---
@@body
# Boss: Retrieval-Augmented Generation, end to end

LLMs don't know your documents. **RAG** fixes that in two moves: **retrieve** the passages most similar to the question, then **generate** with them pasted into the prompt.

```
question ─┬─> retrieve ──> context ─┐
          └──────────────> question ┴─> prompt -> llm -> parser
```

`embed` (a hashed bag-of-words) stands in for a real embedding model; the similarity maths is the NumPy boss. The "LLM" echoes its prompt, so you can *see* the context arrive.

> **Mission:**
> 1. `retrieve(question, k=1)` → the `k` most cosine-similar documents (a list of strings)
> 2. `rag_chain` → a runnable: question in, string out, with retrieved context in the prompt. Fan the question out with a dict of runnables (`RunnablePassthrough` keeps it as-is).

The retriever must work on other collections. Return `[]` for a blank question, no documents or `k <= 0`; oversized `k` returns everything; ties keep document order. A blank question puts no invented context in the prompt.

@@step Retrieve by cosine similarity
Embed the question, score every row of `DOC_VECS` at once (dot products divided by both lengths, zero where a length is zero), and return the documents for the top `k` indices. Stable argsort keeps ties in document order. Until the chain exists, replace the last two lines with a direct `print(retrieve(...))` to test.
@@stepcheck
test("MLflow question finds the MLflow doc", lambda: retrieve("How does MLflow track experiments and metrics?")[0] == DOCS[0], "cosine = (DOC_VECS @ q) / (row norms * query norm)")
test("Delta question finds the Delta doc, and k documents come back", lambda: retrieve("What is time travel in Delta Lake?")[0] == DOCS[2] and len(retrieve("MLflow", k=2)) == 2)
@@step Handle the edges of retrieval
A blank question, an empty collection or `k <= 0` return `[]` before any maths; an oversized `k` simply returns everything the slice can reach.
@@stepcheck
test("blank questions and non-positive k retrieve nothing", lambda: retrieve("  ") == [] and retrieve("MLflow", 0) == [] and retrieve("MLflow", -1) == [])
test("oversized k is limited by the collection", lambda: len(retrieve("MLflow", 20)) == len(DOCS), "slice the sorted indices with [:k]")
@@step Fan the question out into the chain
A dict of runnables runs each value on the same input: `{"context": RunnableLambda(lambda q: "\n".join(retrieve(q))), "question": RunnablePassthrough()}`. Pipe that into `prompt | llm | StrOutputParser()`.
@@stepcheck
out = rag_chain.invoke("How do agents use state machines with nodes?")
test("the chain returns a string with the retrieved context and the question", lambda: isinstance(out, str) and out.startswith("ANSWER USING") and "LangGraph models agents" in out and "How do agents use state machines with nodes?" in out, '{"context": ..., "question": RunnablePassthrough()} | prompt | llm | StrOutputParser()')
test("irrelevant docs stay out of the prompt", lambda: "Delta Lake" not in out and "MLflow" not in out)
@@starter
import zlib
import numpy as np
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableLambda, RunnablePassthrough
from langchain_core.messages import AIMessage

DOCS = [
    "MLflow tracks experiments, parameters and metrics.",
    "LangGraph models agents as state machines with nodes and edges.",
    "Delta Lake adds ACID transactions and time travel to data lakes.",
    "Pandas groupby splits data into groups and aggregates each group.",
]

def embed(text, dim=64):
    v = np.zeros(dim)
    for word in text.lower().replace(".", "").replace("?", "").replace(",", "").split():
        v[zlib.crc32(word.encode()) % dim] += 1
    return v

DOC_VECS = np.array([embed(d) for d in DOCS])

def retrieve(question, k=1):
    """Return the k documents most cosine-similar to the question."""
    # TODO
    return []

prompt = ChatPromptTemplate.from_template("Context:\n{context}\n\nQuestion: {question}")

# a stand-in LLM that proves what it was given
llm = RunnableLambda(lambda pv: AIMessage("ANSWER USING -> " + pv.to_string()))

# TODO: question -> {"context": ..., "question": ...} -> prompt -> llm -> StrOutputParser()
rag_chain = None

print(rag_chain.invoke("How does MLflow track experiments and metrics?"))
@@solution
import zlib
import numpy as np
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableLambda, RunnablePassthrough
from langchain_core.messages import AIMessage

DOCS = [
    "MLflow tracks experiments, parameters and metrics.",
    "LangGraph models agents as state machines with nodes and edges.",
    "Delta Lake adds ACID transactions and time travel to data lakes.",
    "Pandas groupby splits data into groups and aggregates each group.",
]

def embed(text, dim=64):
    v = np.zeros(dim)
    for word in text.lower().replace(".", "").replace("?", "").replace(",", "").split():
        v[zlib.crc32(word.encode()) % dim] += 1
    return v

DOC_VECS = np.array([embed(d) for d in DOCS])

def retrieve(question, k=1):
    """Return the k documents most cosine-similar to the question."""
    if not question.strip() or not DOCS or k <= 0:
        return []
    q = embed(question)
    norms = np.linalg.norm(DOC_VECS, axis=1) * np.linalg.norm(q)
    sims = np.divide(DOC_VECS @ q, norms, out=np.zeros(len(DOCS)), where=norms != 0)
    return [DOCS[i] for i in np.argsort(-sims, kind="stable")[:k]]

prompt = ChatPromptTemplate.from_template("Context:\n{context}\n\nQuestion: {question}")

llm = RunnableLambda(lambda pv: AIMessage("ANSWER USING -> " + pv.to_string()))

rag_chain = (
    {"context": RunnableLambda(lambda q: "\n".join(retrieve(q))), "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)

print(rag_chain.invoke("How does MLflow track experiments and metrics?"))
@@check
test("retrieve returns k documents", lambda: len(retrieve("How does MLflow track experiments and metrics?", k=2)) == 2)
test("MLflow question finds the MLflow doc", lambda: retrieve("How does MLflow track experiments and metrics?")[0] == DOCS[0])
test("Delta question finds the Delta doc", lambda: retrieve("What is time travel in Delta Lake?")[0] == DOCS[2])
out = rag_chain.invoke("How do agents use state machines with nodes?")
test("chain returns a string from the llm", lambda: isinstance(out, str) and out.startswith("ANSWER USING"))
test("retrieved context is in the prompt", lambda: "LangGraph models agents" in out)
test("irrelevant docs are not", lambda: "Delta Lake" not in out and "MLflow" not in out)
test("the question is in the prompt too", lambda: "How do agents use state machines with nodes?" in out)
test("Pandas question finds the Pandas doc", lambda: retrieve("Pandas groupby aggregates each group")[0] == DOCS[3])
test("blank questions and non-positive k retrieve nothing", lambda: retrieve("  ") == [] and retrieve("MLflow", 0) == [] and retrieve("MLflow", -1) == [])
test("oversized k is limited by the collection", lambda: len(retrieve("MLflow", 20)) == len(DOCS))
def check_new_collection():
    global DOCS, DOC_VECS
    saved_docs, saved_vecs = DOCS, DOC_VECS
    try:
        DOCS = ["trees shade green leaves", "trees grow green leaves", "trees grow green leaves."]
        DOC_VECS = np.array([embed(d) for d in DOCS])
        DOC_VECS[0] *= 100
        ranked = retrieve("trees grow green leaves", 3)
        DOCS, DOC_VECS = [], np.empty((0, 64))
        return ranked == ["trees grow green leaves", "trees grow green leaves.", "trees shade green leaves"] and retrieve("trees") == []
    finally:
        DOCS, DOC_VECS = saved_docs, saved_vecs
test("new collection uses cosine scores and handles no docs", check_new_collection)
test("blank question adds no unrelated context", lambda: all(doc not in rag_chain.invoke("  ") for doc in DOCS))
@@hint
Return early for blank questions, no documents, or non-positive `k`. Embed the question and compute cosine similarity against every row of `DOC_VECS`; use `np.argsort(-sims, kind="stable")` so tied scores keep document order.
@@hint
The dict `{"context": RunnableLambda(lambda q: "\n".join(retrieve(q))), "question": RunnablePassthrough()}` runs both branches on the same input, then `| prompt | llm | StrOutputParser()`.
@@q
What are the two steps of RAG?
@@a
Retrieve relevant passages for the question, then generate an answer with them in the prompt.
@@q
What does RunnablePassthrough do in a dict of runnables?
@@a
Passes the original input through unchanged, so it can sit beside computed values like the context.
@@real
In production `embed` is a real embedding model, `DOC_VECS` lives in a vector store (Databricks Vector Search, pgvector, FAISS) and `retrieve` becomes `vectorstore.as_retriever()`. The chain line is the same.
