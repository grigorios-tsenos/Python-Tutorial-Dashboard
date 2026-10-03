---
id: lg-state
track: langgraph
order: 1
title: An Agent Is State Plus Steps
tagline: Strip the framework away and an agent is a dict passed through functions.
kind: run
xp: 25
minutes: 4
---
@@body
# What LangGraph automates

Every agent, under the hood:

```
state = {"question": "...", ...}      # one dict holds everything known so far
state = merge(state, research(state)) # each STEP reads state, returns what it adds
state = merge(state, draft(state))    # the next step sees the previous step's work
```

A **step** (a *node* in LangGraph) is a plain function: whole state in, **only the keys it adds or changes** out — a *partial update*. Merging that update carries information to the next step.

Two rules:

- **Don't modify the old state.** Build a new dict (`{**state, **update}`). Pause/resume only works because old states stay intact.
- **Steps stay small.** A step that returns `{"draft": ...}` can be tested alone, reordered, or retried.

> **Mission:** implement `merge(state, update)` (a new dict; neither input modified), then run the two supplied steps in order so `final` contains the question, the facts and the draft.
@@starter
def merge(state, update):
    """A NEW dict with update's keys layered over state's. Don't modify either."""
    # TODO
    return state

def research(state):
    return {"facts": f"3 docs about: {state['question']}"}

def draft(state):
    return {"draft": f"Answer using {state['facts']}"}

state = {"question": "What is a vector store?"}
# TODO: apply research, then draft, keeping each step's additions
final = state
print(final)
@@solution
def merge(state, update):
    """A NEW dict with update's keys layered over state's. Don't modify either."""
    return {**state, **update}

def research(state):
    return {"facts": f"3 docs about: {state['question']}"}

def draft(state):
    return {"draft": f"Answer using {state['facts']}"}

state = {"question": "What is a vector store?"}
final = merge(state, research(state))
final = merge(final, draft(final))
print(final)
@@check
test("merge layers the update over the state", lambda: merge({"a": 1, "b": 2}, {"b": 9, "c": 3}) == {"a": 1, "b": 9, "c": 3})
s, u = {"a": 1}, {"b": 2}
merged = merge(s, u)
test("merge returns a new dict and modifies neither input", lambda: merged == {"a": 1, "b": 2} and merged is not s and s == {"a": 1} and u == {"b": 2})
test("final keeps the original question", lambda: final.get("question") == "What is a vector store?")
test("research's facts reached the draft step", lambda: final.get("facts") == "3 docs about: What is a vector store?" and final.get("draft") == "Answer using 3 docs about: What is a vector store?")
test("the first state was not modified along the way", lambda: state == {"question": "What is a vector store?"})
@@hint
`{**state, **update}` builds one new dict: first all of `state`'s keys, then `update`'s keys on top (so an updated key wins).
@@hint
Chain the steps: `final = merge(state, research(state))`, then `final = merge(final, draft(final))`. Each step only sees what has been merged so far.
@@q
What does a step (node) return: the whole new state or just its changes?
@@a
Just its changes, a partial update. Merging it into the state is a separate, uniform operation.
@@q
Why must merging build a new dict instead of editing the old one?
@@a
Keeping old states intact is what makes pausing, resuming and inspecting an agent's history possible.
@@real
This is literally LangGraph's model: nodes return partial updates and the framework merges them into typed state. What it adds is deciding *which* function runs next: edges, branches and loops.
