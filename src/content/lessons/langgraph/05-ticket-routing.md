---
id: lg-routing
track: langgraph
order: 5
title: Give Each Ticket the Right Path
tagline: Build two branches and make the threshold reusable.
kind: build
xp: 50
minutes: 6
---
@@body
# Choose a branch before doing the work

Conditional edges can route from `START`: the router reads the input state and returns a branch name, and the path map connects that name to a node.

> **Mission:** implement `build_router(threshold)` to return a compiled graph. Route priorities **greater than or equal to** the threshold to the supplied `urgent` node; route lower priorities to `standard`. Run exactly one branch, then finish at `END`. Keep the input question and priority in the final state.

The graph must use the threshold passed to the builder.
@@starter
from typing import TypedDict
from langgraph.graph import StateGraph, START, END

class Ticket(TypedDict):
    question: str
    priority: int
    reply: str

def urgent(state):
    return {"reply": "URGENT: " + state["question"]}

def standard(state):
    return {"reply": "QUEUED: " + state["question"]}

def build_router(threshold):
    graph = StateGraph(Ticket)
    graph.add_node("urgent", urgent)
    graph.add_node("standard", standard)
    # TODO: route START to one branch, then both branches to END
    return graph.compile()

app = build_router(3)
print(app.invoke({"question": "Pipeline failed", "priority": 3})["reply"])
@@solution
from typing import TypedDict
from langgraph.graph import StateGraph, START, END

class Ticket(TypedDict):
    question: str
    priority: int
    reply: str

def urgent(state):
    return {"reply": "URGENT: " + state["question"]}

def standard(state):
    return {"reply": "QUEUED: " + state["question"]}

def build_router(threshold):
    graph = StateGraph(Ticket)
    graph.add_node("urgent", urgent)
    graph.add_node("standard", standard)
    graph.add_conditional_edges(START, lambda state: "urgent" if state["priority"] >= threshold else "standard", {"urgent": "urgent", "standard": "standard"})
    graph.add_edge("urgent", END)
    graph.add_edge("standard", END)
    return graph.compile()

app = build_router(3)
print(app.invoke({"question": "Pipeline failed", "priority": 3})["reply"])
@@check
import orbit
urgent_result = app.invoke({"question": "Data is missing", "priority": 4})
standard_result = app.invoke({"question": "Add a chart", "priority": 2})
boundary = app.invoke({"question": "At the threshold", "priority": 3})
test("high-priority tickets take the urgent branch", lambda: urgent_result["reply"] == "URGENT: Data is missing")
test("lower-priority tickets take the standard branch", lambda: standard_result["reply"] == "QUEUED: Add a chart")
test("the threshold itself is urgent", lambda: boundary["reply"] == "URGENT: At the threshold")
test("routing keeps input fields in state", lambda: standard_result["question"] == "Add a chart" and standard_result["priority"] == 2)
other = build_router(5)
probe = other.invoke({"question": "Different team", "priority": 4})
test("a new builder threshold changes the chosen path", lambda: probe["reply"] == "QUEUED: Different team")
trace = [event for event in orbit._emits if event["kind"] == "graph_trace"][-1]
test("only the selected branch runs", lambda: [step["node"] for step in trace["data"]["steps"]] == ["standard"])
@@hint
Use `add_conditional_edges(START, router, path_map)`. The router can close over the builder's `threshold` and compare it with `state["priority"]`.
@@hint
Map `"urgent"` to `"urgent"` and `"standard"` to `"standard"`, then add an edge from each node to `END` before compiling.
@@q
Can a conditional edge start at START?
@@a
Yes. It chooses the first node from the input state before any node runs.
@@real
The same pattern routes to support specialists, model sizes or processing queues. Keep the rule in the graph builder so each compiled graph has a clear policy.
