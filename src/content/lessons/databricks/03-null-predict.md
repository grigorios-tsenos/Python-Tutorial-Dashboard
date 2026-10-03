---
id: db-nulls
track: databricks
order: 3
title: NULL Is Not "Not Equal"
tagline: The SQL rule that silently deletes rows from your data.
kind: predict
xp: 30
minutes: 3
answer: 0
---
@@body
# Predict the output

SQL (and so Spark) uses **three-valued logic**: a comparison can be true, false, or **unknown** (NULL). A `filter` keeps only rows where the condition is *true*. Unknown doesn't count.

One row has a missing `tag`. How many rows survive `tag != "a"`?
@@starter
from pyspark.sql import SparkSession
import pyspark.sql.functions as F

spark = SparkSession.builder.getOrCreate()
df = spark.createDataFrame([(1, "a"), (2, None), (3, "c")], ["id", "tag"])
print(df.filter(F.col("tag") != "a").count())
@@choice
1
@@choice
2
@@choice
3
@@choice
0
@@explain
`NULL != "a"` is not *true*, it is **NULL** (unknown), so row 2 is dropped along with row 1 (`"a" != "a"` is false). Only row 3 survives. To keep missing tags too, say so explicitly: `(F.col("tag") != "a") | F.col("tag").isNull()`.
@@hint
What is `NULL != "a"`: true, false, or something else?
@@hint
`filter` keeps rows where the condition is exactly true.
@@q
What does `NULL != 'a'` evaluate to in SQL/Spark?
@@a
NULL (unknown), so a filter drops that row.
@@q
How do you test for missing values in Spark?
@@a
`F.col("x").isNull()` / `.isNotNull()`, never `== None`.
