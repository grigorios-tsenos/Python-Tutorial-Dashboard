import mlflow


class MlflowClient:
    def __init__(self, tracking_uri=None, registry_uri=None):
        pass

    def get_run(self, run_id):
        return mlflow.get_run(run_id)

    def search_runs(self, experiment_ids=None, filter_string="", **kwargs):
        return mlflow.search_runs(experiment_ids=experiment_ids, filter_string=filter_string, output_format="list", **kwargs)

    def _versions(self, name):
        vs = mlflow._state["models"].get(name)
        if vs is None:
            raise Exception(f"RESOURCE_DOES_NOT_EXIST: Registered Model with name={name} not found")
        return vs

    def get_model_version(self, name, version):
        mv = next((v for v in self._versions(name) if v.version == str(version)), None)
        if mv is None:
            raise Exception(f"RESOURCE_DOES_NOT_EXIST: Model Version (name={name}, version={version}) not found")
        return mv

    def search_model_versions(self, filter_string=""):
        m = re.match(r"name\s*=\s*['\"](.+)['\"]", filter_string or "")
        names = [m.group(1)] if m else list(mlflow._state["models"])
        return [v for n in names for v in mlflow._state["models"].get(n, [])]

    def set_registered_model_alias(self, name, alias, version):
        mv = self.get_model_version(name, version)
        for v in self._versions(name):
            v.aliases.discard(alias)
        mv.aliases.add(alias)

    def get_model_version_by_alias(self, name, alias):
        mv = next((v for v in self._versions(name) if alias in v.aliases), None)
        if mv is None:
            raise Exception(f"RESOURCE_DOES_NOT_EXIST: Registered model alias {alias} not found.")
        return mv

    def delete_registered_model_alias(self, name, alias):
        for v in self._versions(name):
            v.aliases.discard(alias)

    def set_model_version_tag(self, name, version, key, value):
        self.get_model_version(name, version).tags[key] = str(value)


import re  # noqa: E402
