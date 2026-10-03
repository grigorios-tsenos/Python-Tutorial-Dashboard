---
id: db-spark
track: databricks
order: 2
title: Your First Spark DataFrame
tagline: Same ideas as pandas, but built to spread across a cluster.
kind: run
xp: 30
minutes: 6
---
@@body
# Spark thinks in transformations

Spark DataFrames *look* like pandas, but they're **immutable** and the API is column-expression based: you describe what you want with `F.col(...)`, and Spark figures out how to run it on many machines.

```python
import pyspark.sql.functions as F

df.filter(F.col("fare") > 10)                       # keep rows (like a WHERE)
df.withColumn("tax", F.col("fare") * 0.2)           # add/replace a column
df.select("city", "fare")                           # pick columns
df.show()                                           # print a table
```

Every call returns a **new** DataFrame, so you chain them.

> **Mission:** keep trips with `fare > 10`, then add `fare_per_person = fare / passengers`. Store the result in `result`.
@@starter
from pyspark.sql import SparkSession
import pyspark.sql.functions as F

spark = SparkSession.builder.appName("orbit").getOrCreate()

trips = spark.createDataFrame(
    [("NYC", 12.5, 2), ("NYC", 40.0, 4), ("SF", 18.0, 1), ("SF", 9.5, 3)],
    ["city", "fare", "passengers"],
)

# TODO: keep fare > 10, then add a fare_per_person column
result = trips

result.show()
@@solution
from pyspark.sql import SparkSession
import pyspark.sql.functions as F

spark = SparkSession.builder.appName("orbit").getOrCreate()

trips = spark.createDataFrame(
    [("NYC", 12.5, 2), ("NYC", 40.0, 4), ("SF", 18.0, 1), ("SF", 9.5, 3)],
    ["city", "fare", "passengers"],
)

result = (
    trips
    .filter(F.col("fare") > 10)
    .withColumn("fare_per_person", F.col("fare") / F.col("passengers"))
)

result.show()
@@check
test("the cheap SF trip is filtered out", lambda: result.count() == 3)
test("new column added", lambda: result.columns == ["city", "fare", "passengers", "fare_per_person"])
test("values are right", lambda: [r["fare_per_person"] for r in result.collect()] == [6.25, 10.0, 18.0])
@@hint
Chain two calls: `.filter(F.col("fare") > 10)` then `.withColumn("fare_per_person", ...)`.
@@hint
`.withColumn("fare_per_person", F.col("fare") / F.col("passengers"))`
@@q
Are Spark DataFrames mutable?
@@a
No. Every transformation returns a new DataFrame.
@@q
What does `F.col("x")` represent?
@@a
A column expression: a description of a computation, evaluated by Spark later.
@@real
On Databricks, `spark` already exists in every notebook, and `display(df)` renders an interactive table. This lesson's Orbit mini-Spark is backed by pandas, with Spark-style `show()` and error messages.
