---
id: ml-track
track: mlflow
order: 1
title: Every Experiment Leaves a Trail
tagline: Params go in, metrics come out, and a table remembers it all.
kind: lab
xp: 35
minutes: 6
---
@@body
# "Which settings gave us that great result again?"

If you've ever lost a good result because you tweaked a setting and forgot the old one, **MLflow Tracking** is the cure. Wrap each attempt in a *run* and record:

| call | records | example |
|---|---|---|
| `mlflow.log_param(k, v)` | an **input** setting | `temperature = 0.5` |
| `mlflow.log_metric(k, v)` | an **output** score | `quality = 0.8` |

```python
mlflow.set_experiment("my-experiment")     # a folder for related runs
with mlflow.start_run(run_name="attempt-1"):
    mlflow.log_param("lr", 0.1)
    mlflow.log_metric("accuracy", 0.92)
```

The **MLflow Lab** on the right is a live run table, the same view you'd get in the MLflow UI or Databricks.

> **Mission:** inside the loop, log `temperature` as a **param** and a `quality` **metric** that gets worse as temperature rises (try `0.95 - 0.3 * temperature`).
@@starter
import mlflow

mlflow.set_experiment("prompt-tuning")

for temperature in [0.0, 0.5, 1.0]:
    with mlflow.start_run(run_name=f"temp-{temperature}"):
        # TODO: log the temperature as a *parameter*
        # TODO: log a fake quality score as a *metric* (higher temperature -> lower quality)
        pass
@@solution
import mlflow

mlflow.set_experiment("prompt-tuning")

for temperature in [0.0, 0.5, 1.0]:
    with mlflow.start_run(run_name=f"temp-{temperature}"):
        mlflow.log_param("temperature", temperature)
        mlflow.log_metric("quality", 0.95 - 0.3 * temperature)
@@check
import mlflow
df = mlflow.search_runs()
test("three runs were logged", lambda: len(df) == 3)
test("temperature is a param", lambda: "params.temperature" in df.columns, "use mlflow.log_param('temperature', ...)")
test("quality is a metric", lambda: "metrics.quality" in df.columns, "use mlflow.log_metric('quality', ...)")
test("hotter runs score lower", lambda: df.sort_values("params.temperature")["metrics.quality"].is_monotonic_decreasing)
@@hint
Inside the `with` block, call `mlflow.log_param("temperature", temperature)` and `mlflow.log_metric("quality", some_number)`.
@@hint
`mlflow.log_metric("quality", 0.95 - 0.3 * temperature)`
@@q
Param vs metric: what's the difference in MLflow?
@@a
A param is an input setting (fixed per run); a metric is a measured output, which can be logged many times (with steps).
@@q
What groups related runs together?
@@a
An experiment: `mlflow.set_experiment("name")`.
@@real
Real MLflow is `pip install mlflow`, then `mlflow ui` for the browser dashboard. On Databricks, tracking is built in and every notebook run is auto-logged to an experiment. Real MLflow stores params as strings, just like this shim.
