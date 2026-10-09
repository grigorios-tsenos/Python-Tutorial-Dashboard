---
id: db-medallion
track: databricks
order: 9
title: "Boss: The Medallion Pipeline"
tagline: Bronze, silver, gold. How every serious lakehouse is organised.
kind: boss
xp: 140
minutes: 15
---
@@body
# Boss: raw mess in, trusted numbers out

The **medallion architecture** stages data quality:

| layer | contents |
|---|---|
| 🥉 **bronze** | raw data exactly as received; never modified |
| 🥈 **silver** | cleaned, validated, de-duplicated |
| 🥇 **gold** | business-ready aggregates for dashboards and models |

Your raw orders contain a duplicate `o2`, an order with no user, an amount of `"n/a"`, and amounts stored as text.

> **Mission:** write `run_pipeline(spark, raw_rows)`, saving three Delta tables and returning the gold DataFrame:
> - `main.shop.bronze`: the raw rows untouched
> - `main.shop.silver`: drop rows with a null, empty or whitespace-only `user`; cast `amount` to **double** and drop non-numbers; drop duplicate `order_id`s
> - `main.shop.gold_revenue`: per `city`, `revenue` (sum, rounded to 2 decimals) and `orders` (count), biggest revenue first, ties by city
>
> Use `mode("overwrite")` so a second run doesn't crash.

The boss changes cities and IDs, includes negative amounts (valid refunds) and ends with an empty batch: give bronze an explicit all-string schema (`order_id`, `user`, `amount`, `city`) so even an empty batch creates all three tables. Keep `raw_rows` unchanged.

@@step Bronze: land the raw rows with an explicit schema
Create the DataFrame with the schema string `"order_id string, user string, amount string, city string"` (so an empty batch still has columns), save it with `.write.format("delta").mode("overwrite").saveAsTable("main.shop.bronze")`, and return it for now.
@@stepcheck
run_pipeline(spark, RAW)
bronze = spark.table("main.shop.bronze")
test("bronze keeps every raw row with an all-string schema", lambda: bronze.count() == 7 and [t for _, t in bronze.dtypes] == ["string"] * 4, 'createDataFrame(raw_rows, "order_id string, user string, amount string, city string") then saveAsTable')
@@step Silver: clean, cast, dedupe
From bronze: keep rows whose trimmed `user` is non-empty, cast `amount` to double and keep only rows where the cast succeeded, then `dropDuplicates(["order_id"])`. Save as `main.shop.silver`.
@@stepcheck
run_pipeline(spark, RAW)
silver = spark.table("main.shop.silver")
test("silver is clean: 4 valid, unique orders with double amounts", lambda: silver.count() == 4 and dict(silver.dtypes)["amount"] == "double", "filter user, cast amount, filter isNotNull, dropDuplicates")
@@step Gold: aggregate, sort, save, return
Group silver by `city`, aggregate `F.round(F.sum("amount"), 2).alias("revenue")` and `F.count("*").alias("orders")`, order by revenue descending then city, save as `main.shop.gold_revenue`, and return the DataFrame.
@@stepcheck
g = run_pipeline(spark, RAW)
rows = [(r["city"], r["revenue"], r["orders"]) for r in g.collect()]
test("gold: revenue per city, biggest first", lambda: rows == [("NYC", 50.0, 2), ("LA", 12.0, 1), ("SF", 5.0, 1)], "got " + str(rows))
test("gold saved as a table", lambda: spark.table("main.shop.gold_revenue").count() == 3)
@@starter
from pyspark.sql import SparkSession
import pyspark.sql.functions as F

spark = SparkSession.builder.getOrCreate()

RAW = [
    {"order_id": "o1", "user": "u1", "amount": "19.99", "city": "NYC"},
    {"order_id": "o2", "user": "u2", "amount": "5.00",  "city": "SF"},
    {"order_id": "o2", "user": "u2", "amount": "5.00",  "city": "SF"},    # duplicate
    {"order_id": "o3", "user": None, "amount": "7.50",  "city": "NYC"},   # no user
    {"order_id": "o4", "user": "u3", "amount": "n/a",   "city": "SF"},    # bad amount
    {"order_id": "o5", "user": "u4", "amount": "30.01", "city": "NYC"},
    {"order_id": "o6", "user": "u5", "amount": "12.00", "city": "LA"},
]

def run_pipeline(spark, raw_rows):
    bronze = spark.createDataFrame(raw_rows)
    # TODO: save bronze, build + save silver, build + save gold; return gold
    return None

gold = run_pipeline(spark, RAW)
gold.show()
@@solution
from pyspark.sql import SparkSession
import pyspark.sql.functions as F

spark = SparkSession.builder.getOrCreate()

RAW = [
    {"order_id": "o1", "user": "u1", "amount": "19.99", "city": "NYC"},
    {"order_id": "o2", "user": "u2", "amount": "5.00",  "city": "SF"},
    {"order_id": "o2", "user": "u2", "amount": "5.00",  "city": "SF"},    # duplicate
    {"order_id": "o3", "user": None, "amount": "7.50",  "city": "NYC"},   # no user
    {"order_id": "o4", "user": "u3", "amount": "n/a",   "city": "SF"},    # bad amount
    {"order_id": "o5", "user": "u4", "amount": "30.01", "city": "NYC"},
    {"order_id": "o6", "user": "u5", "amount": "12.00", "city": "LA"},
]

def run_pipeline(spark, raw_rows):
    bronze = spark.createDataFrame(raw_rows, "order_id string, user string, amount string, city string")
    bronze.write.format("delta").mode("overwrite").saveAsTable("main.shop.bronze")

    silver = (
        bronze
        .filter(F.col("user").isNotNull() & (F.trim(F.col("user")) != ""))
        .withColumn("amount", F.col("amount").cast("double"))
        .filter(F.col("amount").isNotNull())
        .dropDuplicates(["order_id"])
    )
    silver.write.format("delta").mode("overwrite").saveAsTable("main.shop.silver")

    gold = (
        silver
        .groupBy("city")
        .agg(F.round(F.sum("amount"), 2).alias("revenue"), F.count("*").alias("orders"))
        .orderBy(F.desc("revenue"), "city")
    )
    gold.write.format("delta").mode("overwrite").saveAsTable("main.shop.gold_revenue")
    return gold

gold = run_pipeline(spark, RAW)
gold.show()
@@check
g = run_pipeline(spark, RAW)
rows = [(r["city"], r["revenue"], r["orders"]) for r in g.collect()]
test("gold: revenue per city, biggest first", lambda: rows == [("NYC", 50.0, 2), ("LA", 12.0, 1), ("SF", 5.0, 1)], "got " + str(rows))
test("bronze keeps every raw row (7)", lambda: spark.table("main.shop.bronze").count() == 7)
test("silver is clean: 4 valid, unique orders", lambda: spark.table("main.shop.silver").count() == 4)
test("silver amounts are doubles", lambda: dict(spark.table("main.shop.silver").dtypes)["amount"] == "double")
test("gold saved as a table", lambda: spark.table("main.shop.gold_revenue").count() == 3)
test("re-runnable: a second run doesn't fail", lambda: run_pipeline(spark, RAW).count() == 3)
fresh_raw = [
    {"order_id": "x1", "user": "u1", "amount": "10.00", "city": "Athens"},
    {"order_id": "x2", "user": "u2", "amount": "5.55", "city": "Paris"},
    {"order_id": "x2", "user": "u2", "amount": "5.55", "city": "Paris"},
    {"order_id": "x3", "user": "u3", "amount": "-0.55", "city": "Paris"},
    {"order_id": "x4", "user": "  ", "amount": "100.00", "city": "Paris"},
    {"order_id": "x5", "user": "u4", "amount": "bad", "city": "Berlin"},
    {"order_id": "x6", "user": "u5", "amount": "10.00", "city": "Berlin"},
]
original = [dict(r) for r in fresh_raw]
fresh_gold = run_pipeline(spark, fresh_raw)
fresh_rows = [(r["city"], r["revenue"], r["orders"]) for r in fresh_gold.collect()]
test("new data retains refunds and sorts revenue ties by city", lambda: fresh_rows == [("Athens", 10.0, 1), ("Berlin", 10.0, 1), ("Paris", 5.0, 2)])
test("blank users and bad amounts are removed before aggregation", lambda: spark.table("main.shop.silver").count() == 4)
test("bronze and caller input remain untouched", lambda: spark.table("main.shop.bronze").count() == 7 and fresh_raw == original)
test("rerun replaces previous cities", lambda: [r["city"] for r in spark.table("main.shop.gold_revenue").collect()] == ["Athens", "Berlin", "Paris"])
empty = run_pipeline(spark, [])
test("empty batch writes empty bronze, silver and gold", lambda: empty.count() == 0 and all(spark.table(name).count() == 0 for name in ["main.shop.bronze", "main.shop.silver", "main.shop.gold_revenue"]))
@@hint
Use an explicit string schema for bronze. Silver filters null users and `F.trim(F.col("user")) == ""`, casts amount to double, removes failed casts, then calls `.dropDuplicates(["order_id"])`. Negative amounts are valid refunds.
@@hint
Gold: `silver.groupBy("city").agg(F.round(F.sum("amount"), 2).alias("revenue"), F.count("*").alias("orders")).orderBy(F.desc("revenue"), "city")`. Save each layer with `.write.format("delta").mode("overwrite").saveAsTable("main.shop.<name>")`.
@@q
Why keep an untouched bronze layer?
@@a
It's the source of truth: you can always rebuild silver and gold if cleaning logic changes.
@@q
Why must pipelines be idempotent (safe to re-run)?
@@a
Jobs get retried and re-scheduled; a re-run must produce the same result, not duplicates or crashes.
@@real
On Databricks, schedule this with Lakeflow Jobs, or declare it as a Lakeflow Declarative Pipeline (formerly Delta Live Tables) with `EXPECT` constraints — the same bronze/silver/gold flow with monitoring built in.
