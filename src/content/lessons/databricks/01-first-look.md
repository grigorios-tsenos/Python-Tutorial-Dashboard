---
id: db-first-look
track: databricks
order: 1
title: One Laptop Is Not Enough
tagline: Spark looks like pandas on purpose. The difference is who does the work.
kind: run
xp: 25
minutes: 4
---
@@body
# Describe the work, let a cluster run it

A real event table can be billions of rows, too big for one machine. With Spark, **you describe the result; a cluster splits the work.** Databricks is where teams run Spark. A Spark DataFrame feels like pandas. Three starter moves:

```python
df.show()                    # LOOK: print the table (first 20 rows)
df.count()                   # how many rows, across the whole cluster
df.select("city", "fare")    # PICK columns -> a NEW DataFrame
```

Two rules: **nothing prints by itself** (`select` only *describes* a smaller table; `.show()` looks at it), and **DataFrames never change** (every operation returns a new one).

> **Mission:** look at the trips table with `.show()`, store how many trips there are in `n`, and build `fares`: a new DataFrame with only the `city` and `fare` columns (then show it too).
@@starter
from pyspark.sql import SparkSession

spark = SparkSession.builder.appName("orbit").getOrCreate()

trips = spark.createDataFrame(
    [("NYC", 12.5, 2), ("NYC", 40.0, 4), ("SF", 18.0, 1), ("SF", 9.5, 3), ("LA", 22.0, 2)],
    ["city", "fare", "passengers"],
)

# TODO 1: look at the table
# TODO 2: how many trips?
n = 0
# TODO 3: only the city and fare columns
fares = trips

fares.show()
print(n)
@@solution
from pyspark.sql import SparkSession

spark = SparkSession.builder.appName("orbit").getOrCreate()

trips = spark.createDataFrame(
    [("NYC", 12.5, 2), ("NYC", 40.0, 4), ("SF", 18.0, 1), ("SF", 9.5, 3), ("LA", 22.0, 2)],
    ["city", "fare", "passengers"],
)

trips.show()
n = trips.count()
fares = trips.select("city", "fare")

fares.show()
print(n)
@@check
test("n counts every trip", lambda: n == 5, "n = trips.count()")
test("fares keeps only city and fare", lambda: fares.columns == ["city", "fare"], 'fares = trips.select("city", "fare")')
test("fares still has every row", lambda: fares.count() == 5)
test("selecting did not change the original table", lambda: trips.columns == ["city", "fare", "passengers"])
test("the table was shown", lambda: "passengers" in __stdout__ and "NYC" in __stdout__, "call trips.show() to print the table")
@@hint
`trips.count()` returns a number. `trips.select("city", "fare")` returns a new, narrower DataFrame; it does not modify `trips`.
@@hint
`trips.show()`, then `n = trips.count()`, then `fares = trips.select("city", "fare")`.
@@q
What does df.select("a", "b") do to the original DataFrame?
@@a
Nothing. It returns a new DataFrame with those columns; Spark DataFrames are immutable.
@@q
Why does Spark exist when pandas already handles tables?
@@a
pandas works on one machine's memory; Spark describes the same operations so a cluster can run them on data far bigger than one machine.
@@real
On Databricks, `spark` already exists in every notebook and `display(df)` renders an interactive table. This chapter's mini-Spark runs on pandas underneath, but the API is the real one.
