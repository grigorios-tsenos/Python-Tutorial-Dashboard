---
id: ml-dataset-digest
track: mlflow
order: 7
title: Only Compare Scores from the Same Eval Set
tagline: Someone fixed three labels in the test set. Every old score just became incomparable.
kind: build
xp: 60
minutes: 8
---
@@body
# A metric means nothing without its data

Run A scored 0.82, run B 0.85. B is better only if both were scored on the **same** examples, and eval sets change constantly. Record a **digest** of the eval data on every run and only rank runs that share it:

```python
canonical = json.dumps(row, sort_keys=True, separators=(",", ":"))   # same dict -> same text
hashlib.sha256(text.encode()).hexdigest()[:12]                       # short, stable fingerprint
```

A good digest changes on **any** data change and ignores what cannot change the score: key order and row order. Duplicate rows count twice in a score, so they must change it.

> **Mission:** rows look like `{"input": ..., "label": ...}`.
>
> 1. `dataset_digest(rows)` → the first 12 hex characters of the SHA-256 of the canonical rows, **sorted**, joined with newlines. Don't mutate `rows`.
> 2. `log_eval(run_name, predict, rows)` → in experiment `"eval"`, start a run named `run_name`, set tag `dataset_digest`, log param `n_examples` and metric `accuracy` (fraction where `predict(row["input"]) == row["label"]`); return the run ID. An empty dataset raises `ValueError` before any run starts.
> 3. `leaderboard(digest)` → `[(run_name, accuracy), ...]` for finished `"eval"` runs tagged with that digest, best first, ties by name. Use `search_runs` with a tag filter; an unknown digest gives `[]`.
@@starter
import hashlib
import json
import mlflow

def dataset_digest(rows):
    """Order-insensitive fingerprint of an eval set (12 hex characters)."""
    # BUG: depends on row order and key order, and Python's hash() changes between processes
    return str(hash(str(rows)))[:12]

def log_eval(run_name, predict, rows):
    """Score predict on rows in experiment "eval"; tag the run with the dataset digest."""
    # TODO
    return None

def leaderboard(digest):
    """[(run_name, accuracy)] for eval runs on this exact dataset, best first."""
    # TODO
    return []

V1 = [{"input": "2+2", "label": "4"}, {"input": "capital of France", "label": "Paris"}, {"input": "3*3", "label": "9"}]
V2 = V1 + [{"input": "opposite of hot", "label": "cold"}]
answers = {"2+2": "4", "capital of France": "Paris", "3*3": "9"}
log_eval("lookup-v1", lambda q: answers.get(q, "?"), V1)
log_eval("lookup-v2", lambda q: answers.get(q, "?"), V2)
print(dataset_digest(V1), leaderboard(dataset_digest(V1)))
print(dataset_digest(V2), leaderboard(dataset_digest(V2)))
@@solution
import hashlib
import json
import mlflow

def dataset_digest(rows):
    """Order-insensitive fingerprint of an eval set (12 hex characters)."""
    canonical = sorted(json.dumps(row, sort_keys=True, separators=(",", ":")) for row in rows)
    return hashlib.sha256("\n".join(canonical).encode()).hexdigest()[:12]

def log_eval(run_name, predict, rows):
    """Score predict on rows in experiment "eval"; tag the run with the dataset digest."""
    if not rows:
        raise ValueError("cannot evaluate on an empty dataset")
    mlflow.set_experiment("eval")
    with mlflow.start_run(run_name=run_name) as run:
        mlflow.set_tag("dataset_digest", dataset_digest(rows))
        mlflow.log_param("n_examples", len(rows))
        mlflow.log_metric("accuracy", sum(predict(r["input"]) == r["label"] for r in rows) / len(rows))
    return run.info.run_id

def leaderboard(digest):
    """[(run_name, accuracy)] for eval runs on this exact dataset, best first."""
    runs = mlflow.search_runs(
        experiment_names=["eval"],
        filter_string=f"tags.dataset_digest = '{digest}' and attributes.status = 'FINISHED'",
    )
    board = [(r["tags.mlflow.runName"], r["metrics.accuracy"]) for _, r in runs.iterrows()]
    return sorted(board, key=lambda item: (-item[1], item[0]))

V1 = [{"input": "2+2", "label": "4"}, {"input": "capital of France", "label": "Paris"}, {"input": "3*3", "label": "9"}]
V2 = V1 + [{"input": "opposite of hot", "label": "cold"}]
answers = {"2+2": "4", "capital of France": "Paris", "3*3": "9"}
log_eval("lookup-v1", lambda q: answers.get(q, "?"), V1)
log_eval("lookup-v2", lambda q: answers.get(q, "?"), V2)
print(dataset_digest(V1), leaderboard(dataset_digest(V1)))
print(dataset_digest(V2), leaderboard(dataset_digest(V2)))
@@check
import mlflow
A = [{"input": "a", "label": "x"}, {"input": "b", "label": "y"}, {"input": "c", "label": "z"}, {"input": "d", "label": "x"}]
A_copy = [dict(r) for r in A]
d = dataset_digest(A)
test("the digest is 12 hex characters", lambda: isinstance(d, str) and len(d) == 12 and all(ch in "0123456789abcdef" for ch in d))
test("the digest is a SHA-256 of the canonical rows", lambda: d == "2cc747407345")
test("row order and key order do not change the digest", lambda: dataset_digest(list(reversed(A))) == d and dataset_digest([{"label": r["label"], "input": r["input"]} for r in A]) == d)
test("a corrected label or a duplicated row changes it", lambda: dataset_digest(A[:3] + [{"input": "d", "label": "y"}]) != d and dataset_digest(A + A[:1]) != d)
test("computing a digest leaves the rows unchanged", lambda: A == A_copy)
always_x = lambda q: "x"
lookup = {"a": "x", "b": "y", "c": "z"}.get
rid = log_eval("always-x", always_x, A)
run = mlflow.get_run(rid)
test("the run records digest, size and accuracy", lambda: run.info.run_name == "always-x" and run.info.experiment_name == "eval" and run.data.tags.get("dataset_digest") == d and run.data.params.get("n_examples") == "4" and run.data.metrics.get("accuracy") == 0.5)
test("the run is finished when log_eval returns", lambda: run.info.status == "FINISHED" and mlflow.active_run() is None)
log_eval("lookup", lookup, A)
log_eval("lookup-twin", lookup, list(reversed(A)))
log_eval("lookup-on-new-data", lookup, A + [{"input": "e", "label": "q"}])
test("the leaderboard ranks only runs on the same data", lambda: leaderboard(d) == [("lookup", 0.75), ("lookup-twin", 0.75), ("always-x", 0.5)])
test("a different dataset has its own leaderboard", lambda: leaderboard(dataset_digest(A + [{"input": "e", "label": "q"}])) == [("lookup-on-new-data", 0.6)])
test("an unknown digest gives an empty leaderboard", lambda: leaderboard("000000000000") == [])
before = len(mlflow.search_runs(search_all_experiments=True))
try:
    log_eval("empty", always_x, [])
    rejected = False
except ValueError:
    rejected = True
test("an empty dataset is rejected before a run starts", lambda: rejected and len(mlflow.search_runs(search_all_experiments=True)) == before and mlflow.active_run() is None)
@@hint
`dataset_digest`: serialize each row with `json.dumps(row, sort_keys=True, separators=(",", ":"))`, `sorted(...)` the strings, join them with `"\n"`, then `hashlib.sha256(text.encode()).hexdigest()[:12]`.
@@hint
`log_eval`: check for empty rows first, `mlflow.set_experiment("eval")`, then inside `with mlflow.start_run(run_name=run_name) as run:` call `set_tag`, `log_param` and `log_metric`. `leaderboard`: `search_runs(experiment_names=["eval"], filter_string=f"tags.dataset_digest = '{digest}' and attributes.status = 'FINISHED'")`, build `(r["tags.mlflow.runName"], r["metrics.accuracy"])` pairs, and sort with `key=lambda t: (-t[1], t[0])`.
@@q
Why fingerprint the evaluation dataset on every run?
@@a
Scores are only comparable when computed on identical data; the digest makes that checkable.
@@q
Why not use Python's built-in `hash()` for a dataset fingerprint?
@@a
String hashing is randomized per process, so the value changes between runs and machines. Use a cryptographic hash such as SHA-256.
@@real
MLflow's dataset tracking (`mlflow.data.from_pandas(...)` with `mlflow.log_input(dataset, context="eval")`) computes a digest automatically and shows it in the UI, and `mlflow.genai.evaluate()` links every evaluation run to its dataset. On Databricks, a Delta table version pins the exact eval data too.
