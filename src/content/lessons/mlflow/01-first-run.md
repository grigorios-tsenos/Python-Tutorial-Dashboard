---
id: ml-first-run
track: mlflow
order: 1
title: Write Down What You Tried
tagline: The experiment you don't record is the result you'll lose by Friday.
kind: run
xp: 25
minutes: 4
---
@@body
# The big picture: experiments need a lab notebook

Tuning anything (a prompt, a learning rate, a chunk size) means trying many versions. By attempt twelve, nobody remembers what attempt three used. MLflow is the lab notebook: each attempt becomes a **run**, and a run records two kinds of values:

| | what it is | example |
|---|---|---|
| **param** | an input *you chose* | `model = "tiny"` |
| **metric** | a result *you measured* | `accuracy = 0.72` |

The pattern is three lines, and you will type it in every lesson of this chapter:

```python
with mlflow.start_run(run_name="attempt-1"):   # open the notebook page...
    mlflow.log_param("model", "tiny")          # what I chose
    mlflow.log_metric("accuracy", 0.72)        # what I measured
# leaving the `with` block closes the run
```

Why the `with` block? It marks exactly where the run begins and ends, so everything logged inside belongs to that attempt, and the run closes even if your code crashes mid-way.

> **Mission:** record your first attempt: a run named `baseline` that logs the param `model = "tiny"` and the metric `accuracy = 0.72`. The last line then finds it again, which is the whole point.
@@starter
import mlflow

# TODO: one run named "baseline" with param model="tiny" and metric accuracy=0.72
with mlflow.start_run(run_name="baseline"):
    pass

print(mlflow.search_runs())   # the notebook page you just wrote
@@solution
import mlflow

with mlflow.start_run(run_name="baseline"):
    mlflow.log_param("model", "tiny")
    mlflow.log_metric("accuracy", 0.72)

print(mlflow.search_runs())   # the notebook page you just wrote
@@check
import mlflow
df = mlflow.search_runs()
test("exactly one run was recorded", lambda: len(df) == 1)
test("it is named baseline", lambda: df["tags.mlflow.runName"].tolist() == ["baseline"])
test("the chosen model is a param", lambda: "params.model" in df.columns and df["params.model"].tolist() == ["tiny"], 'mlflow.log_param("model", "tiny") inside the with block')
test("the measured accuracy is a metric", lambda: "metrics.accuracy" in df.columns and df["metrics.accuracy"].tolist() == [0.72], 'mlflow.log_metric("accuracy", 0.72)')
test("the run is closed after the with block", lambda: mlflow.active_run() is None)
@@hint
Both calls go inside the `with` block (replace the `pass`): one `mlflow.log_param(...)`, one `mlflow.log_metric(...)`.
@@hint
`mlflow.log_param("model", "tiny")` and `mlflow.log_metric("accuracy", 0.72)`. Param = chosen input, metric = measured output.
@@q
Param or metric: where does a measured accuracy of 0.72 go?
@@a
It's a metric: something you measured. The settings you chose are params.
@@q
What does the `with mlflow.start_run():` block define?
@@a
The boundaries of one attempt: everything logged inside belongs to that run, and the run closes when the block exits.
@@real
Real MLflow is `pip install mlflow`, then `mlflow ui` shows every run in a browser table. On Databricks every notebook already has this wired up. The next lesson logs several runs in a loop and compares them, which is where the notebook starts paying off.
