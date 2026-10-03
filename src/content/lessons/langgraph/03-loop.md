---
id: lg-loop
track: langgraph
order: 3
title: "Bug Hunt: The Reviewer That Never Approves"
tagline: Conditional edges are where agents get their brains and their infinite loops.
kind: bug
xp: 40
minutes: 7
---
@@body
# Routing, and how to break it

A **conditional edge** calls a *router function* after a node; the string it returns picks the next node. That is how an agent decides to finish or retry.

```python
def route(state):
    return END if state["approved"] else "write"

graph.add_conditional_edges("review", route, {"write": "write", END: END})
```

This graph writes a draft and loops until a reviewer approves (from the **third** draft on). The router is broken; LangGraph's **recursion limit** (25 steps) stops it instead of spinning forever.

> **Mission:** run it, read the error, fix `route` so the graph stops once the draft is approved. Final `attempts` must be `3`.
@@starter
from typing import TypedDict
from langgraph.graph import StateGraph, START, END

class State(TypedDict):
    attempts: int
    draft: str
    approved: bool

def write(state):
    n = state["attempts"] + 1
    return {"attempts": n, "draft": f"draft v{n}"}

def review(state):
    # picky reviewer: approves only from the third draft on
    return {"approved": state["attempts"] >= 3}

def route(state):
    # BUG HUNT: this loops forever. Approved -> END, otherwise write again.
    return "write"

g = StateGraph(State)
g.add_node("write", write)
g.add_node("review", review)
g.add_edge(START, "write")
g.add_edge("write", "review")
g.add_conditional_edges("review", route, {"write": "write", END: END})
app = g.compile()

final = app.invoke({"attempts": 0, "draft": "", "approved": False})
print(final)
@@solution
from typing import TypedDict
from langgraph.graph import StateGraph, START, END

class State(TypedDict):
    attempts: int
    draft: str
    approved: bool

def write(state):
    n = state["attempts"] + 1
    return {"attempts": n, "draft": f"draft v{n}"}

def review(state):
    # picky reviewer: approves only from the third draft on
    return {"approved": state["attempts"] >= 3}

def route(state):
    return END if state["approved"] else "write"

g = StateGraph(State)
g.add_node("write", write)
g.add_node("review", review)
g.add_edge(START, "write")
g.add_edge("write", "review")
g.add_conditional_edges("review", route, {"write": "write", END: END})
app = g.compile()

final = app.invoke({"attempts": 0, "draft": "", "approved": False})
print(final)
@@check
test("loop stops after the approved draft", lambda: final["attempts"] == 3)
test("final draft is v3", lambda: final["draft"] == "draft v3")
test("approved flag set", lambda: final["approved"] is True)
@@hint
The router currently ignores the state. It should look at `state["approved"]`.
@@hint
`return END if state["approved"] else "write"`
@@q
What does a conditional edge's router function return?
@@a
The name of the next node (or END), chosen from the current state.
@@q
Why does LangGraph have a recursion limit?
@@a
To stop runaway loops: agents that route back to themselves forever.
