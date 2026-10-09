import { describe, it, expect } from 'vitest'
import { hover, run } from './pyodide-node'

const CODE = `import json
import numpy as np
import pandas as pd
import mlflow
from pyspark.sql import SparkSession
import pyspark.sql.functions as F

def scale(x, factor=2.0):
    """Multiply x."""
    return x * factor

arr = np.linspace(0, 1, 6)
ids = np.array([1, 2])
grid = arr.reshape(2, 3)
df = pd.DataFrame({"team": ["a", "b"], "score": [1, 2]})
best = df.groupby("team")["score"].mean()
print(len(arr), scale(3), json.dumps({"a": 1}))
with mlflow.start_run():
    mlflow.log_metric("quality", 0.9)
spark = SparkSession.builder.appName("orbit").getOrCreate()
trips = spark.createDataFrame([("NYC", 12.5)], ["city", "fare"])
trips.filter(F.col("fare") > 10).withColumn("double", F.col("fare") * 2).show()
`

describe('hover docs', () => {
  it('asks the last run what a variable holds, while its assignment is unchanged', async () => {
    expect(await hover(CODE, 'reshape(')).toBeNull() // NumPy arrays can't be inferred statically
    expect((await run(CODE)).ok).toBe(true)
    const doc = await hover(CODE, 'reshape(')
    expect(doc?.sig).toMatch(/^ndarray\.reshape\(\*shape, order='C'/)
    expect(doc?.src).toMatch(/^numpy \d/)
    expect(await hover(CODE.replace('np.linspace(0, 1, 6)', 'load()'), 'reshape(')).toBeNull()
  })

  it('describes NumPy from its own signature and docstring, parameters only', async () => {
    const doc = await hover(CODE, 'linspace(')
    expect(doc?.sig).toMatch(/^numpy\.linspace\(\s*start,\s*stop,\s*num=50,/)
    expect(doc?.doc).toContain('Parameters')
    expect(doc?.doc).toContain('endpoint : bool, optional')
    expect(doc?.doc).not.toMatch(/^Returns$/m)
    expect(doc?.src).toMatch(/^numpy \d+\.\d+/)
    expect((await hover(CODE, 'array(['))?.sig).toMatch(/^numpy\.array\(\s*object,\s*dtype=None/) // a C function: resolved live
  })

  it('follows pandas method chains before anything has run', async () => {
    const groupby = await hover(CODE, 'groupby(')
    expect(groupby?.sig).toMatch(/^DataFrame\.groupby\(\s*by=None,\s*level: IndexLabel \| None = None/)
    expect(groupby?.src).toMatch(/^pandas \d/)
    expect((await hover(CODE, 'mean()'))?.sig).toMatch(/^GroupBy\.mean\(\s*numeric_only: bool = False/)
  })

  it('covers builtins, the standard library and functions defined in the editor', async () => {
    expect(await hover(CODE, 'len(')).toMatchObject({ sig: 'len(obj, /)', src: expect.stringMatching(/^Python 3\.\d+$/) })
    expect((await hover(CODE, 'dumps('))?.sig).toMatch(/^json\.dumps\(\s*obj,\s*\*,\s*skipkeys=False/)
    expect(await hover(CODE, 'scale(3')).toEqual({ sig: 'scale(x, factor=2.0)', doc: 'Multiply x.', src: 'defined in this code' })
  })

  it('documents shimmed libraries from the real packages', async () => {
    const metric = await hover(CODE, 'log_metric(')
    expect(metric?.sig).toMatch(/^mlflow\.log_metric\(\s*key: str,\s*value: float,/)
    expect(metric?.doc).toContain('Args:')
    expect(metric?.src).toMatch(/^mlflow \d+\.\d+.* offline stand-in$/)
    const chained = await hover(CODE, 'withColumn(')
    expect(chained?.sig).toMatch(/^DataFrame\.withColumn\(colName: str, col: Column\)/)
    expect(chained?.src).toMatch(/^pyspark \d/)
    expect((await hover(CODE, 'appName('))?.sig).toMatch(/^Builder\.appName\(name: str\)/)
  })

  it('stays quiet on anything that is not a function or class', async () => {
    for (const needle of ['arr = ', 'np.linspace', 'factor=2.0', 'x * factor', 'json\n']) expect(await hover(CODE, needle)).toBeNull()
  })
})
