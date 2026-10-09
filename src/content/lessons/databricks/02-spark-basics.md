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

Spark DataFrames are **immutable**: describe what you want with `F.col(...)` expressions, and Spark runs it across machines.

```python
import pyspark.sql.functions as F

df.filter(F.col("fare") > 10)                       # keep rows (like a WHERE)
df.withColumn("tax", F.col("fare") * 0.2)           # add/replace a column
```

Every call returns a **new** DataFrame; chain them.

> **Mission:** keep trips with `fare > 10` in `kept`, then add `fare_per_person = fare / passengers` and store that in `result`.
@@starter
from pyspark.sql import SparkSession
import pyspark.sql.functions as F

spark = SparkSession.builder.appName("orbit").getOrCreate()

trips = spark.createDataFrame(
    [("NYC", 12.5, 2), ("NYC", 40.0, 4), ("SF", 18.0, 1), ("SF", 9.5, 3)],
    ["city", "fare", "passengers"],
)

# TODO 1: kept = the trips with fare > 10

# TODO 2: result = kept plus a fare_per_person column
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

kept = trips.filter(F.col("fare") > 10)

result = kept.withColumn("fare_per_person", F.col("fare") / F.col("passengers"))

result.show()
@@check
test("the cheap SF trip is filtered out", lambda: result.count() == 3)
test("new column added", lambda: result.columns == ["city", "fare", "passengers", "fare_per_person"])
test("values are right", lambda: [r["fare_per_person"] for r in result.collect()] == [6.25, 10.0, 18.0])
test("the original table still has four rows", lambda: trips.count() == 4)
@@hint
Two calls: `.filter(F.col("fare") > 10)` for `kept`, then `.withColumn("fare_per_person", ...)` on `kept`.
@@hint
`result = kept.withColumn("fare_per_person", F.col("fare") / F.col("passengers"))`
@@q
Are Spark DataFrames mutable?
@@a
No. Every transformation returns a new DataFrame.
@@q
What does `F.col("x")` represent?
@@a
A column expression: a description of a computation, evaluated by Spark later.
@@real
On Databricks, `spark` already exists in every notebook, and `display(df)` renders an interactive table. Orbit's mini-Spark is backed by pandas, with Spark-style `show()` and error messages.
