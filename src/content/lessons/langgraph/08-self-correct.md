---
id: lg-self-correct
track: langgraph
order: 8
title: Self-Correct, but Within a Budget
tagline: Let the model fix its own mistakes, then stop before the recursion limit stops you.
kind: build
xp: 65
minutes: 9
---
@@body
# Validate, feed back the error, retry, give up gracefully

A model extracting an order sometimes returns `"quantity": "two"`. Validation catches it; the production pattern is a loop:

```
START ─> generate ─> validate ─┬─ valid ──────────────> END
            ^                  ├─ invalid, budget left ─┘ (back to generate, with the error)
            └──────────────────┤
                               └─ budget spent ──> fallback ─> END
```

Two things make it safe:

- **Feedback.** The next attempt sees *why* the last one failed; retrying the same prompt mostly repeats the mistake.
- **A budget in state.** Count attempts and route to a `fallback` node (hand off to a human) instead of hitting `GraphRecursionError`.

> **Mission:** implement `build_extractor(model, max_attempts=3)` and return a compiled graph with nodes **`generate`**, **`validate`** and **`fallback`**:
>
> - `generate` calls `model(message, feedback)`, where `feedback` is the previous validation error (`None` on the first attempt). It stores the reply in `raw` and increments `attempts`, which starts at 0 when missing.
> - `validate` runs the supplied `parse_order(raw)`. On success, set `order` to its result, `status` to `"ok"` and `error` to `None`. On `ValueError`, set `error` to the exception's message.
> - after `validate`: finish when `status` is `"ok"`; otherwise go back to `generate` while `attempts < max_attempts`, else to `fallback`
> - `fallback` sets `order` to `None` and `status` to `"needs_human"`, then the graph ends
> - `max_attempts < 1` raises `ValueError`; every `invoke` starts a fresh count
@@starter
import json
from typing import TypedDict
from langgraph.graph import StateGraph, START, END

class Extraction(TypedDict):
    message: str
    raw: str
    order: dict
    error: str
    attempts: int
    status: str

def parse_order(raw):
    """Return {"sku", "quantity"} or raise ValueError explaining what is wrong."""
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        raise ValueError("reply must be valid JSON") from None
    if not isinstance(data, dict):
        raise ValueError("reply must be a JSON object")
    sku, quantity = data.get("sku"), data.get("quantity")
    if not isinstance(sku, str) or not sku.strip():
        raise ValueError("sku must be a non-empty string")
    if type(quantity) is not int or not 1 <= quantity <= 99:
        raise ValueError("quantity must be an integer from 1 to 99")
    return {"sku": sku.strip(), "quantity": quantity}

def build_extractor(model, max_attempts=3):
    def generate(state):
        # TODO: pass the previous error as feedback, count the attempt
        return {"raw": model(state["message"], None)}

    def validate(state):
        # TODO: parse_order(...) -> order/status/error
        return {}

    def fallback(state):
        # TODO
        return {}

    def route(state):
        # TODO: END when ok, generate while budget remains, else fallback
        return END

    graph = StateGraph(Extraction)
    graph.add_node("generate", generate)
    graph.add_node("validate", validate)
    graph.add_node("fallback", fallback)
    graph.add_edge(START, "generate")
    graph.add_edge("generate", "validate")
    graph.add_conditional_edges("validate", route, {"generate": "generate", "fallback": "fallback", END: END})
    graph.add_edge("fallback", END)
    return graph.compile()

def scripted(*replies):
    """A fake model that returns replies in order and records the feedback it was given."""
    queue = list(replies)
    def model(message, feedback):
        model.feedback.append(feedback)
        return queue.pop(0)
    model.feedback = []
    return model

model = scripted('{"sku": "KB-01", "quantity": "two"}', '{"sku": "KB-01", "quantity": 2}')
result = build_extractor(model).invoke({"message": "Two keyboards please (KB-01)"})
print(result.get("status"), result.get("order"), result.get("attempts"))
print("feedback the model saw:", model.feedback)
@@solution
import json
from typing import TypedDict
from langgraph.graph import StateGraph, START, END

class Extraction(TypedDict):
    message: str
    raw: str
    order: dict
    error: str
    attempts: int
    status: str

def parse_order(raw):
    """Return {"sku", "quantity"} or raise ValueError explaining what is wrong."""
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        raise ValueError("reply must be valid JSON") from None
    if not isinstance(data, dict):
        raise ValueError("reply must be a JSON object")
    sku, quantity = data.get("sku"), data.get("quantity")
    if not isinstance(sku, str) or not sku.strip():
        raise ValueError("sku must be a non-empty string")
    if type(quantity) is not int or not 1 <= quantity <= 99:
        raise ValueError("quantity must be an integer from 1 to 99")
    return {"sku": sku.strip(), "quantity": quantity}

def build_extractor(model, max_attempts=3):
    if max_attempts < 1:
        raise ValueError("max_attempts must be at least 1")

    def generate(state):
        return {"raw": model(state["message"], state.get("error")), "attempts": state.get("attempts", 0) + 1}

    def validate(state):
        try:
            return {"order": parse_order(state["raw"]), "status": "ok", "error": None}
        except ValueError as error:
            return {"error": str(error)}

    def fallback(state):
        return {"order": None, "status": "needs_human"}

    def route(state):
        if state.get("status") == "ok":
            return END
        return "generate" if state["attempts"] < max_attempts else "fallback"

    graph = StateGraph(Extraction)
    graph.add_node("generate", generate)
    graph.add_node("validate", validate)
    graph.add_node("fallback", fallback)
    graph.add_edge(START, "generate")
    graph.add_edge("generate", "validate")
    graph.add_conditional_edges("validate", route, {"generate": "generate", "fallback": "fallback", END: END})
    graph.add_edge("fallback", END)
    return graph.compile()

def scripted(*replies):
    """A fake model that returns replies in order and records the feedback it was given."""
    queue = list(replies)
    def model(message, feedback):
        model.feedback.append(feedback)
        return queue.pop(0)
    model.feedback = []
    return model

model = scripted('{"sku": "KB-01", "quantity": "two"}', '{"sku": "KB-01", "quantity": 2}')
result = build_extractor(model).invoke({"message": "Two keyboards please (KB-01)"})
print(result.get("status"), result.get("order"), result.get("attempts"))
print("feedback the model saw:", model.feedback)
@@check
import orbit
def last_trace():
    return [s["node"] for s in [e for e in orbit._emits if e["kind"] == "graph_trace"][-1]["data"]["steps"]]

good = scripted('{"sku": " MS-7 ", "quantity": 1}')
first = build_extractor(good).invoke({"message": "one mouse"})
test("a valid first reply finishes after one attempt", lambda: first["status"] == "ok" and first["order"] == {"sku": "MS-7", "quantity": 1} and first["attempts"] == 1 and good.feedback == [None])
fixed = scripted('not json', '{"sku": "KB-01", "quantity": 0}', '{"sku": "KB-01", "quantity": 2}')
second = build_extractor(fixed, max_attempts=3).invoke({"message": "two keyboards"})
test("each retry receives the previous validation error", lambda: fixed.feedback == [None, "reply must be valid JSON", "quantity must be an integer from 1 to 99"])
test("the corrected reply is accepted and the error cleared", lambda: second["status"] == "ok" and second["order"] == {"sku": "KB-01", "quantity": 2} and second["attempts"] == 3 and second["error"] is None)
test("the loop alternates generate and validate", lambda: last_trace() == ["generate", "validate"] * 3)
stubborn = scripted('{"sku": ""}', '{"sku": ""}', '{"sku": ""}', '{"sku": "late", "quantity": 1}')
spent = build_extractor(stubborn, max_attempts=2).invoke({"message": "???"})
test("an exhausted budget routes to fallback instead of looping", lambda: spent["status"] == "needs_human" and spent["order"] is None and spent["attempts"] == 2 and len(stubborn.feedback) == 2)
test("the fallback runs once, at the end", lambda: last_trace() == ["generate", "validate", "generate", "validate", "fallback"])
test("the last error is kept for the human", lambda: spent["error"] == "sku must be a non-empty string")
single = scripted('[]', '{"sku": "A", "quantity": 1}')
test("max_attempts=1 means a single try", lambda: build_extractor(single, max_attempts=1).invoke({"message": "x"})["status"] == "needs_human" and single.feedback == [None])
reused = scripted('{"sku": "A", "quantity": 5}', 'oops', '{"sku": "B", "quantity": 6}')
app2 = build_extractor(reused)
test("every invoke starts a fresh attempt count", lambda: app2.invoke({"message": "a"})["attempts"] == 1 and app2.invoke({"message": "b"})["attempts"] == 2 and reused.feedback == [None, None, "reply must be valid JSON"])
try:
    build_extractor(good, max_attempts=0)
    rejected = False
except ValueError:
    rejected = True
test("a budget below one is rejected", lambda: rejected)
@@hint
`generate` returns `{"raw": model(state["message"], state.get("error")), "attempts": state.get("attempts", 0) + 1}`. `validate` wraps `parse_order(state["raw"])` in `try`/`except ValueError as error` and returns `{"error": str(error)}` on failure.
@@hint
The router checks `state.get("status") == "ok"` first (return `END`), then returns `"generate"` if `state["attempts"] < max_attempts` and `"fallback"` otherwise. Validate `max_attempts` at the top of `build_extractor`.
@@q
Why pass the validation error back to the model on a retry?
@@a
The model can correct the specific mistake; retrying the identical prompt tends to repeat it.
@@q
Why keep an attempt counter in state instead of relying on the recursion limit?
@@a
The counter lets the graph end gracefully in a fallback path; the recursion limit only raises an error mid-run.
@@real
This is the "reflection" pattern used for structured extraction and code generation. In production the fallback node often calls `interrupt()` for a human reviewer, with `config={"recursion_limit": ...}` set above your largest budget.
