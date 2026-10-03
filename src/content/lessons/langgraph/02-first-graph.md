---
id: lg-first
track: langgraph
order: 2
title: Your First State Graph
tagline: Nodes do work. Edges decide what's next. State is the memory.
kind: lab
xp: 35
minutes: 6
---
@@body
# Agents are state machines

A chain is a straight line. Real agents *loop, branch and wait*, so you need a graph. **LangGraph** has three ingredients:

- **State**: a typed dict every node can read
- **Nodes**: plain functions that return a *partial update* to the state
- **Edges**: which node runs next (`START` and `END` are the entry and exit)

```python
graph = StateGraph(State)
graph.add_node("a", func_a)
graph.add_edge(START, "a")
graph.add_edge("a", END)
app = graph.compile()
app.invoke({...})
```

Run the starter first: LangGraph refuses to compile a graph with no way in. Then wire it up and watch the **Graph Lab** animate your run, step by step.

> **Mission:** connect `START → write_draft → polish → END`.
@@starter
from typing import TypedDict
from langgraph.graph import StateGraph, START, END

class State(TypedDict):
    question: str
    draft: str
    final: str

def write_draft(state):
    return {"draft": f"Answer to '{state['question']}': it depends."}

def polish(state):
    return {"final": state["draft"].upper()}

graph = StateGraph(State)
graph.add_node("write_draft", write_draft)
graph.add_node("polish", polish)

# TODO: wire START -> write_draft -> polish -> END

app = graph.compile()
result = app.invoke({"question": "Should I use LangGraph?"})
print(result["final"])
@@solution
from typing import TypedDict
from langgraph.graph import StateGraph, START, END

class State(TypedDict):
    question: str
    draft: str
    final: str

def write_draft(state):
    return {"draft": f"Answer to '{state['question']}': it depends."}

def polish(state):
    return {"final": state["draft"].upper()}

graph = StateGraph(State)
graph.add_node("write_draft", write_draft)
graph.add_node("polish", polish)

graph.add_edge(START, "write_draft")
graph.add_edge("write_draft", "polish")
graph.add_edge("polish", END)

app = graph.compile()
result = app.invoke({"question": "Should I use LangGraph?"})
print(result["final"])
@@check
test("both nodes ran, in order", lambda: result["final"] == "ANSWER TO 'SHOULD I USE LANGGRAPH?': IT DEPENDS.")
test("the draft is kept in state", lambda: result["draft"].startswith("Answer to"))
@@hint
Three `graph.add_edge(a, b)` calls: one from `START`, one between the nodes, one to `END`.
@@hint
`graph.add_edge(START, "write_draft")`, `graph.add_edge("write_draft", "polish")`, `graph.add_edge("polish", END)`
@@q
What does a LangGraph node return?
@@a
A dict with a partial update to the state: only the keys it wants to change.
@@q
What are START and END?
@@a
Special markers for the graph's entry point and exit.
@@real
Same API in real LangGraph: `from langgraph.graph import StateGraph, START, END`. Real LangGraph can also draw your graph as a Mermaid diagram with `app.get_graph().draw_mermaid()`.
