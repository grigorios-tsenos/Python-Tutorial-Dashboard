# /// script
# requires-python = ">=3.14"
# dependencies = ["langchain-core", "langgraph", "mlflow-skinny", "pyspark", "delta-spark", "numpy", "pandas"]
# ///
"""Snapshot the real signatures and parameter docs of everything Orbit's shims stand in for.

    uv run scripts/official_docs.py

Writes src/engine/py/official_docs.json, which the editor's hover tooltip reads (orbit_hover.py).
A shim name with no counterpart in the real package is left out; its tooltip then describes the shim itself.
"""
import ast
import json
import pkgutil
import sys
from pathlib import Path

sys.dont_write_bytecode = True
PY = Path(__file__).parent.parent / "src/engine/py"
sys.path.insert(0, str(PY))
from orbit_hover import describe  # noqa: E402

# shim names that live somewhere else in the real package
REAL = {
    "pyspark.sql._Builder": "pyspark.sql.SparkSession.Builder",
    "pyspark.sql.column.AggColumn": "pyspark.sql.column.Column",
    "pyspark.sql.column.SortColumn": "pyspark.sql.column.Column",
    "pyspark.sql.column.WhenColumn": "pyspark.sql.column.Column",
    "langgraph.graph.CompiledStateGraph": "langgraph.graph.state.CompiledStateGraph",
    "langchain_core.prompts.ChatPromptValue": "langchain_core.prompt_values.ChatPromptValue",
    "langchain_core.prompts.StringPromptValue": "langchain_core.prompt_values.StringPromptValue",
}


def bound(body):
    """Names a module or class body defines: functions, classes (with their members) and aliases like `where = filter`."""
    for node in body:
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            yield node.name
        elif isinstance(node, ast.ClassDef):
            yield node.name
            yield from (f"{node.name}.{member}" for member in bound(node.body))
        elif isinstance(node, ast.Assign):
            yield from (t.id for t in node.targets if isinstance(t, ast.Name))


docs, missing = {}, []
for path in sorted((PY / "shims").rglob("*.py")):
    module = ".".join(path.relative_to(PY / "shims").with_suffix("").parts).removesuffix(".__init__")
    for name in bound(ast.parse(path.read_text()).body):
        shim = f"{module}.{name}"
        real = next((r + shim[len(s) :] for s, r in REAL.items() if shim == s or shim.startswith(s + ".")), shim)
        if any(part.startswith("_") for part in real.split(".")):
            continue
        try:
            obj = pkgutil.resolve_name(real)
        except (ImportError, AttributeError):
            missing.append(shim)
            continue
        if callable(obj):
            docs[shim] = describe(obj, real)

(PY / "official_docs.json").write_text(json.dumps(docs, indent=1, sort_keys=True) + "\n")
print(f"{len(docs)} documented from the real packages: {sorted({d['src'] for d in docs.values()})}")
print(f"{len(missing)} shim-only names: {' '.join(missing)}")
