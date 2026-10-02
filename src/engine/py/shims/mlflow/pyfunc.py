import mlflow


class PythonModel:
    def predict(self, context, model_input, params=None):
        raise NotImplementedError


class ModelInfo:
    def __init__(self, uri, run_id, name):
        self.model_uri, self.run_id, self.name = uri, run_id, name

    def __repr__(self):
        return f"ModelInfo(model_uri={self.model_uri!r})"


class PyFuncModel:
    def __init__(self, model, uri):
        self._m, self.model_uri = model, uri

    def predict(self, data, params=None):
        return self._m.predict(None, data)


def log_model(name=None, python_model=None, artifact_path=None, **kwargs):
    if name is None and artifact_path is None:
        raise TypeError("log_model() requires a model name, e.g. mlflow.pyfunc.log_model(name='model', python_model=...)")
    name = name or artifact_path
    run = mlflow._cur()
    run.models[name] = python_model
    return ModelInfo(f"runs:/{run.info.run_id}/{name}", run.info.run_id, name)


def _resolve(uri, only_run=False):
    """Return the stored model object (or the run id) for runs:/ and models:/ URIs."""
    if uri.startswith("runs:/"):
        run_id, _, name = uri[len("runs:/"):].partition("/")
        if only_run:
            mlflow.get_run(run_id)
            return run_id
        run = mlflow.get_run(run_id)
        if name not in run.models:
            raise Exception(f"No model named {name!r} was logged in run {run_id}")
        return run.models[name]
    if uri.startswith("models:/"):
        body = uri[len("models:/"):]
        if "@" in body:
            name, alias = body.split("@", 1)
            mv = next((v for v in mlflow._state["models"].get(name, []) if alias in v.aliases), None)
            if mv is None:
                raise Exception(f"Registered model alias {alias} not found.")
        else:
            name, _, ver = body.partition("/")
            vs = mlflow._state["models"].get(name)
            if not vs:
                raise Exception(f"Registered Model with name={name} not found")
            mv = vs[-1] if ver in ("", "latest") else next((v for v in vs if v.version == ver), None)
            if mv is None:
                raise Exception(f"Model Version (name={name}, version={ver}) not found")
        return _resolve(mv.source) if not only_run else mv.run_id
    raise Exception(f"Unsupported model URI: {uri}")


def load_model(model_uri):
    return PyFuncModel(_resolve(model_uri), model_uri)
