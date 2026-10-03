---
id: db-service-metrics
track: databricks
order: 6
title: Service Health by Region
tagline: Count requests, measured latencies and distinct users without mixing them up.
kind: build
xp: 50
minutes: 6
---
@@body
# A useful metric needs the right denominator

Three requests from one user are **three requests** but **one user**. A missing latency still counts as a request, just not toward the average.

| expression | meaning |
|---|---|
| `F.count("*")` | every row in the group |
| `F.count("latency_ms")` | rows with a non-null latency |
| `F.countDistinct("user_id")` | distinct, non-null users |
| `F.avg("latency_ms")` | average of non-null latencies |

> **Mission:** write `service_metrics(events)` returning one row per `region`, sorted by region, with these columns in order: `region`, `requests`, `measured`, `users`, `avg_latency_ms`. Round the average to one decimal place. If a region has no measured latencies, its average stays NULL. Keep the input unchanged.

The checks cover repeated users, missing users, regions with no measurements and an empty DataFrame. Use column expressions and aggregation, not Python collection.
@@starter
from pyspark.sql import SparkSession
import pyspark.sql.functions as F

spark = SparkSession.builder.getOrCreate()
SCHEMA = "region string, user_id string, latency_ms double"
events = spark.createDataFrame([
    ("EU", "u1", 100.0),
    ("US", "u2", 70.0),
    ("EU", "u1", 140.0),
    ("EU", "u3", None),
    ("US", None, 90.0),
], SCHEMA)

def service_metrics(events):
    # TODO: group, aggregate with aliases, and sort by region
    return events

service_metrics(events).show()
@@solution
from pyspark.sql import SparkSession
import pyspark.sql.functions as F

spark = SparkSession.builder.getOrCreate()
SCHEMA = "region string, user_id string, latency_ms double"
events = spark.createDataFrame([
    ("EU", "u1", 100.0),
    ("US", "u2", 70.0),
    ("EU", "u1", 140.0),
    ("EU", "u3", None),
    ("US", None, 90.0),
], SCHEMA)

def service_metrics(events):
    return (
        events.groupBy("region")
        .agg(
            F.count("*").alias("requests"),
            F.count("latency_ms").alias("measured"),
            F.countDistinct("user_id").alias("users"),
            F.round(F.avg("latency_ms"), 1).alias("avg_latency_ms"),
        )
        .orderBy("region")
    )

service_metrics(events).show()
@@check
columns = ["region", "requests", "measured", "users", "avg_latency_ms"]
test("the output columns describe each metric", lambda: service_metrics(events).columns == columns)
test("repeated users and missing latency use different counts", lambda: [tuple(r) for r in service_metrics(events).collect()] == [("EU", 3, 2, 2, 120.0), ("US", 2, 2, 1, 80.0)])
fresh = spark.createDataFrame([
    ("West", "v1", 10.0),
    ("East", "v2", None),
    ("West", "v1", 10.2),
    ("West", "v3", 10.3),
    ("East", None, None),
], SCHEMA)
before = fresh.collect()
test("new regions and values are computed independently", lambda: [tuple(r) for r in service_metrics(fresh).collect()] == [("East", 2, 0, 1, None), ("West", 3, 3, 2, 10.2)])
test("aggregation leaves the source rows unchanged", lambda: fresh.collect() == before)
empty = spark.createDataFrame([], SCHEMA)
test("empty data keeps the output schema without invented regions", lambda: service_metrics(empty).columns == columns and service_metrics(empty).count() == 0)
@@hint
Start with `events.groupBy("region").agg(...)`. Each aggregate needs `.alias(...)` to create the required output name. Missing values are excluded by `count(column)` and `avg(column)`.
@@hint
Use `F.count("*")`, `F.count("latency_ms")`, `F.countDistinct("user_id")` and `F.round(F.avg("latency_ms"), 1)` in that order, then `.orderBy("region")`.
@@q
Why can request counts and latency measurement counts differ?
@@a
count("*") includes every row; count("latency_ms") excludes rows whose latency is NULL.
@@q
Does countDistinct include NULL as a separate user?
@@a
No. It counts distinct non-null values, so anonymous requests increase requests but not users.
@@real
Spark executes these grouped aggregates across partitions; Orbit uses the same column-expression API in memory. See the [Spark count reference](https://spark.apache.org/docs/latest/api/python/reference/pyspark.sql/api/pyspark.sql.functions.count.html).
