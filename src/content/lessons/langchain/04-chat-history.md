---
id: lc-history
track: langchain
order: 4
title: Give the Chain a Memory Window
tagline: Chat models are stateless. Your prompt carries the conversation, within a budget.
kind: build
xp: 45
minutes: 7
---
@@body
# The model remembers nothing; the prompt remembers for it

Every call starts from zero. A chatbot "remembers" because your code resends the earlier messages. `MessagesPlaceholder` splices a list of messages into a template.

Histories grow, and so do cost and latency, so keep a **window** of recent turns. A turn starts with a human message and includes the replies after it: never cut one in half, and start the window on a human message (many APIs reject a leading assistant message).

> **Mission:**
>
> 1. Add the `history` placeholder between the system message and the question.
> 2. `trim_history(messages, max_turns)` → a new list with the last `max_turns` turns: from the `max_turns`-th last human message to the end. With fewer turns, start at the first human message. `max_turns <= 0` or no human messages gives `[]`. Don't modify the input.
> 3. `build_chain(llm, max_turns=2)` → `trim history | prompt | llm | StrOutputParser()`, taking `{"product", "history", "question"}` and returning a string.
@@starter
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableLambda, RunnablePassthrough

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a support assistant for {product}."),
    # TODO 1: splice the conversation history in here
    ("human", "{question}"),
])

def trim_history(messages, max_turns):
    """The last max_turns turns, starting on a human message."""
    # TODO 2
    return list(messages)

def build_chain(llm, max_turns=2):
    # TODO 3: trim the history before it reaches the prompt
    return prompt | llm | StrOutputParser()

# a stand-in model that records exactly what it was sent
seen = []
def fake_model(prompt_value):
    messages = prompt_value.to_messages()
    seen.append(messages)
    return AIMessage(f"(model saw {len(messages)} messages)")
llm = RunnableLambda(fake_model)

history = [
    AIMessage("Hi! How can I help?"),
    HumanMessage("My invoice is wrong"), AIMessage("Which month?"),
    HumanMessage("March"), AIMessage("Fixed, sorry about that."),
    HumanMessage("Also my login fails"), AIMessage("Try the reset link."),
]
chain = build_chain(llm, max_turns=2)
print(chain.invoke({"product": "Orbit", "history": history, "question": "Still broken."}))
for m in seen[-1]:
    print(f"{m.type:>6}: {m.content}")
@@solution
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableLambda, RunnablePassthrough

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a support assistant for {product}."),
    MessagesPlaceholder("history"),
    ("human", "{question}"),
])

def trim_history(messages, max_turns):
    """The last max_turns turns, starting on a human message."""
    if max_turns <= 0:
        return []
    starts = [i for i, m in enumerate(messages) if m.type == "human"][-max_turns:]
    return list(messages[starts[0]:]) if starts else []

def build_chain(llm, max_turns=2):
    return (
        RunnablePassthrough.assign(history=lambda x: trim_history(x["history"], max_turns))
        | prompt
        | llm
        | StrOutputParser()
    )

# a stand-in model that records exactly what it was sent
seen = []
def fake_model(prompt_value):
    messages = prompt_value.to_messages()
    seen.append(messages)
    return AIMessage(f"(model saw {len(messages)} messages)")
llm = RunnableLambda(fake_model)

history = [
    AIMessage("Hi! How can I help?"),
    HumanMessage("My invoice is wrong"), AIMessage("Which month?"),
    HumanMessage("March"), AIMessage("Fixed, sorry about that."),
    HumanMessage("Also my login fails"), AIMessage("Try the reset link."),
]
chain = build_chain(llm, max_turns=2)
print(chain.invoke({"product": "Orbit", "history": history, "question": "Still broken."}))
for m in seen[-1]:
    print(f"{m.type:>6}: {m.content}")
@@check
H = [
    AIMessage("Hi! How can I help?"),
    HumanMessage("invoice wrong"), AIMessage("Which month?"),
    HumanMessage("March"), AIMessage("Fixed."),
    HumanMessage("login fails"), AIMessage("Try a reset."), AIMessage("Did that work?"),
]
before = list(H)
text = lambda ms: [m.content for m in ms]
test("two turns keep whole turns, including consecutive replies", lambda: text(trim_history(H, 2)) == ["March", "Fixed.", "login fails", "Try a reset.", "Did that work?"])
test("one turn starts at the newest human message", lambda: text(trim_history(H, 1)) == ["login fails", "Try a reset.", "Did that work?"])
test("a large window starts on the first human message", lambda: text(trim_history(H, 10)) == text(H[1:]))
test("no window and no human messages give an empty history", lambda: trim_history(H, 0) == [] and trim_history(H, -1) == [] and trim_history([AIMessage("hello")], 3) == [] and trim_history([], 2) == [])
test("trimming returns a new list and leaves the input alone", lambda: trim_history(H, 10) is not H and H == before)
log = []
def recorder(pv):
    log.append(pv.to_messages())
    return AIMessage("ok")
two = build_chain(RunnableLambda(recorder), max_turns=2)
out = two.invoke({"product": "Acme", "history": H, "question": "Still broken?"})
sent = log[-1]
test("the chain returns a plain string", lambda: out == "ok")
test("system prompt first, trimmed history next, new question last", lambda: [m.type for m in sent] == ["system", "human", "ai", "human", "ai", "ai", "human"] and sent[0].content == "You are a support assistant for Acme." and sent[-1].content == "Still broken?")
test("the window size comes from build_chain", lambda: build_chain(RunnableLambda(recorder), max_turns=1).invoke({"product": "Acme", "history": H, "question": "q"}) == "ok" and text(log[-1][1:-1]) == ["login fails", "Try a reset.", "Did that work?"])
test("an empty history sends only system and question", lambda: build_chain(RunnableLambda(recorder)).invoke({"product": "Acme", "history": [], "question": "first"}) == "ok" and [m.type for m in log[-1]] == ["system", "human"])
test("the caller's history is not modified by the chain", lambda: H == before)
@@hint
Put `MessagesPlaceholder("history")` between the system tuple and the human tuple. For `trim_history`, collect the indices of human messages: `[i for i, m in enumerate(messages) if m.type == "human"]`.
@@hint
Keep the last `max_turns` of those indices with `[-max_turns:]` (after handling `max_turns <= 0`), then slice `messages[starts[0]:]`. The chain is `RunnablePassthrough.assign(history=lambda x: trim_history(x["history"], max_turns)) | prompt | llm | StrOutputParser()`.
@@q
Why must a chatbot send earlier messages on every call?
@@a
Chat model APIs are stateless: the prompt is the model's only memory of the conversation.
@@q
Why trim by whole turns rather than a fixed number of messages?
@@a
Cutting a turn in half can leave an answer without its question or a history that starts with an assistant message.
@@real
LangChain's `trim_messages(messages, strategy="last", token_counter=llm, max_tokens=..., start_on="human")` does this by **tokens** rather than turns. Long-running assistants often summarize older turns instead of dropping them.
