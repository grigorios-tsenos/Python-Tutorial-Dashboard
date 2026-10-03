---
id: db-delta
track: databricks
order: 5
title: Undo a Disaster With Time Travel
tagline: Delta tables remember every version. Someone just broke prod.
kind: build
xp: 50
minutes: 8
---
@@body
# Delta Lake: a table with a memory

A **Delta table** is Parquet files plus a transaction log. Every write creates a new numbered **version**, and old versions stay readable: ACID writes, **time travel** and an audit log. On Databricks tables live in Unity Catalog as `catalog.schema.table` (here `main.demo.docs`).

```python
spark.sql("SELECT * FROM main.demo.docs VERSION AS OF 0")        # time travel
spark.sql("DESCRIBE HISTORY main.demo.docs").show()              # the audit log
```

Someone just overwrote every document's status with `"DELETED"`. Version **0** holds drafts; version **1** holds the approved documents, the ones worth recovering.

> **Mission:** write `recover_table(name, version)` to read any table at a version, then read version **1** of `main.demo.docs` into `recovered`. It must also work for version **0** and other tables, and must leave the current tables untouched (changing them would need `RESTORE`).
@@starter
from pyspark.sql import SparkSession

spark = SparkSession.builder.getOrCreate()

good = spark.createDataFrame([(1, "draft"), (2, "draft")], ["id", "status"])
good.write.format("delta").mode("overwrite").saveAsTable("main.demo.docs")    # version 0

approved = spark.createDataFrame([(1, "approved"), (2, "approved")], ["id", "status"])
approved.write.format("delta").mode("overwrite").saveAsTable("main.demo.docs")  # version 1

bad = spark.createDataFrame([(1, "DELETED"), (2, "DELETED")], ["id", "status"])
bad.write.format("delta").mode("overwrite").saveAsTable("main.demo.docs")     # version 2: oops

spark.sql("DESCRIBE HISTORY main.demo.docs").show()

def recover_table(name, version):
    """Read a historical version without changing the live table."""
    # TODO: use both arguments to read the requested snapshot
    return spark.table(name)

recovered = recover_table("main.demo.docs", 1)

recovered.show()
@@solution
from pyspark.sql import SparkSession

spark = SparkSession.builder.getOrCreate()

good = spark.createDataFrame([(1, "draft"), (2, "draft")], ["id", "status"])
good.write.format("delta").mode("overwrite").saveAsTable("main.demo.docs")    # version 0

approved = spark.createDataFrame([(1, "approved"), (2, "approved")], ["id", "status"])
approved.write.format("delta").mode("overwrite").saveAsTable("main.demo.docs")  # version 1

bad = spark.createDataFrame([(1, "DELETED"), (2, "DELETED")], ["id", "status"])
bad.write.format("delta").mode("overwrite").saveAsTable("main.demo.docs")     # version 2: oops

spark.sql("DESCRIBE HISTORY main.demo.docs").show()

def recover_table(name, version):
    """Read a historical version without changing the live table."""
    return spark.read.option("versionAsOf", version).table(name)

recovered = recover_table("main.demo.docs", 1)

recovered.show()
@@check
test("recovered keeps the approval work from version 1", lambda: sorted((r["id"], r["status"]) for r in recovered.collect()) == [(1, "approved"), (2, "approved")])
test("the requested version changes the snapshot", lambda: sorted((r["id"], r["status"]) for r in recover_table("main.demo.docs", 0).collect()) == [(1, "draft"), (2, "draft")])
spark.createDataFrame([(7, "ready")], ["id", "status"]).write.format("delta").mode("overwrite").saveAsTable("main.demo.notes")
spark.createDataFrame([(7, "DELETED")], ["id", "status"]).write.format("delta").mode("overwrite").saveAsTable("main.demo.notes")
test("recovery also works for another table", lambda: [(r["id"], r["status"]) for r in recover_table("main.demo.notes", 0).collect()] == [(7, "ready")])
test("the live table is untouched by reading history", lambda: all(r["status"] == "DELETED" for r in spark.table("main.demo.docs").collect()))
test("the other live table stays untouched too", lambda: [(r["id"], r["status"]) for r in spark.table("main.demo.notes").collect()] == [(7, "DELETED")])
@@hint
Delta supports `spark.read.option("versionAsOf", version).table(name)`, or SQL time travel: `SELECT * FROM <table> VERSION AS OF <n>`.
@@hint
Inside `recover_table`, return `spark.read.option("versionAsOf", version).table(name)`. Use the arguments instead of fixing the table or version in the function.
@@q
What does a Delta transaction log enable?
@@a
ACID writes, time travel to old versions and a full audit history.
@@q
What is the Unity Catalog naming scheme?
@@a
catalog.schema.table (three levels).
@@real
In real Databricks you can also use `RESTORE TABLE main.demo.docs TO VERSION AS OF 0` to make the old version current again. Time travel is limited by your retention settings (VACUUM removes old files).
