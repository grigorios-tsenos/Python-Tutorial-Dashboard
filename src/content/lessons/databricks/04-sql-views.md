---
id: db-sql
track: databricks
order: 4
title: "Bug Hunt: The Zone Report in Spark SQL"
tagline: Half your team writes SQL. Make sure it isn't built with string formatting.
kind: bug
xp: 45
minutes: 7
---
@@body
# Temp views, HAVING, and parameter markers

Register a DataFrame as a **temporary view** and query it with `spark.sql`: same engine, a DataFrame back.

```python
trips.createOrReplaceTempView("trips")           # visible to spark.sql in this session
spark.sql("SELECT zone, COUNT(*) AS n_trips FROM trips GROUP BY zone")
```

This report has **two** bugs:

1. **`WHERE` vs `HAVING`.** `WHERE` filters rows **before** grouping and can't use an aggregate like `COUNT(*)`; `HAVING` filters groups **after** aggregation.
2. **String formatting a query.** An f-string pastes `city` into the SQL: `St. John's` breaks the quote, and `x' OR '1'='1` rewrites the query — SQL injection. Use **named parameter markers**:

```python
spark.sql("SELECT * FROM trips WHERE city = :city", args={"city": city})
```

> **Mission:** fix `zone_report(spark, trips, city, min_trips)`. It returns completed trips per zone for one city as `zone`, `n_trips`, `avg_fare` (rounded to 2 decimals), keeping zones with **at least** `min_trips` completed trips, busiest first, ties by zone name. Cancelled trips never count. Any city name must work, including ones with quotes.
@@starter
from pyspark.sql import SparkSession

spark = SparkSession.builder.getOrCreate()

trips = spark.createDataFrame([
    ("London", "Soho", 12.5, "completed"),
    ("London", "Soho", 18.0, "completed"),
    ("London", "Soho", 9.0, "cancelled"),
    ("London", "Camden", 22.0, "completed"),
    ("London", "Camden", 8.0, "completed"),
    ("London", "Camden", 15.0, "completed"),
    ("London", "Brixton", 30.0, "completed"),
    ("Paris", "Marais", 14.0, "completed"),
], "city string, zone string, fare double, status string")

def zone_report(spark, trips, city, min_trips):
    """Completed trips per zone in one city, keeping zones with at least min_trips."""
    trips.createOrReplaceTempView("trips")
    # BUG HUNT: an aggregate in WHERE, and values pasted into the SQL text
    return spark.sql(f"""
        SELECT zone, COUNT(*) AS n_trips, ROUND(AVG(fare), 2) AS avg_fare
        FROM trips
        WHERE city = '{city}' AND status = 'completed' AND COUNT(*) >= {min_trips}
        GROUP BY zone
        ORDER BY n_trips DESC, zone
    """)

zone_report(spark, trips, "London", 2).show()
@@solution
from pyspark.sql import SparkSession

spark = SparkSession.builder.getOrCreate()

trips = spark.createDataFrame([
    ("London", "Soho", 12.5, "completed"),
    ("London", "Soho", 18.0, "completed"),
    ("London", "Soho", 9.0, "cancelled"),
    ("London", "Camden", 22.0, "completed"),
    ("London", "Camden", 8.0, "completed"),
    ("London", "Camden", 15.0, "completed"),
    ("London", "Brixton", 30.0, "completed"),
    ("Paris", "Marais", 14.0, "completed"),
], "city string, zone string, fare double, status string")

def zone_report(spark, trips, city, min_trips):
    """Completed trips per zone in one city, keeping zones with at least min_trips."""
    trips.createOrReplaceTempView("trips")
    return spark.sql("""
        SELECT zone, COUNT(*) AS n_trips, ROUND(AVG(fare), 2) AS avg_fare
        FROM trips
        WHERE city = :city AND status = 'completed'
        GROUP BY zone
        HAVING COUNT(*) >= :min_trips
        ORDER BY n_trips DESC, zone
    """, args={"city": city, "min_trips": min_trips})

zone_report(spark, trips, "London", 2).show()
@@check
rows = lambda df: [tuple(r) for r in df.collect()]
test("busiest zones first, cancelled trips excluded", lambda: rows(zone_report(spark, trips, "London", 2)) == [("Camden", 3, 15.0), ("Soho", 2, 15.25)])
test("the output columns are zone, n_trips, avg_fare", lambda: zone_report(spark, trips, "London", 2).columns == ["zone", "n_trips", "avg_fare"])
test("the threshold is inclusive and comes from the argument", lambda: rows(zone_report(spark, trips, "London", 3)) == [("Camden", 3, 15.0)] and [r[0] for r in rows(zone_report(spark, trips, "London", 1))] == ["Camden", "Soho", "Brixton"])
test("only the requested city is reported", lambda: rows(zone_report(spark, trips, "Paris", 1)) == [("Marais", 1, 14.0)])
harbour = spark.createDataFrame([
    ("St. John's", "Harbour", 10.0, "completed"),
    ("St. John's", "Harbour", 11.0, "completed"),
    ("St. John's", "Airport", 40.0, "completed"),
    ("St. John's", "Downtown", 7.0, "completed"),
    ("Oslo", "Grunerlokka", 20.0, "completed"),
], "city string, zone string, fare double, status string")
test("a city name containing a quote works", lambda: rows(zone_report(spark, harbour, "St. John's", 2)) == [("Harbour", 2, 10.5)])
test("equal counts are ordered by zone name", lambda: [r[0] for r in rows(zone_report(spark, harbour, "St. John's", 1))] == ["Harbour", "Airport", "Downtown"])
test("an injection attempt matches no city", lambda: zone_report(spark, harbour, "x' OR '1'='1", 1).count() == 0)
empty = zone_report(spark, trips, "London", 100)
test("no qualifying zones keeps the schema", lambda: empty.count() == 0 and empty.columns == ["zone", "n_trips", "avg_fare"])
@@hint
Move the count condition out of `WHERE` into a `HAVING COUNT(*) >= ...` clause after `GROUP BY zone`. `WHERE` keeps only the row-level conditions (city and status).
@@hint
Replace the f-string values with markers, `WHERE city = :city ... HAVING COUNT(*) >= :min_trips`, and call `spark.sql(query, args={"city": city, "min_trips": min_trips})`. Drop the `f` prefix and the quotes around `:city`.
@@q
What is the difference between WHERE and HAVING?
@@a
WHERE filters rows before grouping; HAVING filters groups after aggregation and can use aggregates like COUNT(*).
@@q
Why pass values with `args={...}` instead of formatting them into the SQL string?
@@a
Parameters are sent as values, never parsed as SQL, so quotes can't break the query and input can't inject SQL.
@@real
Named parameter markers work in `spark.sql` since Spark 3.4 and in Databricks SQL (`:param`). A temp view lives only for the current session; publish shared data as a Unity Catalog table.
