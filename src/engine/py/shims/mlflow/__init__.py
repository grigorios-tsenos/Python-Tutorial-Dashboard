"""Orbit mini-implementation of MLflow tracking + model registry (in-memory)."""
import itertools
import operator
import re
import time

import orbit

__version__ = "3.x-orbit"

_state = {"exp": "Default", "exps": {"Default": "0"}, "runs": [], "active": [], "models": {}, "uris": {}, "seq": itertools.count(1)}


def _finish():
    runs = []
    for r in _state["runs"]:
        last = {k: v[-1][1] for k, v in r.metrics.items()}
        runs.append({"id": r.info.run_id, "name": r.info.run_name, "status": r.info.status, "experiment": r.info.experiment_name,
                     "params": dict(r.params), "metrics": last, "history": {k: list(v) for k, v in r.metrics.items()},
                     "tags": {k: v for k, v in r.tags.items() if not k.startswith("mlflow.")}})
    reg = {n: [{"version": mv.version, "run_id": mv.run_id, "aliases": sorted(mv.aliases)} for mv in vs] for n, vs in _state["models"].items()}
    if runs or reg:
        orbit.emit("mlflow_runs", {"runs": runs, "registry": reg})


class RunInfo:
    def __init__(self, run_id, run_name, experiment_id, experiment_name):
        self.run_id, self.run_name, self.experiment_id, self.experiment_name = run_id, run_name, experiment_id, experiment_name
        self.status = "RUNNING"
        self.start_time = int(time.time() * 1000)
        self.end_time = None
        self.lifecycle_stage = "active"

    @property
    def run_uuid(self):
        return self.run_id


class RunData:
    def __init__(self, run):
        self._r = run

    @property
    def params(self):
        return dict(self._r.params)

    @property
    def metrics(self):
        return {k: v[-1][1] for k, v in self._r.metrics.items()}

    @property
    def tags(self):
        return dict(self._r.tags)


class Run:
    def __init__(self, info):
        self.info = info
        self.params, self.metrics, self.tags, self.artifacts = {}, {}, {}, {}
        self.models = {}
        self.data = RunData(self)

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        end_run("FAILED" if exc_type else "FINISHED")
        return False

    def __repr__(self):
        return f"<Run id={self.info.run_id!r} name={self.info.run_name!r} status={self.info.status}>"


ActiveRun = Run


def set_experiment(experiment_name=None, experiment_id=None):
    name = experiment_name or "Default"
    _state["exps"].setdefault(name, str(len(_state["exps"])))
    _state["exp"] = name
    return get_experiment_by_name(name)


class Experiment:
    def __init__(self, name, eid):
        self.name, self.experiment_id = name, eid

    def __repr__(self):
        return f"<Experiment: experiment_id={self.experiment_id!r}, name={self.name!r}>"


def get_experiment_by_name(name):
    return Experiment(name, _state["exps"][name]) if name in _state["exps"] else None


def start_run(run_id=None, experiment_id=None, run_name=None, nested=False, tags=None, **kwargs):
    if _state["active"] and not nested:
        raise Exception(f"Run with UUID {_state['active'][-1].info.run_id} is already active. To start a new run, first end the current run with mlflow.end_run(). To start a nested run, call start_run with nested=True")
    n = next(_state["seq"])
    rid = f"{n:032x}"
    name = run_name or f"run-{n}"
    exp = _state["exp"]
    run = Run(RunInfo(rid, name, _state["exps"][exp], exp))
    run.tags["mlflow.runName"] = name
    run.tags.update(tags or {})
    _state["runs"].append(run)
    _state["active"].append(run)
    orbit.on_finish(_finish)
    return run


def end_run(status="FINISHED"):
    if _state["active"]:
        r = _state["active"].pop()
        r.info.status = status
        r.info.end_time = int(time.time() * 1000)


def active_run():
    return _state["active"][-1] if _state["active"] else None


def _cur():
    return _state["active"][-1] if _state["active"] else start_run()


def log_param(key, value, synchronous=True):
    r = _cur()
    v = str(value)
    if key in r.params and r.params[key] != v:
        raise Exception(f"Changing param values is not allowed. Param with key='{key}' was already logged with value='{r.params[key]}' for run ID='{r.info.run_id}'. Attempted logging new value '{v}'.")
    r.params[key] = v
    return value


def log_params(params, synchronous=True):
    for k, v in params.items():
        log_param(k, v)


def log_metric(key, value, step=None, synchronous=True, timestamp=None):
    r = _cur()
    r.metrics.setdefault(key, []).append((step if step is not None else 0, float(value)))
    return value


def log_metrics(metrics, step=None, synchronous=True):
    for k, v in metrics.items():
        log_metric(k, v, step)


def set_tag(key, value):
    _cur().tags[key] = str(value)


def set_tags(tags):
    for k, v in tags.items():
        set_tag(k, v)


def log_text(text, artifact_file):
    _cur().artifacts[artifact_file] = text


def log_dict(dictionary, artifact_file):
    _cur().artifacts[artifact_file] = dictionary


def get_run(run_id):
    for r in _state["runs"]:
        if r.info.run_id == run_id:
            return r
    raise Exception(f"Run '{run_id}' not found")


_OPS = {"=": operator.eq, "!=": operator.ne, ">": operator.gt, ">=": operator.ge, "<": operator.lt, "<=": operator.le}


def _lookup(run, key):
    kind, _, name = key.partition(".")
    if kind == "metrics":
        return run.metrics[name][-1][1] if name in run.metrics else None
    if kind == "params":
        return run.params.get(name)
    if kind == "tags":
        return run.tags.get(name)
    if key in ("status", "attributes.status"):
        return run.info.status
    return None


def _matches(run, filter_string):
    for clause in re.split(r"\s+and\s+", filter_string.strip(), flags=re.I):
        m = re.match(r"^\s*([\w.]+)\s*(>=|<=|!=|=|>|<)\s*(.+?)\s*$", clause)
        if not m:
            raise Exception(f"Invalid filter string: {filter_string!r}")
        key, op, raw = m.groups()
        quoted = raw[0] in "'\""
        rhs = raw.strip("'\"")
        lhs = _lookup(run, key)
        if lhs is None:
            return False
        if key.startswith("metrics."):
            if quoted:
                raise Exception("Metric values must be numbers, not strings")
            rhs = float(rhs)
        elif not quoted and key.startswith("params."):
            raise Exception(f"Invalid clause: params values must be quoted, e.g. {key} = '{rhs}'")
        if not _OPS[op](lhs, rhs):
            return False
    return True


def search_runs(experiment_ids=None, filter_string="", run_view_type=1, max_results=100000, order_by=None, output_format="pandas", search_all_experiments=False, experiment_names=None):
    import pandas as pd

    runs = [r for r in _state["runs"]]
    if experiment_names:
        runs = [r for r in runs if r.info.experiment_name in experiment_names]
    elif experiment_ids:
        runs = [r for r in runs if r.info.experiment_id in [str(e) for e in experiment_ids]]
    elif not search_all_experiments:
        runs = [r for r in runs if r.info.experiment_name == _state["exp"]]
    if filter_string:
        runs = [r for r in runs if _matches(r, filter_string)]
    runs = list(reversed(runs))  # newest first, like MLflow's default start_time DESC
    for spec in reversed(order_by or []):
        m = re.match(r"^\s*([\w.]+)(?:\s+(ASC|DESC))?\s*$", spec, re.I)
        key, direction = m.group(1), (m.group(2) or "ASC").upper()
        have = [r for r in runs if _lookup(r, key) is not None]
        miss = [r for r in runs if _lookup(r, key) is None]
        runs = sorted(have, key=lambda r: _lookup(r, key), reverse=(direction == "DESC")) + miss
    runs = runs[:max_results]
    cols = {"run_id": [], "experiment_id": [], "status": [], "start_time": [], "end_time": []}
    metric_keys = sorted({k for r in runs for k in r.metrics})
    param_keys = sorted({k for r in runs for k in r.params})
    tag_keys = sorted({k for r in runs for k in r.tags})
    for r in runs:
        cols["run_id"].append(r.info.run_id)
        cols["experiment_id"].append(r.info.experiment_id)
        cols["status"].append(r.info.status)
        cols["start_time"].append(r.info.start_time)
        cols["end_time"].append(r.info.end_time)
    for k in metric_keys:
        cols[f"metrics.{k}"] = [(_lookup(r, f"metrics.{k}")) for r in runs]
    for k in param_keys:
        cols[f"params.{k}"] = [r.params.get(k) for r in runs]
    for k in tag_keys:
        cols[f"tags.{k}"] = [r.tags.get(k) for r in runs]
    if output_format == "list":
        return runs
    return pd.DataFrame(cols)


from . import pyfunc  # noqa: E402,F401
from .tracking import MlflowClient  # noqa: E402,F401


def register_model(model_uri, name, **kwargs):
    from .pyfunc import _resolve

    run_id = _resolve(model_uri, only_run=True)
    versions = _state["models"].setdefault(name, [])
    mv = ModelVersion(name, str(len(versions) + 1), run_id, model_uri)
    versions.append(mv)
    orbit.on_finish(_finish)
    return mv


class ModelVersion:
    def __init__(self, name, version, run_id, source):
        self.name, self.version, self.run_id, self.source = name, version, run_id, source
        self.aliases = set()
        self.tags = {}

    def __repr__(self):
        return f"<ModelVersion: name={self.name!r}, version={self.version!r}, aliases={sorted(self.aliases)}>"
