---
id: ml-registry
track: mlflow
order: 3
title: "Puzzle: From Run to Champion"
tagline: Log a model, register it, crown it with an alias.
kind: parsons
xp: 35
minutes: 5
---
@@body
# The model lifecycle in five moves

A good run isn't a deployable model yet. The **Model Registry** gives models names, versions and *aliases*:

1. **Log** the model artifact inside a run
2. **Register** it under a name → creates **version 1**, 2, 3…
3. **Alias** a version (`champion`) so serving code never hard-codes a version number
4. **Load** it by alias: `models:/name@champion`

Re-point the `champion` alias to version 4 tomorrow, and every consumer switches over with no code change.

Arrange the lines so the script runs top to bottom and prints the model's answer. (Mind the indentation: it's part of the puzzle.)
@@lines
import mlflow
class Echo(mlflow.pyfunc.PythonModel):
    def predict(self, context, model_input, params=None):
        return model_input
with mlflow.start_run():
    info = mlflow.pyfunc.log_model(name="echo", python_model=Echo())
mv = mlflow.register_model(info.model_uri, "echo-bot")
mlflow.MlflowClient().set_registered_model_alias("echo-bot", "champion", mv.version)
model = mlflow.pyfunc.load_model("models:/echo-bot@champion")
print(model.predict("hi"))
@@check
test("the champion model answers", lambda: model.predict("hi") == "hi")
test("registered as version 1", lambda: mv.version == "1")
test("alias points at version 1", lambda: mlflow.MlflowClient().get_model_version_by_alias("echo-bot", "champion").version == "1")
@@hint
You can't register a model that hasn't been logged: `info` must exist before `register_model(info.model_uri, ...)`.
@@hint
log (inside the `with`) → register → set alias (needs `mv.version`) → load by alias → predict. The class definition and its method body come right after the import.
@@q
Why load models by alias instead of by version number?
@@a
You can promote a new version by moving the alias; consuming code never changes.
@@q
What does `register_model` return?
@@a
A ModelVersion with the model's name and an incrementing version string.
@@real
Real MLflow 3 and Unity Catalog on Databricks use the same register/alias flow; model names there are three-level (`catalog.schema.model`).
