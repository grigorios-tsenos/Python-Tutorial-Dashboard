---
id: lg-fanout
track: langgraph
order: 6
title: Run Guardrails in Parallel, Merge with a Reducer
tagline: Three checks write to the same list in the same step. A reducer decides how that merges.
kind: build
xp: 55
minutes: 7
---
@@body
# Fan out, fan in

Guardrail checks on a drafted reply (PII? too long? wrong tone?) don't depend on each other, so run them together.

**Fan out:** an edge from `START` to each check; nodes that become ready together run in one **step**. **Fan in:** an edge from each check to `decide`, which runs once after all three finish.

The catch: all three write `findings` in the same step. A plain key holds one value per step, so LangGraph raises `InvalidUpdateError`. A **reducer** says how parallel writes combine:

```python
class Review(TypedDict):
    findings: Annotated[list, operator.add]   # parallel lists are concatenated
```

> **Mission:** implement `build_review()` → the compiled graph:
>
> 1. give `findings` an `operator.add` reducer
> 2. fan out from `START` to the supplied checks as nodes **`pii`**, **`length`** and **`tone`**; fan in to **`decide`**, then `END`
> 3. `decide` sets `verdict` to `"send"` with no findings, else `"revise"`, and `summary` to the findings **sorted** and joined with `"; "` (`""` when none). Parallel writes arrive in any order, so sort first.
>
> Run the starter first to see the error without the reducer.
@@starter
import re
from typing import TypedDict
from langgraph.graph import StateGraph, START, END

class Review(TypedDict):
    draft: str
    findings: list          # TODO: parallel nodes append here; give it a reducer
    verdict: str
    summary: str

def check_pii(state):
    emails = re.findall(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+", state["draft"])
    return {"findings": [f"pii: {email}" for email in emails]}

def check_length(state):
    words = len(state["draft"].split())
    return {"findings": [f"length: {words} words"] if words > 40 else []}

def check_tone(state):
    words = set(re.findall(r"[a-z']+", state["draft"].lower()))
    return {"findings": [f"tone: {w}" for w in sorted(words & {"obviously", "stupid", "whatever"})]}

def decide(state):
    # TODO: verdict and summary from the merged findings
    return {}

def build_review():
    graph = StateGraph(Review)
    graph.add_node("pii", check_pii)
    graph.add_node("length", check_length)
    graph.add_node("tone", check_tone)
    graph.add_node("decide", decide)
    # TODO: fan out from START to the three checks, fan in to decide, then END
    for check in ["pii", "length", "tone"]:
        graph.add_edge(START, check)
        graph.add_edge(check, END)
    return graph.compile()

app = build_review()
print(app.invoke({"draft": "Obviously you should email ana@example.com for a refund."}))
@@solution
import operator
import re
from typing import Annotated, TypedDict
from langgraph.graph import StateGraph, START, END

class Review(TypedDict):
    draft: str
    findings: Annotated[list, operator.add]
    verdict: str
    summary: str

def check_pii(state):
    emails = re.findall(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+", state["draft"])
    return {"findings": [f"pii: {email}" for email in emails]}

def check_length(state):
    words = len(state["draft"].split())
    return {"findings": [f"length: {words} words"] if words > 40 else []}

def check_tone(state):
    words = set(re.findall(r"[a-z']+", state["draft"].lower()))
    return {"findings": [f"tone: {w}" for w in sorted(words & {"obviously", "stupid", "whatever"})]}

def decide(state):
    findings = sorted(state["findings"])
    return {"verdict": "revise" if findings else "send", "summary": "; ".join(findings)}

def build_review():
    graph = StateGraph(Review)
    graph.add_node("pii", check_pii)
    graph.add_node("length", check_length)
    graph.add_node("tone", check_tone)
    graph.add_node("decide", decide)
    for check in ["pii", "length", "tone"]:
        graph.add_edge(START, check)
        graph.add_edge(check, "decide")
    graph.add_edge("decide", END)
    return graph.compile()

app = build_review()
print(app.invoke({"draft": "Obviously you should email ana@example.com for a refund."}))
@@check
import orbit
review = build_review()
clean = review.invoke({"draft": "Thanks for waiting. Your refund is on its way."})
test("a clean draft is sent with no findings", lambda: clean["verdict"] == "send" and clean["findings"] == [] and clean["summary"] == "")
messy = review.invoke({"draft": "Obviously, write to ana@example.com or bo@test.org."})
test("findings from parallel checks are all kept", lambda: sorted(messy["findings"]) == ["pii: ana@example.com", "pii: bo@test.org", "tone: obviously"])
test("the verdict and a sorted summary come from decide", lambda: messy["verdict"] == "revise" and messy["summary"] == "pii: ana@example.com; pii: bo@test.org; tone: obviously")
long_draft = " ".join(["word"] * 41) + " whatever"
everything = review.invoke({"draft": long_draft + " mail me@x.io"})
test("all three checks can fire at once", lambda: sorted(everything["findings"]) == ["length: 44 words", "pii: me@x.io", "tone: whatever"])
again = review.invoke({"draft": "Thanks!"})
test("each run starts with empty findings", lambda: again["findings"] == [] and again["verdict"] == "send")
traces = [e["data"] for e in orbit._emits if e["kind"] == "graph_trace"]
order = [s["node"] for s in traces[-1]["steps"]]
test("the checks run side by side, then decide runs exactly once", lambda: sorted(order[:3]) == ["length", "pii", "tone"] and order[3:] == ["decide"])
test("the graph fans out from START and in to decide", lambda: {(e["from"], e["to"]) for e in traces[-1]["edges"]} >= {("__start__", "pii"), ("__start__", "length"), ("__start__", "tone"), ("pii", "decide"), ("length", "decide"), ("tone", "decide"), ("decide", "__end__")})
@@hint
Import `operator` and `Annotated`, then declare `findings: Annotated[list, operator.add]`. In `decide`, sort `state["findings"]` once and use it for both the verdict and the `"; "`-joined summary.
@@hint
Inside the loop, keep `graph.add_edge(START, check)` and change the second edge to `graph.add_edge(check, "decide")`. After the loop, add `graph.add_edge("decide", END)`.
@@q
What does `Annotated[list, operator.add]` change in a LangGraph state?
@@a
Updates to that key are combined with `operator.add` (concatenated) instead of replacing the value, so parallel writes all survive.
@@q
When does a fan-in node run if three parallel nodes all have an edge to it?
@@a
Once, in the next step, after all three have finished.
@@real
Real LangGraph raises `InvalidUpdateError` for concurrent writes to a key without a reducer, exactly as you saw. For a variable number of branches (one per retrieved document, say) use the `Send` API for map-reduce. Production guardrails often run a cheap classifier model in each branch.
