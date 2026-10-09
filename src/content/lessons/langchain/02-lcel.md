---
id: lc-lcel
track: langchain
order: 2
title: The Pipe Operator
tagline: prompt | model | parser. Three boxes, one idea.
kind: run
xp: 30
minutes: 5
---
@@body
# LangChain in one symbol: `|`

Everything in LangChain is a **Runnable**: an object with `.invoke(input)`. `|` composes Runnables into a *chain*, the LangChain Expression Language (LCEL):

```
prompt  ->  model  ->  output parser
{"topic": ...}  ->  messages  ->  AIMessage  ->  plain str
```

| piece | job |
|---|---|
| `ChatPromptTemplate` | fills `{placeholders}` and builds messages |
| a chat model | turns messages into an `AIMessage` |
| `StrOutputParser` | pulls the text out of the `AIMessage` |

> **Mission:** connect the three pieces into `chain` with `|`, so `chain.invoke(...)` returns a plain string.

@@step Pipe the prompt into the model
`a | b` builds a new Runnable: run `a`, feed its output to `b`. The prompt turns the dict into messages, the model turns messages into a reply:

```python
chain = prompt | llm
```

**Do:** replace `chain = prompt`, then Run. The print shows an `AIMessage(...)` for now.
@@stepcheck
out = chain.invoke({"topic": "a vector", "audience": "child"})
test("the model's reply comes through the chain", lambda: getattr(out, "content", out) == "A vector is an arrow with a length and a direction.", "chain = prompt | llm")
@@step Add the parser so a plain string comes out
Most code wants text, not a message object. `StrOutputParser()` is a Runnable that returns `.content`:

```python
chain = prompt | llm | StrOutputParser()
```

Note the parentheses: you add an *instance* of the parser to the chain.

**Do:** extend the chain, then Run.
@@stepcheck
out = chain.invoke({"topic": "a vector", "audience": "child"})
test("chain returns a plain string", lambda: isinstance(out, str) and out == "A vector is an arrow with a length and a direction.", "without StrOutputParser you get an AIMessage object")
@@starter
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.language_models import FakeListChatModel

prompt = ChatPromptTemplate.from_template("Explain {topic} to a {audience} in one sentence.")
llm = FakeListChatModel(responses=["A vector is an arrow with a length and a direction."])

# TODO: compose prompt -> llm -> parser with the | operator
chain = prompt

print(chain.invoke({"topic": "a vector", "audience": "child"}))
@@solution
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.language_models import FakeListChatModel

prompt = ChatPromptTemplate.from_template("Explain {topic} to a {audience} in one sentence.")
llm = FakeListChatModel(responses=["A vector is an arrow with a length and a direction."])

chain = prompt | llm | StrOutputParser()

print(chain.invoke({"topic": "a vector", "audience": "child"}))
@@check
out = chain.invoke({"topic": "a vector", "audience": "child"})
test("chain returns a plain string", lambda: isinstance(out, str), "without StrOutputParser you get an AIMessage object")
test("the model's reply comes through", lambda: out == "A vector is an arrow with a length and a direction.")
@@hint
Each piece is a Runnable, so `a | b | c` builds a new Runnable that feeds each output into the next.
@@hint
`chain = prompt | llm | StrOutputParser()`
@@q
What does `a | b` build in LangChain?
@@a
A RunnableSequence: it runs `a`, then feeds its output into `b`.
@@q
What does StrOutputParser do?
@@a
Extracts the text `.content` from the model's AIMessage and returns it as a str.
@@real
Real code swaps the fake model for `ChatAnthropic(model=...)` from `langchain_anthropic` (or any provider). The chain line stays exactly the same.
