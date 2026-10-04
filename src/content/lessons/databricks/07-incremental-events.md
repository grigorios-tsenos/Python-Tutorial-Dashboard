---
id: db-incremental-events
track: databricks
order: 7
title: Make an Event Batch Safe to Replay
tagline: Retries should add new events once and preserve the events already stored.
kind: build
xp: 60
minutes: 8
---
@@body
# Insert only the events you have not seen

A scheduled job may receive the same batch twice; appending it twice inflates every metric. An **anti join** keeps left rows with no matching key on the right:

```python
new_events = batch.join(current.select("event_id"), "event_id", "left_anti")
combined = current.unionByName(new_events)     # aligns columns by name
```

> **Mission:** write `append_events(current, batch)` → the combined DataFrame:
> - discard batch rows whose `event_id` is NULL, empty or whitespace
> - remove repeated `event_id`s within the batch
> - keep only batch IDs absent from `current`
> - append them to `current`, preserving its column order

This is **insert-only**: a repeated ID never overwrites its stored payload. Both frames share column names; duplicates within a batch carry identical payloads. Keep both inputs unchanged; handle an empty batch and an empty `current`. Row order is not part of the contract.
@@starter
from pyspark.sql import SparkSession
import pyspark.sql.functions as F

spark = SparkSession.builder.getOrCreate()
SCHEMA = "event_id string, user_id string, action string"
current = spark.createDataFrame([("e1", "u1", "signup")], SCHEMA)
batch = spark.createDataFrame([
    ("e1", "u1", "changed"),
    ("e2", "u2", "purchase"),
    ("e2", "u2", "purchase"),
    (None, "u3", "click"),
], SCHEMA)

def append_events(current, batch):
    # TODO: valid IDs, deduplicate, anti join, union by name
    return current.unionByName(batch)

append_events(current, batch).show()
@@solution
from pyspark.sql import SparkSession
import pyspark.sql.functions as F

spark = SparkSession.builder.getOrCreate()
SCHEMA = "event_id string, user_id string, action string"
current = spark.createDataFrame([("e1", "u1", "signup")], SCHEMA)
batch = spark.createDataFrame([
    ("e1", "u1", "changed"),
    ("e2", "u2", "purchase"),
    ("e2", "u2", "purchase"),
    (None, "u3", "click"),
], SCHEMA)

def append_events(current, batch):
    valid = (
        batch.filter(F.col("event_id").isNotNull() & (F.trim(F.col("event_id")) != ""))
        .dropDuplicates(["event_id"])
    )
    unseen = valid.join(current.select("event_id"), "event_id", "left_anti")
    return current.unionByName(unseen)

append_events(current, batch).show()
@@check
def records(df):
    return sorted((r["event_id"], r["user_id"], r["action"]) for r in df.collect())

expected = [("e1", "u1", "signup"), ("e2", "u2", "purchase")]
test("existing payload wins and a new ID is inserted once", lambda: records(append_events(current, batch)) == expected)
once = append_events(current, batch)
test("replaying the batch does not add duplicates", lambda: records(append_events(once, batch)) == expected)
other_current = spark.createDataFrame([("x1", "v1", "open"), ("x2", "v2", "close")], SCHEMA)
other_batch = spark.createDataFrame([
    ("x2", "other", "replace"),
    ("x3", "v3", "save"),
    ("x3", "v3", "save"),
    ("", "v4", "bad"),
    ("  ", "v5", "bad"),
], SCHEMA).select("action", "event_id", "user_id")
current_before, batch_before = other_current.collect(), other_batch.collect()
test("new inputs and reordered columns are handled by name", lambda: records(append_events(other_current, other_batch)) == [("x1", "v1", "open"), ("x2", "v2", "close"), ("x3", "v3", "save")])
test("the current frame's column order is preserved", lambda: append_events(other_current, other_batch).columns == other_current.columns)
test("source frames stay unchanged", lambda: other_current.collect() == current_before and other_batch.collect() == batch_before)
empty = spark.createDataFrame([], SCHEMA)
test("an empty batch changes nothing", lambda: records(append_events(other_current, empty)) == records(other_current))
test("an empty current frame accepts valid unique events", lambda: records(append_events(empty, batch)) == [("e1", "u1", "changed"), ("e2", "u2", "purchase")])
test("two empty frames keep the schema", lambda: append_events(empty, empty).count() == 0 and append_events(empty, empty).columns == current.columns)
@@hint
Clean and deduplicate the batch first. An ordinary inner join finds existing IDs; `left_anti` finds the opposite: IDs you have not stored yet.
@@hint
Filter with `.isNotNull()` and `F.trim(...) != ""`, call `.dropDuplicates(["event_id"])`, then `.join(current.select("event_id"), "event_id", "left_anti")`. Finish with `current.unionByName(unseen)`.
@@q
What does a left anti join return?
@@a
Rows from the left DataFrame whose join keys have no match on the right.
@@q
Why use unionByName for incremental batches?
@@a
It aligns columns by their names, preventing payloads from being mixed up when column order changes.
@@real
A production Delta table enforces the same intent atomically with a when-not-matched MERGE insert. See [Databricks insert-only merge](https://docs.databricks.com/aws/en/delta/merge#data-deduplication-when-writing-into-delta-lake-tables).
