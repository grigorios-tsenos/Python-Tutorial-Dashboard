---
id: lg-hitl
track: langgraph
order: 4
title: Pause Before the Dangerous Part
tagline: Checkpointers give agents a memory and a pause button.
kind: build
xp: 45
minutes: 8
---
@@body
# Human-in-the-loop

Don't let an agent delete files unsupervised. LangGraph's **checkpointer** saves state after every step, keyed by `thread_id`, which unlocks:

- **Pause**: `compile(interrupt_before=["act"])` stops *before* the `act` node runs
- **Resume**: `app.invoke(None, config)` continues the same thread from where it stopped (`None` means "no new input")

```python
app = g.compile(checkpointer=MemorySaver(), interrupt_before=["act"])
config = {"configurable": {"thread_id": "ticket-42"}}
app.invoke({...}, config)          # runs until it hits the gate
app.get_state(config).next         # ('act',)  <- what's waiting
app.invoke(None, config)           # approved: carry on
```

> **Mission:** two TODOs. Compile with a `MemorySaver` that pauses before `"act"`, then resume the thread after "approval" and store the final state in `final`.

@@step Compile with a checkpointer and a gate
Without a checkpointer there is nothing to resume from. Pass one, and name the node to stop in front of:

```python
app = g.compile(checkpointer=MemorySaver(), interrupt_before=["act"])
```

**Do:** change the compile line, then Run. The cell should print `paused before: ('act',)`.
@@stepcheck
test("it paused before 'act'", lambda: "paused before: ('act',)" in __stdout__, 'g.compile(checkpointer=MemorySaver(), interrupt_before=["act"])')
@@step Resume the same thread
`invoke(None, config)` says: no new input, continue the saved thread identified by `config`. The paused `act` node runs and the graph finishes:

```python
final = app.invoke(None, config)
```

**Do:** replace `final = None`, then Run. `get_state(config).next` is now empty: nothing is waiting.
@@stepcheck
test("the resumed run finished the task", lambda: final is not None and final["result"] == "DONE -> delete temp files for: cleanup", "final = app.invoke(None, config)")
test("nothing is waiting any more", lambda: app.get_state(config).next == ())
@@starter
from typing import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

class State(TypedDict):
    task: str
    plan: str
    result: str

def plan(state):
    return {"plan": f"delete temp files for: {state['task']}"}

def act(state):
    return {"result": f"DONE -> {state['plan']}"}

g = StateGraph(State)
g.add_node("plan", plan)
g.add_node("act", act)
g.add_edge(START, "plan")
g.add_edge("plan", "act")
g.add_edge("act", END)

# TODO 1: compile with a MemorySaver checkpointer, pausing BEFORE the risky "act" node
app = g.compile()

config = {"configurable": {"thread_id": "ticket-42"}}
app.invoke({"task": "cleanup"}, config)
print("paused before:", app.get_state(config).next)

# TODO 2: a human approved it: resume the same thread and keep the final state
final = None
print(final)
@@solution
from typing import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

class State(TypedDict):
    task: str
    plan: str
    result: str

def plan(state):
    return {"plan": f"delete temp files for: {state['task']}"}

def act(state):
    return {"result": f"DONE -> {state['plan']}"}

g = StateGraph(State)
g.add_node("plan", plan)
g.add_node("act", act)
g.add_edge(START, "plan")
g.add_edge("plan", "act")
g.add_edge("act", END)

app = g.compile(checkpointer=MemorySaver(), interrupt_before=["act"])

config = {"configurable": {"thread_id": "ticket-42"}}
app.invoke({"task": "cleanup"}, config)
print("paused before:", app.get_state(config).next)

final = app.invoke(None, config)
print(final)
@@check
test("it paused before 'act'", lambda: "paused before: ('act',)" in __stdout__)
test("the resumed run finished the task", lambda: final is not None and final["result"] == "DONE -> delete temp files for: cleanup")
test("nothing is waiting any more", lambda: app.get_state(config).next == ())
@@hint
Import is already there: `MemorySaver()`. Pass it as `checkpointer=` and list the node name in `interrupt_before=[...]`.
@@hint
`app = g.compile(checkpointer=MemorySaver(), interrupt_before=["act"])`, then `final = app.invoke(None, config)`.
@@q
What does `invoke(None, config)` do after an interrupt?
@@a
Resumes the saved thread from where it paused, with no new input.
@@q
What identifies a conversation or run in a checkpointer?
@@a
The `thread_id` in `config["configurable"]`.
@@real
Real checkpointers: `MemorySaver` for dev, SQLite and Postgres savers for production. Newer releases also offer `interrupt()` inside nodes for richer approval flows.
