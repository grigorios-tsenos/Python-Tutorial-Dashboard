---
id: lc-model-call
track: langchain
order: 1
title: A Model Call Is Just a Function
tagline: Message in, message out. Everything else is plumbing.
kind: run
xp: 25
minutes: 4
---
@@body
# One call, demystified

Chains, tools and RAG are all arrangements of this single call:

```python
reply = llm.invoke("Say hello")     # text (or messages) in...
reply                               # AIMessage(content='Hello!')  ...one message out
reply.content                       # 'Hello!'  <- the plain text lives inside
```

Two gotchas:

- **The reply is not a string.** It's an `AIMessage`: the text is in `.content`, and later lessons read other fields (like `.tool_calls`).
- **The model here is fake.** `FakeListChatModel` returns scripted responses: offline, deterministic. Only the constructor differs from real code.

> **Mission:** ask the model a question with `.invoke(...)`, store the whole reply in `reply`, and pull the plain text out into `text`. Print `type(reply).__name__` and `text`.

@@step Call the model with invoke
Every LangChain object that does work has one method: `.invoke(input)`. For a chat model the input can be a plain string:

```python
reply = llm.invoke("What is RAG?")
```

**Do:** replace `reply = None`, then Run. The first printed line should say `AIMessage`.
@@stepcheck
from langchain_core.messages import AIMessage
test("reply is the model's message object", lambda: isinstance(reply, AIMessage), 'reply = llm.invoke("...") returns an AIMessage')
@@step Read the text out of the message
An `AIMessage` is a container: role, content, tool calls, metadata. The words live in `.content`:

```python
text = reply.content
```

**Do:** replace `text = ""`, then Run.
@@stepcheck
test("text holds the plain text from inside it", lambda: text == "RAG retrieves documents, then asks the model with them as context.", "text = reply.content")
test("both were printed", lambda: "AIMessage" in __stdout__ and "RAG retrieves documents" in __stdout__)
@@starter
from langchain_core.language_models import FakeListChatModel

llm = FakeListChatModel(responses=["RAG retrieves documents, then asks the model with them as context."])

# TODO 1: call the model with a question
reply = None

# TODO 2: the plain text inside the reply
text = ""

print(type(reply).__name__)
print(text)
@@solution
from langchain_core.language_models import FakeListChatModel

llm = FakeListChatModel(responses=["RAG retrieves documents, then asks the model with them as context."])

reply = llm.invoke("What is RAG?")

text = reply.content

print(type(reply).__name__)
print(text)
@@check
from langchain_core.messages import AIMessage
test("reply is the model's message object", lambda: isinstance(reply, AIMessage), "reply = llm.invoke(\"...\") returns an AIMessage")
test("the message role is 'ai'", lambda: reply is not None and reply.type == "ai")
test("text holds the plain text from inside it", lambda: text == "RAG retrieves documents, then asks the model with them as context.")
test("both were printed", lambda: "AIMessage" in __stdout__ and "RAG retrieves documents" in __stdout__)
@@hint
`llm.invoke("any question")` performs the call. The result is a message object, not a string: look at its `.content`.
@@hint
`reply = llm.invoke("What is RAG?")` then `text = reply.content`.
@@q
What does llm.invoke(...) return: a string or something else?
@@a
An AIMessage object; the text is in its .content field.
@@q
Why practice on a fake model?
@@a
It's free, offline and deterministic, and the calling code is identical to real code — only the model constructor changes.
@@real
The real version is two changed lines: `from langchain_anthropic import ChatAnthropic` and `llm = ChatAnthropic(model="claude-sonnet-4-5")`. `reply = llm.invoke(...)` and `reply.content` stay exactly as you wrote them.
