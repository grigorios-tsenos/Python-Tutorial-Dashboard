---
id: ml-promotion
track: mlflow
order: 5
title: Move the Alias Only When It Wins
tagline: A new version is a candidate, not an automatic champion.
kind: build
xp: 60
minutes: 8
---
@@body
# Registry versions need a promotion rule

Registering a new model should not automatically replace the one serving users. Compare measured quality first, then move the `champion` alias only when the candidate wins.

A model version exposes its `run_id`. Read that run's score with `mlflow.get_run(version.run_id).data.metrics["quality"]`. The supplied helper registers offline models with a quality metric, so you can test the rule.

> **Mission:** implement `promote_if_better(name, candidate_version)`. Look up the named model's candidate version and existing `champion` alias with `MlflowClient`. Promote the candidate only if its quality is **strictly greater** than the champion's; return `True` when promoted, otherwise `False`. Ties keep the existing champion. Use stored scores, not version order, and leave other models' aliases untouched. Let an invalid model/version error propagate.

Inputs always name a model with an existing champion, and both versions have a quality metric.
@@starter
import mlflow

class Echo(mlflow.pyfunc.PythonModel):
    def predict(self, context, model_input, params=None):
        return model_input

def register_candidate(name, quality):
    with mlflow.start_run() as run:
        mlflow.log_metric("quality", quality)
        info = mlflow.pyfunc.log_model(name="model", python_model=Echo())
    return mlflow.register_model(info.model_uri, name)

def promote_if_better(name, candidate_version):
    # TODO: compare stored quality scores before moving the alias
    return False

champion = register_candidate("demo-model", 0.8)
mlflow.MlflowClient().set_registered_model_alias("demo-model", "champion", champion.version)
candidate = register_candidate("demo-model", 0.9)
print(promote_if_better("demo-model", candidate.version))
@@solution
import mlflow

class Echo(mlflow.pyfunc.PythonModel):
    def predict(self, context, model_input, params=None):
        return model_input

def register_candidate(name, quality):
    with mlflow.start_run() as run:
        mlflow.log_metric("quality", quality)
        info = mlflow.pyfunc.log_model(name="model", python_model=Echo())
    return mlflow.register_model(info.model_uri, name)

def promote_if_better(name, candidate_version):
    client = mlflow.MlflowClient()
    candidate = client.get_model_version(name, candidate_version)
    champion = client.get_model_version_by_alias(name, "champion")
    candidate_score = mlflow.get_run(candidate.run_id).data.metrics["quality"]
    champion_score = mlflow.get_run(champion.run_id).data.metrics["quality"]
    if candidate_score <= champion_score:
        return False
    client.set_registered_model_alias(name, "champion", candidate.version)
    return True

champion = register_candidate("demo-model", 0.8)
mlflow.MlflowClient().set_registered_model_alias("demo-model", "champion", champion.version)
candidate = register_candidate("demo-model", 0.9)
print(promote_if_better("demo-model", candidate.version))
@@check
client = mlflow.MlflowClient()
base = register_candidate("scorer", 0.75)
client.set_registered_model_alias("scorer", "champion", base.version)
lower = register_candidate("scorer", 0.6)
test("a newer but worse model does not become champion", lambda: promote_if_better("scorer", lower.version) is False and client.get_model_version_by_alias("scorer", "champion").version == base.version)
tied = register_candidate("scorer", 0.75)
test("equal scores keep the existing champion", lambda: promote_if_better("scorer", tied.version) is False and client.get_model_version_by_alias("scorer", "champion").version == base.version)
better = register_candidate("scorer", 0.95)
test("higher quality moves the alias to the candidate", lambda: promote_if_better("scorer", better.version) is True and client.get_model_version_by_alias("scorer", "champion").version == better.version)
test("promoting the same version twice does not report a new promotion", lambda: promote_if_better("scorer", better.version) is False)
other_base = register_candidate("other-scorer", 0.1)
client.set_registered_model_alias("other-scorer", "champion", other_base.version)
other_better = register_candidate("other-scorer", 0.3)
test("model names are respected and other champions stay untouched", lambda: promote_if_better("other-scorer", other_better.version) is True and client.get_model_version_by_alias("other-scorer", "champion").version == other_better.version and client.get_model_version_by_alias("scorer", "champion").version == better.version)
try:
    promote_if_better("scorer", "999")
    rejected = False
except Exception:
    rejected = True
test("missing candidate versions propagate an error", lambda: rejected and client.get_model_version_by_alias("scorer", "champion").version == better.version)
@@hint
Use `client.get_model_version(name, candidate_version)` and `client.get_model_version_by_alias(name, "champion")`. Each returned version points to the tracking run that contains its quality score.
@@hint
Compare the two runs' `data.metrics["quality"]`. Only a strictly higher candidate score calls `set_registered_model_alias(name, "champion", candidate.version)` and returns `True`.
@@q
Why compare scores instead of registry version numbers?
@@a
A higher version number only means a model was registered later; it says nothing about quality.
@@real
Real promotion workflows also check compatibility and deployment constraints. The registry alias gives consumers a stable name while this score rule decides which version owns it.
