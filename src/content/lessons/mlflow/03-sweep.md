---
id: ml-sweep
track: mlflow
order: 3
title: Sweep, Search, Pick the Winner
tagline: Let the run table do the comparing.
kind: build
xp: 45
minutes: 8
---
@@body
# A hyperparameter sweep in 10 lines

Grid search is easy; comparing nine runs is the work. `mlflow.search_runs` returns a sortable pandas DataFrame:

```python
df = mlflow.search_runs(order_by=["metrics.accuracy DESC"])
best = df.iloc[0]
best["params.lr"]            # note: params come back as STRINGS ('0.1')
```

`evaluate(lr, depth)` fakes training: accuracy peaks at `lr=0.1`, `depth=4`.

> **Mission:** finish `sweep(lrs, depths)`: one run per combination, logging `lr` and `depth` as params and `accuracy` as a metric. Return the best run's params as a dict of **strings**, e.g. `{"lr": "0.1", "depth": "4"}`.
@@starter
import mlflow

def evaluate(lr, depth):
    """Pretend training. Peak accuracy at lr=0.1, depth=4."""
    return 1 - abs(lr - 0.1) * 2 - abs(depth - 4) * 0.03

def sweep(lrs, depths):
    """Log one run per (lr, depth); return the params of the best run (as strings)."""
    # TODO
    return {}

print(sweep([0.01, 0.1, 0.5], [2, 4, 8]))
@@solution
import mlflow

def evaluate(lr, depth):
    """Pretend training. Peak accuracy at lr=0.1, depth=4."""
    return 1 - abs(lr - 0.1) * 2 - abs(depth - 4) * 0.03

def sweep(lrs, depths):
    """Log one run per (lr, depth); return the params of the best run (as strings)."""
    mlflow.set_experiment("sweep")
    for lr in lrs:
        for depth in depths:
            with mlflow.start_run():
                mlflow.log_params({"lr": lr, "depth": depth})
                mlflow.log_metric("accuracy", evaluate(lr, depth))
    best = mlflow.search_runs(order_by=["metrics.accuracy DESC"]).iloc[0]
    return {"lr": best["params.lr"], "depth": best["params.depth"]}

print(sweep([0.01, 0.1, 0.5], [2, 4, 8]))
@@check
import mlflow
before = len(mlflow.search_runs(search_all_experiments=True))
best = sweep([0.01, 0.1, 0.5], [2, 4, 8])
after = len(mlflow.search_runs(search_all_experiments=True))
test("finds the best settings", lambda: best == {"lr": "0.1", "depth": "4"}, "got " + str(best))
test("logs one run per combination (9)", lambda: after - before == 9, "logged " + str(after - before) + " runs")
@@hint
Nested loops with `with mlflow.start_run():` inside. `mlflow.log_params({...})` logs several params at once.
@@hint
`best = mlflow.search_runs(order_by=["metrics.accuracy DESC"]).iloc[0]`, then read `best["params.lr"]` and `best["params.depth"]`.
@@q
How do you sort `search_runs` results by a metric, best first?
@@a
`order_by=["metrics.accuracy DESC"]`
@@q
What type does MLflow use to store param values?
@@a
Strings: `0.1` comes back as `'0.1'`.
