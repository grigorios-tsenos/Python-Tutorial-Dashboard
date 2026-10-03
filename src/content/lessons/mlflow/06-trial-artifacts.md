---
id: ml-artifacts
track: mlflow
order: 6
title: Save More Than the Final Score
tagline: Metric history tells the story; an artifact keeps the summary.
kind: build
xp: 50
minutes: 6
---
@@body
# Keep the score history and its summary

A metric can have multiple values, one per **step**. `mlflow.log_metric("quality", value, step=i)` records the learning curve; a run's summary metric exposes its latest value. `mlflow.log_dict(data, "summary.json")` stores a small structured artifact beside the run.

> **Mission:** implement `record_trial(name, params, scores)`. Start one run named `name` in experiment `trial-history`, log every supplied parameter, and log each quality score at its zero-based step. Save exactly `{"steps": len(scores), "best": max(scores), "last": scores[-1]}` as `summary.json`. Return the run ID after the run finishes. Reject an empty score list with `ValueError` before starting a run. Keep the input params and scores unchanged.

New calls must create independent runs, including trials where the best score arrives before the final step.
@@starter
import mlflow

def record_trial(name, params, scores):
    # TODO: one run, stepped metrics, summary artifact, returned run ID
    return None

run_id = record_trial("small-model", {"temperature": 0.2}, [0.4, 0.7, 0.6])
print(mlflow.get_run(run_id).data.metrics)
@@solution
import mlflow

def record_trial(name, params, scores):
    if not scores:
        raise ValueError("a trial needs at least one score")
    mlflow.set_experiment("trial-history")
    with mlflow.start_run(run_name=name) as run:
        mlflow.log_params(params)
        for step, score in enumerate(scores):
            mlflow.log_metric("quality", score, step=step)
        mlflow.log_dict({"steps": len(scores), "best": max(scores), "last": scores[-1]}, "summary.json")
        run_id = run.info.run_id
    return run_id

run_id = record_trial("small-model", {"temperature": 0.2}, [0.4, 0.7, 0.6])
print(mlflow.get_run(run_id).data.metrics)
@@check
params, scores = {"temperature": 0.5, "model": "new"}, [0.2, 0.9, 0.4]
original_params, original_scores = params.copy(), scores.copy()
first_id = record_trial("up-and-down", params, scores)
first = mlflow.get_run(first_id)
test("run name, experiment and parameters are recorded", lambda: first.info.run_name == "up-and-down" and first.info.experiment_name == "trial-history" and first.data.params == {"temperature": "0.5", "model": "new"})
test("each score keeps its zero-based step", lambda: first.metrics.get("quality") == [(0, 0.2), (1, 0.9), (2, 0.4)])
test("summary distinguishes best score from final score", lambda: first.artifacts.get("summary.json") == {"steps": 3, "best": 0.9, "last": 0.4} and first.data.metrics.get("quality") == 0.4)
test("the returned run is finished", lambda: first.info.status == "FINISHED" and mlflow.active_run() is None)
second_id = record_trial("one-step", {}, [0.75])
second = mlflow.get_run(second_id)
test("new trials have independent histories and artifacts", lambda: second_id != first_id and second.metrics.get("quality") == [(0, 0.75)] and second.artifacts.get("summary.json") == {"steps": 1, "best": 0.75, "last": 0.75})
test("caller data stays unchanged", lambda: params == original_params and scores == original_scores)
before = len(mlflow.search_runs(search_all_experiments=True))
try:
    record_trial("empty", {}, [])
    rejected = False
except ValueError:
    rejected = True
test("empty histories are rejected before a run is started", lambda: rejected and len(mlflow.search_runs(search_all_experiments=True)) == before and mlflow.active_run() is None)
@@hint
Validate the non-empty score list first. Inside `with mlflow.start_run(run_name=name) as run`, use `mlflow.log_params(params)` and `enumerate(scores)` to log metric steps.
@@hint
Use `mlflow.log_dict({...}, "summary.json")` for the three summary fields. Save `run.info.run_id` inside the context and return it after the context closes.
@@q
Does a run's latest metric always equal its best metric?
@@a
No. Logging preserves the full history, while the summary metric is the last recorded value.
@@real
Real MLflow keeps metric histories and artifacts in its tracking store. Orbit checks the stored history and artifact directly so this exercise works offline.
