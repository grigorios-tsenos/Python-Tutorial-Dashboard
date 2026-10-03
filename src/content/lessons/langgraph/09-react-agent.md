---
id: lg-react
track: langgraph
order: 9
title: "Boss: Build an Agent From Scratch"
tagline: The ReAct loop (reason, act, observe) in about 25 lines.
kind: boss
xp: 130
minutes: 15
---
@@body
# Boss: no frameworks, just the loop

Every agent, from a toy to a coding assistant, is this cycle:

```
        ┌────────── tool calls? ──────────┐
START ─> agent ─(yes)─> tools ─> agent ... │
            └─(no)──> END                  │
```

1. **agent** calls the model with the conversation so far
2. If the reply asks for tools, **tools** runs them and appends the results, then back to the agent
3. If not, the model gave its final answer: **END**

`MessagesState` is a ready-made state with a `messages` list that *appends* instead of overwriting.

The fake model is scripted: first it asks for `multiply(17, 3)`, then it answers in plain text.

> **Mission:** implement `agent`, `tools` and `should_continue`, build the graph with nodes named exactly **`agent`** and **`tools`**, compile it into `app`, and keep the `out = app.invoke(...)` line at the bottom.

Your loop must handle multiple tool calls in one reply, different registered tools, and repeated tool rounds. Preserve each call's `id` in its `ToolMessage` and keep message order. A reply with no tool calls must finish immediately; tool results must reach the next model call.
@@starter
from langchain_core.tools import tool
from langchain_core.messages import AIMessage, ToolMessage
from langchain_core.language_models import GenericFakeChatModel
from langgraph.graph import StateGraph, MessagesState, START, END

@tool
def multiply(a: int, b: int) -> int:
    """Multiply two integers."""
    return a * b

TOOLS = {"multiply": multiply}

model = GenericFakeChatModel(messages=iter([
    AIMessage("", tool_calls=[{"name": "multiply", "args": {"a": 17, "b": 3}, "id": "call_1"}]),
    AIMessage("17 * 3 = 51"),
]))

def agent(state: MessagesState):
    # TODO: call the model on state["messages"]; return it as a new message
    ...

def tools(state: MessagesState):
    # TODO: run every tool call on the LAST message; return one ToolMessage per call
    ...

def should_continue(state: MessagesState):
    # TODO: "tools" if the last message requests tools, otherwise END
    ...

# TODO: START -> agent -> (tools -> agent)* -> END, then compile
app = None

out = app.invoke({"messages": [("user", "What is 17 * 3?")]})
print(out["messages"][-1].content)
@@solution
from langchain_core.tools import tool
from langchain_core.messages import AIMessage, ToolMessage
from langchain_core.language_models import GenericFakeChatModel
from langgraph.graph import StateGraph, MessagesState, START, END

@tool
def multiply(a: int, b: int) -> int:
    """Multiply two integers."""
    return a * b

TOOLS = {"multiply": multiply}

model = GenericFakeChatModel(messages=iter([
    AIMessage("", tool_calls=[{"name": "multiply", "args": {"a": 17, "b": 3}, "id": "call_1"}]),
    AIMessage("17 * 3 = 51"),
]))

def agent(state: MessagesState):
    return {"messages": [model.invoke(state["messages"])]}

def tools(state: MessagesState):
    results = []
    for call in state["messages"][-1].tool_calls:
        output = TOOLS[call["name"]].invoke(call["args"])
        results.append(ToolMessage(content=str(output), tool_call_id=call["id"]))
    return {"messages": results}

def should_continue(state: MessagesState):
    return "tools" if state["messages"][-1].tool_calls else END

graph = StateGraph(MessagesState)
graph.add_node("agent", agent)
graph.add_node("tools", tools)
graph.add_edge(START, "agent")
graph.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
graph.add_edge("tools", "agent")
app = graph.compile()

out = app.invoke({"messages": [("user", "What is 17 * 3?")]})
print(out["messages"][-1].content)
@@check
import orbit
steps = [s["node"] for e in orbit._emits if e["kind"] == "graph_trace" for s in e["data"]["steps"]]
msgs = out["messages"]
test("final answer is the model's last message", lambda: msgs[-1].content == "17 * 3 = 51")
test("conversation: human, ai (tool request), tool, ai", lambda: [m.type for m in msgs] == ["human", "ai", "tool", "ai"])
test("the tool really ran: 17 * 3 = 51", lambda: msgs[2].content == "51" and msgs[2].tool_call_id == "call_1")
test("nodes ran agent -> tools -> agent", lambda: steps == ["agent", "tools", "agent"], "got " + str(steps))
@tool
def add(a: int, b: int) -> int:
    """Add two integers."""
    return a + b
TOOLS["add"] = add
def check_agent_rounds():
    global model
    saved_model = model
    try:
        model = GenericFakeChatModel(messages=iter([
            AIMessage("", tool_calls=[
                {"name": "multiply", "args": {"a": 3, "b": 4}, "id": "m1"},
                {"name": "add", "args": {"a": 2, "b": 5}, "id": "a1"},
            ]),
            AIMessage("", tool_calls=[{"name": "multiply", "args": {"a": 4, "b": 5}, "id": "m2"}]),
            AIMessage("finished both rounds"),
        ]))
        probe = app.invoke({"messages": [("user", "Use both tools, then continue.")]})["messages"]
        results = [(m.content, m.tool_call_id) for m in probe if m.type == "tool"]
        return results == [("12", "m1"), ("7", "a1"), ("20", "m2")] and probe[-1].content == "finished both rounds" and len(model.calls) == 3 and all(call == probe[:n] for call, n in zip(model.calls, [1, 4, 6]))
    finally:
        model = saved_model
test("multiple tools and repeated rounds preserve results and call IDs", check_agent_rounds)
def check_no_tools():
    global model
    saved_model = model
    try:
        model = GenericFakeChatModel(messages=iter([AIMessage("already know the answer")]))
        probe = app.invoke({"messages": [("user", "No tools needed.")]})["messages"]
        return [m.type for m in probe] == ["human", "ai"] and probe[-1].content == "already know the answer" and len(model.calls) == 1
    finally:
        model = saved_model
test("a plain answer ends without running tools", check_no_tools)
@@hint
`agent` returns `{"messages": [model.invoke(state["messages"])]}`: the reducer appends it. In `tools`, loop over `state["messages"][-1].tool_calls`, look up `TOOLS[call["name"]]`, and wrap each output in `ToolMessage(content=str(output), tool_call_id=call["id"])`.
@@hint
Graph: `add_edge(START, "agent")`, `add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})`, `add_edge("tools", "agent")`, then `app = graph.compile()`.
@@q
Why does `tools` loop back to `agent`?
@@a
The model needs to see the tool results so it can decide the next step or give the final answer.
@@q
What stops the ReAct loop?
@@a
The router sending to END when the model's latest message has no tool calls.
@@real
Real LangGraph ships this as `create_react_agent(model, tools)` in `langgraph.prebuilt`. Now you know exactly what's inside it, which is what makes debugging agents possible.
