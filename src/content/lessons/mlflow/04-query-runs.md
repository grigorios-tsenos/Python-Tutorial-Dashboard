---
id: ml-search
track: mlflow
order: 4
title: Query the Run History
tagline: The most accurate model is useless if it misses your latency budget.
kind: build
xp: 45
minutes: 7
---
@@body
# Ask the tracking server, don't scroll the table

Product needs answers within **150 ms**, so you want the best model **that meets the budget**, not the best overall. `mlflow.search_runs` filters on the server and returns a DataFrame:

| prefix | example | note |
|---|---|---|
| `metrics.` | `metrics.accuracy > 0.8` | numbers, **unquoted** |
| `params.` | `params.model = 'small'` | strings, **quoted** |
| `attributes.` | `attributes.status = 'FINISHED'` | status, name, times |

> **Mission:** implement `best_within_budget(experiment, max_latency_ms)` → `{"run_id", "model", "accuracy", "latency_ms"}` for the most accurate **finished** run in that experiment with `latency_ms` **at most** the budget; ties go to the lower latency. Return `None` when nothing qualifies. Don't log runs.

The supplied `log_candidate` fills the history, including a crashed run that looks best on paper.

@@step Filter on the server: budget and status
The starter picks the globally best run, which is the crashed `small-v2`. Push the conditions into the query so the server returns only candidates that qualify:

```python
filter_string=f"metrics.latency_ms <= {max_latency_ms} and attributes.status = 'FINISHED'",
```

Metric values go in unquoted; the status is a string and must be quoted.

**Do:** add the filter to `search_runs`, then Run. The pick becomes `small` at 0.88.
@@stepcheck
pick = best_within_budget("ticket-classifier", 150)
test("the best finished run inside the budget wins", lambda: pick is not None and pick["model"] == "small" and pick["accuracy"] == 0.88 and pick["latency_ms"] == 95, "filter_string with metrics.latency_ms <= ... and attributes.status = 'FINISHED'")
@@step Scope to the experiment, break ties, handle nothing
Three more rules: `experiment_names=[experiment]` so the active experiment does not matter; `order_by=["metrics.accuracy DESC", "metrics.latency_ms ASC"]` so equal accuracies prefer the faster run; and `if runs.empty: return None` before `.iloc[0]`.

**Do:** add all three, then Run.
@@stepcheck
import mlflow
mlflow.set_experiment("other-team")
log_candidate("their-best", "huge", 0.99, 10)
mlflow.set_experiment("ties")
log_candidate("slow-twin", "a", 0.9, 70)
log_candidate("fast-twin", "b", 0.9, 30)
mlflow.set_experiment("Default")
test("other experiments are ignored, whatever experiment is active", lambda: best_within_budget("ticket-classifier", 150)["model"] == "small", "experiment_names=[experiment]")
test("accuracy ties go to the faster run", lambda: best_within_budget("ties", 100)["model"] == "b", 'order_by=["metrics.accuracy DESC", "metrics.latency_ms ASC"]')
test("nothing within budget gives None", lambda: best_within_budget("ticket-classifier", 5) is None, "if runs.empty: return None")
@@starter
import mlflow

def log_candidate(name, model, accuracy, latency_ms, status="FINISHED"):
    mlflow.start_run(run_name=name)
    mlflow.log_param("model", model)
    mlflow.log_metrics({"accuracy": accuracy, "latency_ms": latency_ms})
    mlflow.end_run(status)

mlflow.set_experiment("ticket-classifier")
log_candidate("tiny", "tiny", 0.81, 40)
log_candidate("small", "small", 0.88, 95)
log_candidate("medium", "medium", 0.88, 120)
log_candidate("large", "large", 0.93, 310)
log_candidate("small-v2", "small", 0.95, 80, status="FAILED")   # crashed before evaluation finished

def best_within_budget(experiment, max_latency_ms):
    """The most accurate finished run in `experiment` within the latency budget, or None."""
    # BUG: ignores the budget, the run status and the experiment
    best = mlflow.search_runs(search_all_experiments=True, order_by=["metrics.accuracy DESC"]).iloc[0]
    return {"run_id": best["run_id"], "model": best["params.model"],
            "accuracy": float(best["metrics.accuracy"]), "latency_ms": float(best["metrics.latency_ms"])}

print(best_within_budget("ticket-classifier", 150))
@@solution
import mlflow

def log_candidate(name, model, accuracy, latency_ms, status="FINISHED"):
    mlflow.start_run(run_name=name)
    mlflow.log_param("model", model)
    mlflow.log_metrics({"accuracy": accuracy, "latency_ms": latency_ms})
    mlflow.end_run(status)

mlflow.set_experiment("ticket-classifier")
log_candidate("tiny", "tiny", 0.81, 40)
log_candidate("small", "small", 0.88, 95)
log_candidate("medium", "medium", 0.88, 120)
log_candidate("large", "large", 0.93, 310)
log_candidate("small-v2", "small", 0.95, 80, status="FAILED")   # crashed before evaluation finished

def best_within_budget(experiment, max_latency_ms):
    """The most accurate finished run in `experiment` within the latency budget, or None."""
    runs = mlflow.search_runs(
        experiment_names=[experiment],
        filter_string=f"metrics.latency_ms <= {max_latency_ms} and attributes.status = 'FINISHED'",
        order_by=["metrics.accuracy DESC", "metrics.latency_ms ASC"],
    )
    if runs.empty:
        return None
    best = runs.iloc[0]
    return {"run_id": best["run_id"], "model": best["params.model"],
            "accuracy": float(best["metrics.accuracy"]), "latency_ms": float(best["metrics.latency_ms"])}

print(best_within_budget("ticket-classifier", 150))
@@check
import mlflow
total = lambda: len(mlflow.search_runs(search_all_experiments=True))
mlflow.set_experiment("other-team")
log_candidate("their-best", "huge", 0.99, 10)
mlflow.set_experiment("Default")
before = total()
pick = best_within_budget("ticket-classifier", 150)
test("the best run inside the budget wins", lambda: pick is not None and pick["model"] == "small" and pick["accuracy"] == 0.88 and pick["latency_ms"] == 95)
test("the run_id points at that run", lambda: pick is not None and mlflow.get_run(pick["run_id"]).info.run_name == "small")
test("crashed runs are ignored even when they look best", lambda: pick is not None and pick["accuracy"] < 0.95)
test("other experiments are ignored, whatever experiment is active", lambda: pick is not None and pick["model"] != "huge")
test("the budget is inclusive", lambda: best_within_budget("ticket-classifier", 95)["model"] == "small" and best_within_budget("ticket-classifier", 94.9)["model"] == "tiny")
test("a generous budget allows the large model", lambda: best_within_budget("ticket-classifier", 500)["model"] == "large")
test("nothing within budget gives None", lambda: best_within_budget("ticket-classifier", 5) is None)
mlflow.set_experiment("ties")
log_candidate("slow-twin", "a", 0.9, 70)
log_candidate("fast-twin", "b", 0.9, 30)
log_candidate("too-slow", "c", 0.97, 200)
test("accuracy ties go to the faster run", lambda: best_within_budget("ties", 100)["model"] == "b")
test("searching does not log new runs", lambda: total() == before + 3)
@@hint
Pass `experiment_names=[experiment]` so the active experiment doesn't matter, and build the filter with an f-string: `f"metrics.latency_ms <= {max_latency_ms} and attributes.status = 'FINISHED'"`. Metric values are unquoted; the status is quoted.
@@hint
Use `order_by=["metrics.accuracy DESC", "metrics.latency_ms ASC"]`, return `None` if the DataFrame is `.empty`, otherwise read `params.model`, `metrics.accuracy` and `metrics.latency_ms` from `.iloc[0]`.
@@q
Why are param values quoted in an MLflow filter string but metric values are not?
@@a
Params are stored as strings; metrics are numbers.
@@q
How do you exclude crashed runs from `search_runs`?
@@a
Filter on `attributes.status = 'FINISHED'`.
@@real
The MLflow UI's search box and Databricks experiment pages accept the same filter syntax. `MlflowClient().search_runs(...)` returns `Run` objects instead of a DataFrame, handy in automation.
