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

> **Mission:** run it, read the error, then fix `route` so the graph stops once the draft is approved. Final `attempts` must be `3`. Then add a safety budget: never write more than 5 drafts, approved or not.

@@step Route on the state
Run the starter and read the `GraphRecursionError`. The router returns `"write"` no matter what. Make it look at the state:

```python
return END if state["approved"] else "write"
```

**Do:** fix `route`, then Run. The final state should show three attempts.
@@stepcheck
test("loop stops after the approved draft", lambda: final["attempts"] == 3 and final["approved"] is True, 'return END if state["approved"] else "write"')
@@step Add a budget the reviewer cannot defeat
A reviewer that never approves would still hit the recursion limit. Make the router itself give up after five drafts:

```python
if state["approved"] or state["attempts"] >= 5:
    return END
return "write"
```

The error becomes a decision: a graph that stops on purpose is one you can put a fallback behind later.

**Do:** add the budget, then Run. The routing function is checked directly with made-up states.
@@stepcheck
from langgraph.graph import END
test("the router gives up after five attempts even without approval", lambda: route({"attempts": 5, "approved": False, "draft": ""}) == END and route({"attempts": 1, "approved": False, "draft": ""}) == "write", 'if state["approved"] or state["attempts"] >= 5: return END')
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
    # BUG HUNT: this loops forever. Approved -> END, otherwise write again (but never more than 5 drafts).
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
    if state["approved"] or state["attempts"] >= 5:
        return END
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
@@check
from langgraph.graph import END
test("loop stops after the approved draft", lambda: final["attempts"] == 3)
test("final draft is v3", lambda: final["draft"] == "draft v3")
test("approved flag set", lambda: final["approved"] is True)
test("the router gives up after five attempts without approval", lambda: route({"attempts": 5, "approved": False, "draft": ""}) == END)
test("the router keeps writing while under budget and unapproved", lambda: route({"attempts": 2, "approved": False, "draft": ""}) == "write")
@@hint
The router currently ignores the state. It should look at `state["approved"]` and at `state["attempts"]`.
@@hint
`if state["approved"] or state["attempts"] >= 5: return END` then `return "write"`.
@@q
What does a conditional edge's router function return?
@@a
The name of the next node (or END), chosen from the current state.
@@q
Why does LangGraph have a recursion limit?
@@a
To stop runaway loops: agents that route back to themselves forever.
@@real
Real agents keep such budgets in state and route to a fallback node when they run out, which is exactly what the Self-Correct lesson builds. The recursion limit stays as the last line of defence.
