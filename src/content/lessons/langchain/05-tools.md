---
id: lc-tools
track: langchain
order: 5
title: Give the Model Hands
tagline: A tool is a function plus a description the model can read.
kind: build
xp: 45
minutes: 8
---
@@body
# Tools: how models act

An LLM only emits text. **Tool calling**: you describe functions to the model, it replies with a *request* to call one, **your code** runs the function and returns the result.

`@tool` packages a typed, documented function:

```python
@tool
def shout(text: str) -> str:
    """Return the text in capitals."""      # the model reads this docstring!
    return text.upper()

shout.name, shout.description, shout.args   # metadata the model sees
shout.invoke({"text": "hi"})                # 'HI'
```

Requests arrive as `ai_message.tool_calls`: a list of `{"name": ..., "args": {...}, "id": ...}`.

> **Mission:** implement `word_count` so it counts words separated by whitespace (empty text has **0** words), then write `run_tool_calls(ai_message, tools)` that executes *every* requested call by **name**, in order, and returns each result as a **string**. Tool-list order must not matter, repeated calls must all run, and a message with no calls must return `[]`.
@@starter
from langchain_core.tools import tool
from langchain_core.messages import AIMessage

@tool
def word_count(text: str) -> int:
    """Count the words in a piece of text."""
    # TODO
    return 0

@tool
def shout(text: str) -> str:
    """Return the text in capitals."""
    return text.upper()

def run_tool_calls(ai_message, tools):
    """Execute every tool call on `ai_message`; return the results as strings, in order."""
    # TODO: look up each call["name"] among the tools and invoke it with call["args"]
    return []

msg = AIMessage("", tool_calls=[
    {"name": "word_count", "args": {"text": "tools make agents useful"}, "id": "call_1"},
    {"name": "shout", "args": {"text": "orbit"}, "id": "call_2"},
])
print(run_tool_calls(msg, [shout, word_count]))
@@solution
from langchain_core.tools import tool
from langchain_core.messages import AIMessage

@tool
def word_count(text: str) -> int:
    """Count the words in a piece of text."""
    return len(text.split())

@tool
def shout(text: str) -> str:
    """Return the text in capitals."""
    return text.upper()

def run_tool_calls(ai_message, tools):
    """Execute every tool call on `ai_message`; return the results as strings, in order."""
    by_name = {t.name: t for t in tools}
    return [str(by_name[call["name"]].invoke(call["args"])) for call in ai_message.tool_calls]

msg = AIMessage("", tool_calls=[
    {"name": "word_count", "args": {"text": "tools make agents useful"}, "id": "call_1"},
    {"name": "shout", "args": {"text": "orbit"}, "id": "call_2"},
])
print(run_tool_calls(msg, [shout, word_count]))
@@check
test("word_count counts words", lambda: word_count.invoke({"text": "a b c"}) == 3)
test("word_count handles mixed whitespace", lambda: word_count.invoke({"text": "  one\ttwo\nthree  "}) == 3)
test("empty and whitespace-only text have no words", lambda: word_count.invoke({"text": ""}) == 0 and word_count.invoke({"text": " \t\n "}) == 0)
test("tool name and docstring become metadata", lambda: word_count.name == "word_count" and "Count the words" in word_count.description)
m = AIMessage("", tool_calls=[
    {"name": "word_count", "args": {"text": "a b c d e"}, "id": "1"},
    {"name": "shout", "args": {"text": "go"}, "id": "2"},
    {"name": "word_count", "args": {"text": "one two"}, "id": "3"},
])
test("mixed calls use names, not the tool-list order", lambda: run_tool_calls(msg, [shout, word_count]) == ["4", "ORBIT"])
test("repeated tools preserve call order and return strings", lambda: run_tool_calls(m, [word_count, shout]) == ["5", "GO", "2"])
test("a single call still works", lambda: run_tool_calls(AIMessage("", tool_calls=[{"name": "word_count", "args": {"text": "solo"}, "id": "single"}]), [word_count]) == ["1"])
test("no tool calls -> empty list", lambda: run_tool_calls(AIMessage("hi"), [word_count]) == [])
@@hint
`len(text.split())` counts words. For `run_tool_calls`, build a dict `{t.name: t for t in tools}` so you can look tools up by the name the model used.
@@hint
`[str(by_name[c["name"]].invoke(c["args"])) for c in ai_message.tool_calls]`
@@q
Where does the model read a tool's purpose from?
@@a
The function's name, type hints and docstring (the description).
@@q
Who actually executes the tool: the model or your code?
@@a
Your code. The model only requests the call.
@@real
Real flow: `llm.bind_tools([word_count])` tells the model about the tool, then your loop executes `ai_message.tool_calls` exactly like `run_tool_calls`, which is what LangGraph's `ToolNode` automates.
