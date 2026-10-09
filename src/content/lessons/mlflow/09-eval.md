---
id: ml-eval
track: mlflow
order: 9
title: "Boss: The Prompt Bake-Off"
tagline: Stop guessing which prompt is better. Measure it.
kind: boss
xp: 120
minutes: 12
---
@@body
# Boss: an evaluation harness for LLM prompts

"This prompt feels better" is not engineering. The loop is **fixed dataset → run each candidate → log a score → compare**, and MLflow makes every candidate a run you can sort and reproduce. Here the "prompt versions" are tiny functions standing in for model calls.

> **Mission:** write `evaluate_prompts(candidates, dataset)`:
> - `candidates` is `{name: fn(question) -> answer}`; `dataset` is a list of `(question, expected)`
> - for **each** candidate, start a run **named after it**, log param `prompt_version=<name>` and metric `accuracy` (fraction answered exactly right)
> - **return the name** with the highest accuracy; ties go to the first candidate; no candidates returns `None`
> - an empty dataset raises `ValueError` before any run is logged

The boss uses new names and a different dataset: the winner must come from measured results.

@@step Score every candidate in its own run
Reject an empty dataset first. Then, per candidate, open a run named after it and log the version as a param and the accuracy (correct answers divided by dataset size) as a metric.
@@stepcheck
import mlflow
evaluate_prompts({"v1": v1, "v2": v2, "v3": v3}, DATASET)
df = mlflow.search_runs(max_results=3)
scores = dict(zip(df["params.prompt_version"], df["metrics.accuracy"]))
test("accuracy logged per candidate, in a run named after it", lambda: scores == {"v1": 0.5, "v2": 0.75, "v3": 0.25} and sorted(df["tags.mlflow.runName"]) == ["v1", "v2", "v3"], "got " + str(scores))
def rejected():
    try:
        evaluate_prompts({"unused": v1}, [])
    except ValueError:
        return True
    return False
test("empty datasets are rejected", rejected)
@@step Return the measured winner
Track the best name and score as you go, updating only on a *strictly* higher score so ties keep the first candidate. With no candidates the loop never runs and `None` comes back.
@@stepcheck
test("returns the most accurate candidate", lambda: evaluate_prompts({"v1": v1, "v2": v2, "v3": v3}, DATASET) == "v2", "update best only when acc > best_acc")
test("ties keep the first candidate and no candidates gives None", lambda: evaluate_prompts({"first": lambda q: "A", "second": lambda q: "A"}, [("a", "A")]) == "first" and evaluate_prompts({}, DATASET) is None)
@@starter
import mlflow

DATASET = [("2+2", "4"), ("capital of France", "Paris"), ("3*3", "9"), ("opposite of hot", "cold")]

def v1(q): return {"2+2": "4", "3*3": "9"}.get(q, "unknown")
def v2(q): return {"2+2": "4", "capital of France": "Paris", "3*3": "9"}.get(q, "unknown")
def v3(q): return "4"

def evaluate_prompts(candidates, dataset):
    """Log a run per candidate; return the name of the most accurate one."""
    # TODO
    return None

print(evaluate_prompts({"v1": v1, "v2": v2, "v3": v3}, DATASET))
@@solution
import mlflow

DATASET = [("2+2", "4"), ("capital of France", "Paris"), ("3*3", "9"), ("opposite of hot", "cold")]

def v1(q): return {"2+2": "4", "3*3": "9"}.get(q, "unknown")
def v2(q): return {"2+2": "4", "capital of France": "Paris", "3*3": "9"}.get(q, "unknown")
def v3(q): return "4"

def evaluate_prompts(candidates, dataset):
    """Log a run per candidate; return the name of the most accurate one."""
    if not dataset:
        raise ValueError("evaluation needs a non-empty dataset")
    mlflow.set_experiment("prompt-eval")
    best_name, best_acc = None, -1.0
    for name, fn in candidates.items():
        with mlflow.start_run(run_name=name):
            correct = sum(fn(q) == expected for q, expected in dataset)
            acc = correct / len(dataset)
            mlflow.log_param("prompt_version", name)
            mlflow.log_metric("accuracy", acc)
        if acc > best_acc:
            best_name, best_acc = name, acc
    return best_name

print(evaluate_prompts({"v1": v1, "v2": v2, "v3": v3}, DATASET))
@@check
import mlflow
best = evaluate_prompts({"v1": v1, "v2": v2, "v3": v3}, DATASET)
df = mlflow.search_runs(max_results=3)
scores = dict(zip(df["params.prompt_version"], df["metrics.accuracy"]))
test("returns the most accurate candidate", lambda: best == "v2", "got " + str(best))
test("accuracy logged per candidate", lambda: scores == {"v1": 0.5, "v2": 0.75, "v3": 0.25}, "got " + str(scores))
test("each run is named after its candidate", lambda: sorted(df["tags.mlflow.runName"]) == ["v1", "v2", "v3"])
fresh = evaluate_prompts({"baseline": lambda q: "no", "improved": lambda q: q.upper()}, [("a", "A"), ("b", "B")])
fresh_runs = mlflow.search_runs(max_results=2)
fresh_scores = dict(zip(fresh_runs["params.prompt_version"], fresh_runs["metrics.accuracy"]))
test("new candidates are measured on the new dataset", lambda: fresh == "improved" and fresh_scores == {"baseline": 0.0, "improved": 1.0})
test("ties keep the first candidate", lambda: evaluate_prompts({"first": lambda q: "A", "second": lambda q: "A"}, [("a", "A")]) == "first")
before = len(mlflow.search_runs(search_all_experiments=True))
test("no candidates gives no winner", lambda: evaluate_prompts({}, DATASET) is None)
try:
    evaluate_prompts({"unused": v1}, [])
    rejected = False
except ValueError:
    rejected = True
test("empty datasets are rejected without logging runs", lambda: rejected and len(mlflow.search_runs(search_all_experiments=True)) == before)
@@hint
Reject an empty dataset before starting any runs. Loop over `candidates.items()` and, inside `with mlflow.start_run(run_name=name):`, compute `sum(fn(q) == expected for q, expected in dataset) / len(dataset)`.
@@hint
Log `mlflow.log_param("prompt_version", name)` and `mlflow.log_metric("accuracy", acc)`. Start with `best_name=None`, `best_acc=-1` and update only on a strictly higher score so ties keep the first candidate.
@@q
Why log every prompt candidate as an MLflow run?
@@a
Runs are comparable, reproducible and shareable: you can sort by metric instead of guessing.
@@q
What does a fixed evaluation dataset guarantee?
@@a
Every candidate is scored on the same questions, so the comparison is fair.
@@real
Real MLflow 3 adds `mlflow.genai.evaluate()` with built-in LLM judges and scorers, and traces each model call. The loop you built (dataset, candidate, score, compare) is exactly what it automates.
