---
id: db-quarantine
track: databricks
order: 8
title: Quarantine Bad Rows, Don't Delete Them
tagline: Silently dropped data hides broken upstreams. Route failures somewhere you can count.
kind: build
xp: 65
minutes: 9
---
@@body
# Data quality expectations

Every pipeline needs rules: *an order has a user*, *the amount is a number*, *the country is one we sell to*. What happens to rows that break them?

| policy | effect |
|---|---|
| fail the job | one bad row blocks every good one |
| drop silently | the dashboard looks fine while an upstream bug eats 30% of orders |
| **quarantine** | good rows flow on; bad rows go to a side table **with the reason**, where you can count them and alert |

`F.when` chains evaluate in order, so the **first** broken rule names the reason:

```python
reason = (F.when(rule_1_broken, "rule_1")
           .when(rule_2_broken, "rule_2"))        # NULL when no rule is broken
```

Two NULL traps from earlier in this chapter apply here:

- `F.col("country").isin(...)` on a NULL country is **NULL**, not false, and `when` skips NULL conditions. A missing country would sail through as valid unless you test `isNull()` explicitly.
- On modern runtimes with ANSI mode on, `cast("double")` **raises** on text like `"n/a"`. `try_cast("double")` returns NULL instead, which is what a quality check needs.

> **Mission:** implement `apply_expectations(df, countries)` returning `(valid, quarantine)`. Input columns are `order_id`, `user`, `amount`, `country`, all strings. Check these rules in order:
>
> 1. `missing_user`: `user` is NULL, empty or whitespace
> 2. `bad_amount`: `amount` is NULL or not a number (negative numbers are valid refunds)
> 3. `unknown_country`: `country` is NULL or not in `countries`
>
> `valid` holds the rows that pass every rule, with the original columns and `amount` as a **double**. `quarantine` holds every other row **unchanged** (raw `amount` text, so you can see what arrived) plus a `reason` column naming the first broken rule. Every input row lands in exactly one output. Keep the input unchanged; an empty input gives two empty outputs with those schemas.

Where this fits: the boss builds a full bronze → silver → gold pipeline. This is the silver layer's safety net.
@@starter
from pyspark.sql import SparkSession
import pyspark.sql.functions as F

spark = SparkSession.builder.getOrCreate()
SCHEMA = "order_id string, user string, amount string, country string"
COUNTRIES = ["DE", "FR", "GB", "GR", "US"]

orders = spark.createDataFrame([
    ("o1", "u1", "19.99", "US"),
    ("o2", None, "5.00", "GB"),
    ("o3", "u3", "n/a", "DE"),
    ("o4", "u4", "-4.50", "FR"),
    ("o5", "u5", "12.00", None),
    ("o6", "  ", "oops", "XX"),
], SCHEMA)

def apply_expectations(df, countries):
    """Split rows into (valid, quarantine with a reason column)."""
    # BUG: silently drops every row with a NULL, and keeps text amounts and unknown countries
    valid = df.dropna()
    quarantine = df.limit(0).withColumn("reason", F.lit("unknown"))
    return valid, quarantine

valid, quarantine = apply_expectations(orders, COUNTRIES)
valid.show()
quarantine.show()
@@solution
from pyspark.sql import SparkSession
import pyspark.sql.functions as F

spark = SparkSession.builder.getOrCreate()
SCHEMA = "order_id string, user string, amount string, country string"
COUNTRIES = ["DE", "FR", "GB", "GR", "US"]

orders = spark.createDataFrame([
    ("o1", "u1", "19.99", "US"),
    ("o2", None, "5.00", "GB"),
    ("o3", "u3", "n/a", "DE"),
    ("o4", "u4", "-4.50", "FR"),
    ("o5", "u5", "12.00", None),
    ("o6", "  ", "oops", "XX"),
], SCHEMA)

def apply_expectations(df, countries):
    """Split rows into (valid, quarantine with a reason column)."""
    reason = (
        F.when(F.col("user").isNull() | (F.trim(F.col("user")) == ""), "missing_user")
        .when(F.col("amount").try_cast("double").isNull(), "bad_amount")
        .when(F.col("country").isNull() | ~F.col("country").isin(countries), "unknown_country")
    )
    tagged = df.withColumn("reason", reason)
    valid = (
        tagged.filter(F.col("reason").isNull())
        .drop("reason")
        .withColumn("amount", F.col("amount").try_cast("double"))
    )
    quarantine = tagged.filter(F.col("reason").isNotNull())
    return valid, quarantine

valid, quarantine = apply_expectations(orders, COUNTRIES)
valid.show()
quarantine.show()
@@check
recs = lambda df: sorted(tuple(r) for r in df.collect())
before = orders.collect()
v, q = apply_expectations(orders, COUNTRIES)
test("valid rows keep the original columns with amount as a double", lambda: v.columns == ["order_id", "user", "amount", "country"] and dict(v.dtypes)["amount"] == "double")
test("valid rows pass every rule; refunds are valid", lambda: recs(v) == [("o1", "u1", 19.99, "US"), ("o4", "u4", -4.5, "FR")])
test("quarantine keeps raw values and adds a reason", lambda: q.columns == ["order_id", "user", "amount", "country", "reason"] and ("o3", "u3", "n/a", "DE", "bad_amount") in recs(q))
test("each quarantined row names its first broken rule", lambda: {r["order_id"]: r["reason"] for r in q.collect()} == {"o2": "missing_user", "o3": "bad_amount", "o5": "unknown_country", "o6": "missing_user"})
test("a NULL country is quarantined, not waved through", lambda: "o5" not in [r["order_id"] for r in v.collect()])
test("every input row lands in exactly one output", lambda: v.count() + q.count() == orders.count() and set(r["order_id"] for r in v.collect()).isdisjoint(r["order_id"] for r in q.collect()))
test("the input is unchanged", lambda: orders.collect() == before)
fresh = spark.createDataFrame([
    ("a1", "x", "1e3", "GR"),
    ("a2", "y", "", "GR"),
    ("a3", "z", None, "US"),
    ("a4", "w", "7", "us"),
    ("a5", "v", "0", "JP"),
], SCHEMA)
fv, fq = apply_expectations(fresh, ["GR", "US", "JP"])
test("new data and a different country list are handled", lambda: recs(fv) == [("a1", "x", 1000.0, "GR"), ("a5", "v", 0.0, "JP")])
test("empty and missing amounts are bad; country codes are case-sensitive", lambda: {r["order_id"]: r["reason"] for r in fq.collect()} == {"a2": "bad_amount", "a3": "bad_amount", "a4": "unknown_country"})
ev, eq = apply_expectations(spark.createDataFrame([], SCHEMA), COUNTRIES)
test("empty input gives two empty outputs with their schemas", lambda: ev.count() == 0 and eq.count() == 0 and ev.columns == ["order_id", "user", "amount", "country"] and eq.columns[-1] == "reason")
@@hint
Build one `reason` column with `F.when(...).when(...).when(...)` in rule order: `F.col("user").isNull() | (F.trim(F.col("user")) == "")`, then `F.col("amount").try_cast("double").isNull()`, then `F.col("country").isNull() | ~F.col("country").isin(countries)`.
@@hint
`tagged = df.withColumn("reason", reason)`. Valid rows: `tagged.filter(F.col("reason").isNull()).drop("reason").withColumn("amount", F.col("amount").try_cast("double"))`. Quarantine: `tagged.filter(F.col("reason").isNotNull())`.
@@q
Why quarantine failing rows instead of dropping them?
@@a
You keep the evidence and can count and alert on failures, while valid rows keep flowing.
@@q
What does `F.col("c").isin(["a"])` return when `c` is NULL?
@@a
NULL, so `F.when` skips it. Test `isNull()` explicitly to catch missing values.
@@real
Lakeflow Declarative Pipelines (formerly Delta Live Tables) express these rules as expectations, `@dp.expect_or_drop("valid_amount", "try_cast(amount AS DOUBLE) IS NOT NULL")`, and report pass/fail counts per rule in the pipeline UI. Teams commonly write the quarantine table to Delta and alert when its daily count spikes.
