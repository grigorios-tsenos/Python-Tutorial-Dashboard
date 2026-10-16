import type { CodingGuide } from '../guided';

export const DATABRICKS_GUIDES: Record<string, CodingGuide> = {
  "db-first-look": {
    "setup": "from pyspark.sql import SparkSession\n\nspark = SparkSession.builder.appName(\"orbit\").getOrCreate()\n\ntrips = spark.createDataFrame(\n    [(\"NYC\", 12.5, 2), (\"NYC\", 40.0, 4), (\"SF\", 18.0, 1), (\"SF\", 9.5, 3), (\"LA\", 22.0, 2)],\n    [\"city\", \"fare\", \"passengers\"],\n)",
    "steps": [
      {
        "title": "Look at the source table",
        "instruction": "Display the available `trips` DataFrame as a table so you can inspect its `city`, `fare` and `passengers` columns. This is an inspection step; keep the source data unchanged.",
        "code": "trips.show()",
        "check": "test(\"Look at the source table\", lambda: trips.count() == 5 and \"passengers\" in __stdout__ and \"NYC\" in __stdout__, \"Five trips print with city, fare and passengers.\")",
        "expected": "Five trips print with city, fare and passengers.",
        "reassurance": "You have inspected the input. Nothing has been filtered or changed."
      },
      {
        "title": "Count the trips",
        "instruction": "Find how many rows are in `trips` and store the numeric result in `n`. The count should reflect trips, not columns or passengers.",
        "code": "n = trips.count()",
        "check": "test(\"Count the trips\", lambda: n == 5, \"n is 5.\")",
        "expected": "n is 5.",
        "reassurance": "The row count is verified. Selecting columns will keep those five rows."
      },
      {
        "title": "Select the fare columns",
        "instruction": "Create a DataFrame named `fares` containing only `city` and `fare`, in that order. Keep every row from `trips` and leave its original columns unchanged.",
        "code": "fares = trips.select(\"city\", \"fare\")",
        "check": "test(\"Select the fare columns\", lambda: fares.columns == [\"city\", \"fare\"] and fares.count() == 5, \"fares has city and fare, with five rows.\")",
        "expected": "fares has city and fare, with five rows.",
        "reassurance": "The narrower table is correct. The final check also confirms the source is unchanged."
      },
      {
        "title": "Print the result",
        "instruction": "Display `fares` as a table, then display the stored count `n`. Compare the output with the expected five rows before running the chapter verification.",
        "code": "fares.show()\nprint(n)",
        "check": "",
        "expected": "The fare table prints, followed by 5.",
        "reassurance": "The complete chapter checks the count, projection, source table and printed output."
      }
    ]
  },
  "db-spark": {
    "setup": "from pyspark.sql import SparkSession\nimport pyspark.sql.functions as F\n\nspark = SparkSession.builder.appName(\"orbit\").getOrCreate()\n\ntrips = spark.createDataFrame(\n    [(\"NYC\", 12.5, 2), (\"NYC\", 40.0, 4), (\"SF\", 18.0, 1), (\"SF\", 9.5, 3)],\n    [\"city\", \"fare\", \"passengers\"],\n)",
    "steps": [
      {
        "title": "Keep trips above ten",
        "instruction": "Create `result` from `trips`, retaining only rows with a `fare` strictly greater than `10`. Use Spark column operations and keep `trips` unchanged.",
        "code": "result = trips.filter(F.col(\"fare\") > 10)",
        "check": "test(\"Keep trips above ten\", lambda: result.count() == 3 and all(row[\"fare\"] > 10 for row in result.collect()), \"Three trips remain; the 9.5 fare is gone.\")",
        "expected": "Three trips remain; the 9.5 fare is gone.",
        "reassurance": "The filter is right. Next compute one value for each remaining trip."
      },
      {
        "title": "Compute fare per passenger",
        "instruction": "Extend `result` with a numeric column named `fare_per_person`, representing each retained trip's fare divided by its passenger count. Preserve the existing result columns and rows.",
        "code": "result = result.withColumn(\"fare_per_person\", F.col(\"fare\") / F.col(\"passengers\"))",
        "check": "test(\"Compute fare per passenger\", lambda: [row[\"fare_per_person\"] for row in result.collect()] == [6.25, 10.0, 18.0], \"Per-person fares are 6.25, 10.0 and 18.0.\")",
        "expected": "Per-person fares are 6.25, 10.0 and 18.0.",
        "reassurance": "The arithmetic is verified. Showing it next completes the exercise."
      },
      {
        "title": "Inspect the transformed table",
        "instruction": "Display `result` as a table. Check that the filtered rows and their new `fare_per_person` values appear together, then run the chapter verification.",
        "code": "result.show()",
        "check": "",
        "expected": "Three rows with the new fare_per_person column.",
        "reassurance": "The full checks verify both transformations together."
      }
    ]
  },
  "db-sql": {
    "setup": "from pyspark.sql import SparkSession\n\nspark = SparkSession.builder.getOrCreate()\n\ntrips = spark.createDataFrame([\n    (\"London\", \"Soho\", 12.5, \"completed\"),\n    (\"London\", \"Soho\", 18.0, \"completed\"),\n    (\"London\", \"Soho\", 9.0, \"cancelled\"),\n    (\"London\", \"Camden\", 22.0, \"completed\"),\n    (\"London\", \"Camden\", 8.0, \"completed\"),\n    (\"London\", \"Camden\", 15.0, \"completed\"),\n    (\"London\", \"Brixton\", 30.0, \"completed\"),\n    (\"Paris\", \"Marais\", 14.0, \"completed\"),\n], \"city string, zone string, fare double, status string\")",
    "steps": [
      {
        "title": "Register a SQL view",
        "instruction": "Make the available `trips` DataFrame accessible to Spark SQL as a temporary view named `trips`. Register the rows as they are, including completed and cancelled trips.",
        "code": "trips.createOrReplaceTempView(\"trips\")",
        "check": "test(\"Register a SQL view\", lambda: spark.sql(\"SELECT * FROM trips\").count() == 8, \"The trips view contains eight rows.\")",
        "expected": "The trips view contains eight rows.",
        "reassurance": "The view is registered. Now build a parameterized query in small pieces."
      },
      {
        "title": "Group completed city trips",
        "instruction": "Build a SQL query string named `query` for the `trips` view. Use named parameter `city` to select only that city's completed trips, then group by `zone`. Produce columns `zone`, `n_trips` for the count and `avg_fare` for the average fare rounded to two decimals. Bind city as a value rather than inserting it into SQL text.",
        "code": "query = \"SELECT zone, COUNT(*) AS n_trips, ROUND(AVG(fare), 2) AS avg_fare FROM trips WHERE city = :city AND status = 'completed' GROUP BY zone\"",
        "check": "test(\"Group completed city trips\", lambda: sorted(tuple(row) for row in spark.sql(query, args={\"city\": \"London\"}).collect()) == [(\"Brixton\", 1, 30.0), (\"Camden\", 3, 15.0), (\"Soho\", 2, 15.25)], \"London groups are Brixton 1, Camden 3, Soho 2; cancelled trips do not count.\")",
        "expected": "London groups are Brixton 1, Camden 3, Soho 2; cancelled trips do not count.",
        "reassurance": "The row filter and grouping are correct. The group threshold belongs after GROUP BY."
      },
      {
        "title": "Filter groups with HAVING",
        "instruction": "Extend `query` with a group threshold using named parameter `min_trips`. Include zones whose completed-trip count is at least that value; apply this after grouping, keeping the city parameter binding.",
        "code": "query += \" HAVING COUNT(*) >= :min_trips\"",
        "check": "test(\"Filter groups with HAVING\", lambda: spark.sql(query, args={\"city\": \"London\", \"min_trips\": 3}).collect()[0][\"zone\"] == \"Camden\", \"With minimum 3, only Camden remains.\")",
        "expected": "With minimum 3, only Camden remains.",
        "reassurance": "The threshold acts on groups. Next make the result order deterministic."
      },
      {
        "title": "Order the report",
        "instruction": "Give `query` a deterministic order: busiest zones first by `n_trips`, with zone names ascending when counts tie.",
        "code": "query += \" ORDER BY n_trips DESC, zone\"",
        "check": "test(\"Order the report\", lambda: [tuple(row) for row in spark.sql(query, args={\"city\": \"London\", \"min_trips\": 2}).collect()] == [(\"Camden\", 3, 15.0), (\"Soho\", 2, 15.25)], \"Camden comes before Soho.\")",
        "expected": "Camden comes before Soho.",
        "reassurance": "The query produces the expected report. The wrapper will use each caller’s DataFrame and arguments."
      },
      {
        "title": "Expose the report function",
        "instruction": "Define `zone_report(spark, trips, city, min_trips)` to register the DataFrame argument as view `trips` and return the query result with both named parameters bound through SQL arguments. Respect the caller's data and threshold. Quoted city names must remain literal values, and no matching zones should produce an empty result.",
        "code": "def zone_report(spark, trips, city, min_trips):\n    trips.createOrReplaceTempView(\"trips\")\n    return spark.sql(query, args={\"city\": city, \"min_trips\": min_trips})",
        "check": "",
        "expected": "London reports two zones at minimum 2; quoted city names remain values.",
        "reassurance": "The complete checks cover quoted names, injection attempts, ties and empty results.",
        "startFrom": [
          0
        ]
      }
    ]
  },
  "db-delta": {
    "setup": "from pyspark.sql import SparkSession\nimport pyspark.sql.functions as F\n\nspark = SparkSession.builder.getOrCreate()\n\ngood = spark.createDataFrame([(1, \"draft\"), (2, \"draft\")], [\"id\", \"status\"])\ngood.write.format(\"delta\").mode(\"overwrite\").saveAsTable(\"main.demo.docs\")    # version 0\n\napproved = spark.createDataFrame([(1, \"approved\"), (2, \"approved\")], [\"id\", \"status\"])\napproved.write.format(\"delta\").mode(\"overwrite\").saveAsTable(\"main.demo.docs\")  # version 1\n\nbad = spark.createDataFrame([(1, \"DELETED\"), (2, \"DELETED\")], [\"id\", \"status\"])\nbad.write.format(\"delta\").mode(\"overwrite\").saveAsTable(\"main.demo.docs\")     # version 2: oops\n\nspark.sql(\"DESCRIBE HISTORY main.demo.docs\").show()",
    "steps": [
      {
        "title": "Ask for version 1",
        "instruction": "Build a reader named `reader` from the session's `read` property and give it the `versionAsOf` option set to `1`. Nothing is read yet.",
        "code": "reader = spark.read.option(\"versionAsOf\", 1)",
        "check": "test(\"Ask for version 1\", lambda: reader._opts == {\"versionAsOf\": 1}, \"reader is configured for version 1.\")",
        "expected": "reader is configured for version 1.",
        "reassurance": "A reader collects options first; the table name comes last."
      },
      {
        "title": "Read the approved snapshot",
        "instruction": "Use `reader` to read the Delta table `main.demo.docs` into `recovered` with the reader's `table` method. The live table keeps its later contents.",
        "code": "recovered = reader.table(\"main.demo.docs\")",
        "check": "test(\"Read the approved snapshot\", lambda: [row[\"status\"] for row in recovered.collect()] == [\"approved\", \"approved\"], \"Both recovered statuses are approved.\")",
        "expected": "Both recovered statuses are approved.",
        "reassurance": "Version 1 contains the approvals. The live table still contains the later deleted statuses."
      },
      {
        "title": "Generalize the historical read",
        "instruction": "Define `recover_table(name, version)` to return a historical DataFrame for the table and version arguments using the available Spark session. It must work for different tables and versions without restoring or writing to the live table.",
        "code": "def recover_table(name, version):\n    return spark.read.option(\"versionAsOf\", version).table(name)",
        "check": "test(\"Generalize the historical read\", lambda: [row[\"status\"] for row in recover_table(\"main.demo.docs\", 0).collect()] == [\"draft\", \"draft\"], \"Requesting version 0 returns draft rows.\")",
        "expected": "Requesting version 0 returns draft rows.",
        "reassurance": "The requested version changes the result correctly. The final check also changes the table name."
      },
      {
        "title": "Count the damage in the live table",
        "instruction": "Create `damage`: the number of rows in the live `main.demo.docs` table whose `status` is `DELETED`. Read the current table (no version option) and count the matching rows with Spark column operations. Print the count.",
        "code": "damage = spark.table(\"main.demo.docs\").filter(F.col(\"status\") == \"DELETED\").count()\nprint(\"damaged rows:\", damage)",
        "check": "test(\"Count the damage in the live table\", lambda: damage == 2, \"Both live rows are marked DELETED, so damage is 2.\")",
        "expected": "Both live rows are marked DELETED, so damage is 2.",
        "reassurance": "You measured the damage without touching the table. Recovery comes next."
      },
      {
        "title": "Use the recovery helper",
        "instruction": "Use your recovery helper for `main.demo.docs` at version `1`, storing the snapshot in `recovered`, and display it. The chapter verification also checks that both live tables remain unchanged.",
        "code": "recovered = recover_table(\"main.demo.docs\", 1)\nrecovered.show()",
        "check": "",
        "expected": "The recovered table shows approved rows.",
        "reassurance": "The full checks confirm historical reads leave both live tables untouched."
      }
    ]
  },
  "db-service-metrics": {
    "setup": "from pyspark.sql import SparkSession\nimport pyspark.sql.functions as F\n\nspark = SparkSession.builder.getOrCreate()\nSCHEMA = \"region string, user_id string, latency_ms double\"\nevents = spark.createDataFrame([\n    (\"EU\", \"u1\", 100.0),\n    (\"US\", \"u2\", 70.0),\n    (\"EU\", \"u1\", 140.0),\n    (\"EU\", \"u3\", None),\n    (\"US\", None, 90.0),\n], SCHEMA)",
    "steps": [
      {
        "title": "Build a request counter",
        "instruction": "Create `requests`: an aggregate expression that counts every row (`F.count` with `\"*\"`), named `requests` with `alias`.",
        "code": "requests = F.count(\"*\").alias(\"requests\")",
        "check": "test(\"Build a request counter\", lambda: events.groupBy(\"region\").agg(requests).columns == [\"region\", \"requests\"], \"requests is a counting expression named requests.\")",
        "expected": "requests is a counting expression named requests.",
        "reassurance": "Counting \"*\" counts rows, so a missing latency still counts as a request."
      },
      {
        "title": "Count requests per region",
        "instruction": "Group `events` by `region` into `grouped` with `groupBy`, then apply `requests` with the grouped data's `agg` method to make `summary`.",
        "code": "grouped = events.groupBy(\"region\")\nsummary = grouped.agg(requests)",
        "check": "test(\"Count requests per region\", lambda: {row[\"region\"]: row[\"requests\"] for row in summary.collect()} == {\"EU\": 3, \"US\": 2}, \"EU has 3 requests; US has 2.\")",
        "expected": "EU has 3 requests; US has 2.",
        "reassurance": ""
      },
      {
        "title": "Count measured latencies",
        "instruction": "Create `measured`: a count of non-null `latency_ms` values named `measured`. Rebuild `summary` from `grouped` with both `requests` and `measured`.",
        "code": "measured = F.count(\"latency_ms\").alias(\"measured\")\nsummary = grouped.agg(requests, measured)",
        "check": "test(\"Count measured latencies\", lambda: {row[\"region\"]: row[\"measured\"] for row in summary.collect()} == {\"EU\": 2, \"US\": 2}, \"Both regions have 2 measured latencies.\")",
        "expected": "Both regions have 2 measured latencies.",
        "reassurance": "Counting a column skips its nulls, so measured can be smaller than requests."
      },
      {
        "title": "Count users and average latency",
        "instruction": "Create `users` (distinct non-null `user_id` values, via `F.countDistinct`) and `avg_latency` (the mean `latency_ms`, via `F.avg`), named `users` and `avg_latency_ms`.",
        "code": "users = F.countDistinct(\"user_id\").alias(\"users\")\navg_latency = F.avg(\"latency_ms\").alias(\"avg_latency_ms\")",
        "check": "test(\"Count users and average latency\", lambda: {row[\"region\"]: (row[\"users\"], row[\"avg_latency_ms\"]) for row in grouped.agg(users, avg_latency).collect()} == {\"EU\": (2, 120.0), \"US\": (1, 80.0)}, \"EU: 2 users, 120.0 ms. US: 1 user, 80.0 ms.\")",
        "expected": "EU: 2 users, 120.0 ms. US: 1 user, 80.0 ms.",
        "reassurance": "Both functions ignore nulls: the missing user and the missing latency are skipped."
      },
      {
        "title": "Round the average",
        "instruction": "Redefine `avg_latency` so the average is rounded to one decimal with `F.round`, still named `avg_latency_ms`. Rebuild `summary` from `grouped` with all four expressions in the order requests, measured, users, avg_latency.",
        "code": "avg_latency = F.round(F.avg(\"latency_ms\"), 1).alias(\"avg_latency_ms\")\nsummary = grouped.agg(requests, measured, users, avg_latency)",
        "check": "test(\"Round the average\", lambda: summary.columns == [\"region\", \"requests\", \"measured\", \"users\", \"avg_latency_ms\"], \"summary has region, requests, measured, users, avg_latency_ms.\")",
        "expected": "summary has region, requests, measured, users, avg_latency_ms.",
        "reassurance": "Rounding wraps the aggregate, so name the outer expression."
      },
      {
        "title": "Sort and wrap in a function",
        "instruction": "Define `service_metrics(events)`: inside it, repeat your lines from `grouped` through `summary` for its `events` argument, then return `summary` sorted by region with `orderBy`.",
        "code": "def service_metrics(events):\n    grouped = events.groupBy(\"region\")\n    requests = F.count(\"*\").alias(\"requests\")\n    measured = F.count(\"latency_ms\").alias(\"measured\")\n    users = F.countDistinct(\"user_id\").alias(\"users\")\n    avg_latency = F.round(F.avg(\"latency_ms\"), 1).alias(\"avg_latency_ms\")\n    summary = grouped.agg(requests, measured, users, avg_latency)\n    return summary.orderBy(\"region\")",
        "check": "test(\"Sort and wrap in a function\", lambda: [tuple(row) for row in service_metrics(events).collect()] == [(\"EU\", 3, 2, 2, 120.0), (\"US\", 2, 2, 1, 80.0)], \"EU: 3 requests, 2 measured, 2 users, 120.0 ms. US: 2, 2, 1, 80.0 ms.\")",
        "expected": "EU: 3 requests, 2 measured, 2 users, 120.0 ms. US: 2, 2, 1, 80.0 ms.",
        "reassurance": "The last check adds null-only groups and empty data.",
        "startFrom": [
          0,
          4
        ]
      },
      {
        "title": "Inspect the regional report",
        "instruction": "Display the regional report from your function for `events`. Compare its request counts, measured counts, distinct users and average latency before running the chapter verification.",
        "code": "service_metrics(events).show()",
        "check": "",
        "expected": "Two rows ordered EU, then US.",
        "reassurance": "The complete checks verify schemas, null handling and unchanged input."
      }
    ]
  },
  "db-incremental-events": {
    "setup": "from pyspark.sql import SparkSession\nimport pyspark.sql.functions as F\n\nspark = SparkSession.builder.getOrCreate()\nSCHEMA = \"event_id string, user_id string, action string\"\ncurrent = spark.createDataFrame([(\"e1\", \"u1\", \"signup\")], SCHEMA)\nbatch = spark.createDataFrame([\n    (\"e1\", \"u1\", \"changed\"),\n    (\"e2\", \"u2\", \"purchase\"),\n    (\"e2\", \"u2\", \"purchase\"),\n    (None, \"u3\", \"click\"),\n], SCHEMA)",
    "steps": [
      {
        "title": "Discard unusable event IDs",
        "instruction": "Create `valid` from the incoming `batch`, removing rows with null, empty or whitespace-only `event_id` values. Preserve the actual IDs and payloads of retained rows.",
        "code": "valid = batch.filter(F.col(\"event_id\").isNotNull() & (F.trim(F.col(\"event_id\")) != \"\"))",
        "check": "test(\"Discard unusable event IDs\", lambda: valid.count() == 3 and all(row[\"event_id\"] is not None for row in valid.collect()), \"Three batch rows remain.\")",
        "expected": "Three batch rows remain.",
        "reassurance": "The missing ID is removed. The duplicate e2 still needs to be collapsed."
      },
      {
        "title": "Deduplicate the batch",
        "instruction": "Deduplicate `valid` by `event_id`, keeping only one row for each ID in this batch. The comparison against stored events comes in the next checkpoint.",
        "code": "valid = valid.dropDuplicates([\"event_id\"])",
        "check": "test(\"Deduplicate the batch\", lambda: valid.count() == 2, \"The valid batch has two distinct IDs.\")",
        "expected": "The valid batch has two distinct IDs.",
        "reassurance": "Batch duplicates are removed. Existing IDs must still be excluded."
      },
      {
        "title": "Find only unseen IDs",
        "instruction": "Create `unseen` containing only rows from `valid` whose `event_id` does not already occur in `current`. Existing events must keep their stored payload even if the batch offers a different one.",
        "code": "unseen = valid.join(current.select(\"event_id\"), \"event_id\", \"left_anti\")",
        "check": "test(\"Find only unseen IDs\", lambda: [row[\"event_id\"] for row in unseen.collect()] == [\"e2\"], \"Only e2 is new.\")",
        "expected": "Only e2 is new.",
        "reassurance": "e1 will retain its stored payload. The append now has only genuinely new data."
      },
      {
        "title": "Append by column name",
        "instruction": "Create `combined` by appending `unseen` to `current`. Align columns by name and keep the schema order of `current`; preserve all original stored rows.",
        "code": "combined = current.unionByName(unseen)",
        "check": "test(\"Append by column name\", lambda: [(row[\"event_id\"], row[\"action\"]) for row in combined.collect()] == [(\"e1\", \"signup\"), (\"e2\", \"purchase\")], \"e1 stays signup; e2 appears once as purchase.\")",
        "expected": "e1 stays signup; e2 appears once as purchase.",
        "reassurance": "The sample append is correct. Wrap these same operations for replay and fresh inputs."
      },
      {
        "title": "Package the replay-safe append",
        "instruction": "Define `append_events(current, batch)` to apply the same validation, batch deduplication and existing-ID exclusion to its arguments, returning the combined DataFrame. Replaying a batch must add no further rows. Handle empty inputs and reordered columns, and leave both source frames unchanged.",
        "code": "def append_events(current, batch):\n    valid = batch.filter(F.col(\"event_id\").isNotNull() & (F.trim(F.col(\"event_id\")) != \"\")).dropDuplicates([\"event_id\"])\n    unseen = valid.join(current.select(\"event_id\"), \"event_id\", \"left_anti\")\n    return current.unionByName(unseen)",
        "check": "",
        "expected": "Replaying the batch leaves only e1 and e2, with the original e1 payload.",
        "reassurance": "The full check covers replay, reordered columns, blank IDs, empty inputs and unchanged sources.",
        "startFrom": [
          2
        ]
      }
    ]
  },
  "db-quarantine": {
    "setup": "from pyspark.sql import SparkSession\nimport pyspark.sql.functions as F\n\nspark = SparkSession.builder.getOrCreate()\nSCHEMA = \"order_id string, user string, amount string, country string\"\nCOUNTRIES = [\"DE\", \"FR\", \"GB\", \"GR\", \"US\"]\n\norders = spark.createDataFrame([\n    (\"o1\", \"u1\", \"19.99\", \"US\"),\n    (\"o2\", None, \"5.00\", \"GB\"),\n    (\"o3\", \"u3\", \"n/a\", \"DE\"),\n    (\"o4\", \"u4\", \"-4.50\", \"FR\"),\n    (\"o5\", \"u5\", \"12.00\", None),\n    (\"o6\", \"  \", \"oops\", \"XX\"),\n], SCHEMA)",
    "steps": [
      {
        "title": "Name missing users first",
        "instruction": "Build a Spark reason expression named `reason` for missing users. Null, empty and whitespace-only `user` values should receive `missing_user`; other rows should have no reason yet. This rule must take priority over later failures.",
        "code": "reason = F.when(F.col(\"user\").isNull() | (F.trim(F.col(\"user\")) == \"\"), \"missing_user\")",
        "check": "test(\"Name missing users first\", lambda: {row[\"order_id\"] for row in orders.withColumn(\"reason\", reason).filter(F.col(\"reason\").isNotNull()).collect()} == {\"o2\", \"o6\"}, \"o2 and o6 are marked missing_user.\")",
        "expected": "o2 and o6 are marked missing_user.",
        "reassurance": "The first rule identifies both missing forms. Later rules must preserve this priority."
      },
      {
        "title": "Add the numeric rule",
        "instruction": "Extend `reason` to label amounts that cannot be safely converted to double as `bad_amount`. Keep earlier `missing_user` reasons and allow valid negative numbers, since refunds are legitimate amounts.",
        "code": "reason = reason.when(F.col(\"amount\").try_cast(\"double\").isNull(), \"bad_amount\")",
        "check": "test(\"Add the numeric rule\", lambda: {row[\"order_id\"]: row[\"reason\"] for row in orders.withColumn(\"reason\", reason).filter(F.col(\"reason\").isNotNull()).collect()} == {\"o2\": \"missing_user\", \"o3\": \"bad_amount\", \"o6\": \"missing_user\"}, \"o3 is bad_amount; o6 keeps its first failure, missing_user.\")",
        "expected": "o3 is bad_amount; o6 keeps its first failure, missing_user.",
        "reassurance": "The numeric rule works and rule priority is intact. Refund amounts remain valid."
      },
      {
        "title": "Add the country rule",
        "instruction": "Extend `reason` so rows with a null `country` or a country outside `COUNTRIES` receive `unknown_country`. Membership is case-sensitive: lowercase `us` does not match `US`; preserve country text without normalizing it. Keep missing-user and bad-amount reasons first, and let rows passing every rule have a null reason.",
        "code": "reason = reason.when(F.col(\"country\").isNull() | ~F.col(\"country\").isin(COUNTRIES), \"unknown_country\")",
        "check": "test(\"Add the country rule\", lambda: {row[\"order_id\"]: row[\"reason\"] for row in orders.withColumn(\"reason\", reason).filter(F.col(\"reason\").isNotNull()).collect()} == {\"o2\": \"missing_user\", \"o3\": \"bad_amount\", \"o5\": \"unknown_country\", \"o6\": \"missing_user\"}, \"o5 is unknown_country; all earlier reasons are preserved.\")",
        "expected": "o5 is unknown_country; all earlier reasons are preserved.",
        "reassurance": "All three rules are verified on the sample. The function must rebuild them for its countries argument."
      },
      {
        "title": "Build reasons for any country list",
        "instruction": "Define `expectation_reason(countries)`: repeat your three `reason` lines inside it, use the `countries` argument instead of `COUNTRIES`, and return `reason`. An empty list permits no countries.",
        "code": "def expectation_reason(countries):\n    reason = F.when(F.col(\"user\").isNull() | (F.trim(F.col(\"user\")) == \"\"), \"missing_user\")\n    reason = reason.when(F.col(\"amount\").try_cast(\"double\").isNull(), \"bad_amount\")\n    reason = reason.when(F.col(\"country\").isNull() | ~F.col(\"country\").isin(countries), \"unknown_country\")\n    return reason",
        "check": "test(\"Build reasons for any country list\", lambda: orders.withColumn(\"reason\", expectation_reason([])).filter(F.col(\"reason\").isNull()).count() == 0, \"With no permitted countries, no row passes all rules.\")",
        "expected": "With no permitted countries, no row passes all rules.",
        "reassurance": "The country list is now an input.",
        "startFrom": [
          0,
          1
        ]
      },
      {
        "title": "Tag and quarantine rows",
        "instruction": "Add a `reason` column to `orders` from `expectation_reason(COUNTRIES)`, storing the result in `tagged`. Then keep the rows that have a reason in `quarantine`.",
        "code": "tagged = orders.withColumn(\"reason\", expectation_reason(COUNTRIES))\nquarantine = tagged.filter(F.col(\"reason\").isNotNull())",
        "check": "test(\"Tag and quarantine rows\", lambda: sorted(row[\"order_id\"] for row in quarantine.collect()) == [\"o2\", \"o3\", \"o5\", \"o6\"], \"quarantine holds o2, o3, o5 and o6, with their raw amount text.\")",
        "expected": "quarantine holds o2, o3, o5 and o6, with their raw amount text.",
        "reassurance": ""
      },
      {
        "title": "Clean the valid rows",
        "instruction": "Create `valid` from `tagged`: keep rows with no reason, remove the `reason` column with `drop`, and convert `amount` to double. Do it in one chain.",
        "code": "valid = tagged.filter(F.col(\"reason\").isNull()).drop(\"reason\").withColumn(\"amount\", F.col(\"amount\").try_cast(\"double\"))",
        "check": "test(\"Clean the valid rows\", lambda: valid.columns == [\"order_id\", \"user\", \"amount\", \"country\"] and dict(valid.dtypes)[\"amount\"] == \"double\" and valid.count() == 2, \"Two valid rows, no reason column, amount is double.\")",
        "expected": "Two valid rows, no reason column, amount is double.",
        "reassurance": ""
      },
      {
        "title": "Split valid and quarantined rows",
        "instruction": "Define `apply_expectations(df, countries)`: build `tagged` from `df` and `countries`, repeat your `valid` and `quarantine` lines, and return `valid, quarantine` in that order.",
        "code": "def apply_expectations(df, countries):\n    tagged = df.withColumn(\"reason\", expectation_reason(countries))\n    valid = tagged.filter(F.col(\"reason\").isNull()).drop(\"reason\").withColumn(\"amount\", F.col(\"amount\").try_cast(\"double\"))\n    quarantine = tagged.filter(F.col(\"reason\").isNotNull())\n    return valid, quarantine",
        "check": "test(\"Split valid and quarantined rows\", lambda: apply_expectations(orders, COUNTRIES)[0].count() == 2 and apply_expectations(orders, COUNTRIES)[1].count() == 4, \"Two valid rows and four quarantined rows.\")",
        "expected": "Two valid rows and four quarantined rows.",
        "reassurance": "The full checks inspect reasons, schemas and raw values.",
        "startFrom": [
          5
        ]
      },
      {
        "title": "Inspect both outputs",
        "instruction": "Use your function with `orders` and `COUNTRIES`, storing its outputs in `valid` and `quarantine`. Display both tables and inspect the accepted refund and the first-failure reasons before chapter verification.",
        "code": "valid, quarantine = apply_expectations(orders, COUNTRIES)\nvalid.show()\nquarantine.show()",
        "check": "",
        "expected": "Valid contains o1 and refund o4; quarantine contains o2, o3, o5, o6.",
        "reassurance": "The final checks add new data, empty inputs and proof that the source is unchanged."
      }
    ]
  },
  "db-medallion": {
    "setup": "from pyspark.sql import SparkSession\nimport pyspark.sql.functions as F\n\nspark = SparkSession.builder.getOrCreate()\n\nRAW = [\n    {\"order_id\": \"o1\", \"user\": \"u1\", \"amount\": \"19.99\", \"city\": \"NYC\"},\n    {\"order_id\": \"o2\", \"user\": \"u2\", \"amount\": \"5.00\",  \"city\": \"SF\"},\n    {\"order_id\": \"o2\", \"user\": \"u2\", \"amount\": \"5.00\",  \"city\": \"SF\"},    # duplicate\n    {\"order_id\": \"o3\", \"user\": None, \"amount\": \"7.50\",  \"city\": \"NYC\"},   # no user\n    {\"order_id\": \"o4\", \"user\": \"u3\", \"amount\": \"n/a\",   \"city\": \"SF\"},    # bad amount\n    {\"order_id\": \"o5\", \"user\": \"u4\", \"amount\": \"30.01\", \"city\": \"NYC\"},\n    {\"order_id\": \"o6\", \"user\": \"u5\", \"amount\": \"12.00\", \"city\": \"LA\"},\n]",
    "steps": [
      {
        "title": "Create bronze with an explicit schema",
        "instruction": "Define `bronze_frame(spark, raw_rows)` to create a DataFrame with string columns `order_id`, `user`, `amount`, `city`, in that order. Preserve all raw rows, including duplicates and invalid values. An empty batch must still have this schema.",
        "code": "def bronze_frame(spark, raw_rows):\n    return spark.createDataFrame(raw_rows, \"order_id string, user string, amount string, city string\")",
        "check": "test(\"Create bronze with an explicit schema\", lambda: bronze_frame(spark, RAW).count() == 7 and bronze_frame(spark, []).columns == [\"order_id\", \"user\", \"amount\", \"city\"], \"Seven raw rows; an empty batch still has all four columns.\")",
        "expected": "Seven raw rows; an empty batch still has all four columns.",
        "reassurance": "Bronze preserves the input and can handle an empty run. Next make writes safe to repeat."
      },
      {
        "title": "Build a Delta writer",
        "instruction": "Create `bronze` from `bronze_frame(spark, RAW)`. Then take its `write` property and set the format to `\"delta\"`, storing the writer in `writer`. Nothing is saved yet.",
        "code": "bronze = bronze_frame(spark, RAW)\nwriter = bronze.write.format(\"delta\")",
        "check": "test(\"Build a Delta writer\", lambda: writer._format == \"delta\" and bronze.count() == 7, \"writer is a Delta writer for the seven bronze rows.\")",
        "expected": "writer is a Delta writer for the seven bronze rows.",
        "reassurance": ""
      },
      {
        "title": "Save a Delta layer",
        "instruction": "Define `save_layer(df, name)` to write the frame as a Delta table under `name`, with `mode` set to `\"overwrite\"` so reruns replace the layer, and `saveAsTable` to save. No return value.",
        "code": "def save_layer(df, name):\n    df.write.format(\"delta\").mode(\"overwrite\").saveAsTable(name)",
        "check": "test(\"Save a Delta layer\", lambda: save_layer(bronze, \"main.shop.bronze\") is None and spark.table(\"main.shop.bronze\").count() == 7, \"The bronze table contains all seven raw rows.\")",
        "expected": "The bronze table contains all seven raw rows.",
        "reassurance": "Without overwrite, a second save to the same name raises an error."
      },
      {
        "title": "Keep rows with a user",
        "instruction": "Create `named` from `bronze`, keeping only rows whose `user` is not null and not empty after trimming.",
        "code": "named = bronze.filter(F.col(\"user\").isNotNull() & (F.trim(F.col(\"user\")) != \"\"))",
        "check": "test(\"Keep rows with a user\", lambda: sorted(row[\"order_id\"] for row in named.collect()) == [\"o1\", \"o2\", \"o2\", \"o4\", \"o5\", \"o6\"], \"Six rows remain; o3 (no user) is gone.\")",
        "expected": "Six rows remain; o3 (no user) is gone.",
        "reassurance": ""
      },
      {
        "title": "Convert and filter amounts",
        "instruction": "Create `typed` from `named` with `amount` safely converted to double, then `priced` from `typed` keeping only rows where the conversion worked.",
        "code": "typed = named.withColumn(\"amount\", F.col(\"amount\").try_cast(\"double\"))\npriced = typed.filter(F.col(\"amount\").isNotNull())",
        "check": "test(\"Convert and filter amounts\", lambda: priced.count() == 5 and dict(priced.dtypes)[\"amount\"] == \"double\", \"Five rows with double amounts; o4 (n/a) is gone.\")",
        "expected": "Five rows with double amounts; o4 (n/a) is gone.",
        "reassurance": "Negative numbers convert fine, so refunds stay."
      },
      {
        "title": "Clean silver rows",
        "instruction": "Define `silver_frame(bronze)`: repeat your `named`, `typed` and `priced` lines inside it and return `priced` with one row per `order_id`. Then store `silver_frame(bronze)` in `silver`.",
        "code": "def silver_frame(bronze):\n    named = bronze.filter(F.col(\"user\").isNotNull() & (F.trim(F.col(\"user\")) != \"\"))\n    typed = named.withColumn(\"amount\", F.col(\"amount\").try_cast(\"double\"))\n    priced = typed.filter(F.col(\"amount\").isNotNull())\n    return priced.dropDuplicates([\"order_id\"])\nsilver = silver_frame(bronze)",
        "check": "test(\"Clean silver rows\", lambda: silver.count() == 4 and dict(silver.dtypes)[\"amount\"] == \"double\", \"Four valid unique orders with double amounts.\")",
        "expected": "Four valid unique orders with double amounts.",
        "reassurance": "",
        "startFrom": [
          3,
          4
        ]
      },
      {
        "title": "Define the revenue column",
        "instruction": "Create `revenue`: the sum of `amount` with `F.sum`, rounded to two decimals and named `revenue`. It is a column expression, so nothing is computed until a frame uses it.",
        "code": "revenue = F.round(F.sum(\"amount\"), 2).alias(\"revenue\")",
        "check": "test(\"Define the revenue column\", lambda: silver.agg(revenue).collect()[0][\"revenue\"] == 67.0, \"Applied to all of silver, revenue totals 67.0.\")",
        "expected": "Applied to all of silver, revenue totals 67.0.",
        "reassurance": ""
      },
      {
        "title": "Total revenue per city",
        "instruction": "Create `orders` (row count named `orders`). Group `silver` by `city` and apply your `revenue` and `orders` into `totals`.",
        "code": "orders = F.count(\"*\").alias(\"orders\")\ntotals = silver.groupBy(\"city\").agg(revenue, orders)",
        "check": "test(\"Total revenue per city\", lambda: {row[\"city\"]: (row[\"revenue\"], row[\"orders\"]) for row in totals.collect()} == {\"NYC\": (50.0, 2), \"LA\": (12.0, 1), \"SF\": (5.0, 1)}, \"NYC 50.0 / 2 orders; LA 12.0 / 1; SF 5.0 / 1.\")",
        "expected": "NYC 50.0 / 2 orders; LA 12.0 / 1; SF 5.0 / 1.",
        "reassurance": ""
      },
      {
        "title": "Sort by revenue",
        "instruction": "Create `ranked` from `totals`, ordered by decreasing `revenue`. Use `F.desc` to mark the column as descending.",
        "code": "ranked = totals.orderBy(F.desc(\"revenue\"))",
        "check": "test(\"Sort by revenue\", lambda: [row[\"city\"] for row in ranked.collect()] == [\"NYC\", \"LA\", \"SF\"], \"ranked lists NYC, LA, SF.\")",
        "expected": "ranked lists NYC, LA, SF.",
        "reassurance": ""
      },
      {
        "title": "Aggregate gold revenue",
        "instruction": "Define `gold_frame(silver)`: repeat your `revenue`, `orders` and `totals` lines inside it and return `totals` ordered by decreasing revenue (`F.desc`) with `city` breaking ties. Then store `gold_frame(silver)` in `gold`.",
        "code": "def gold_frame(silver):\n    revenue = F.round(F.sum(\"amount\"), 2).alias(\"revenue\")\n    orders = F.count(\"*\").alias(\"orders\")\n    totals = silver.groupBy(\"city\").agg(revenue, orders)\n    return totals.orderBy(F.desc(\"revenue\"), \"city\")\ngold = gold_frame(silver)",
        "check": "test(\"Aggregate gold revenue\", lambda: [tuple(row) for row in gold.collect()] == [(\"NYC\", 50.0, 2), (\"LA\", 12.0, 1), (\"SF\", 5.0, 1)], \"NYC 50.0 / 2 orders; LA 12.0 / 1; SF 5.0 / 1.\")",
        "expected": "NYC 50.0 / 2 orders; LA 12.0 / 1; SF 5.0 / 1.",
        "reassurance": "",
        "startFrom": [
          6,
          7
        ]
      },
      {
        "title": "Save all three layers",
        "instruction": "Use `save_layer` to save `bronze` to `main.shop.bronze`, `silver` to `main.shop.silver` and `gold` to `main.shop.gold_revenue`.",
        "code": "save_layer(bronze, \"main.shop.bronze\")\nsave_layer(silver, \"main.shop.silver\")\nsave_layer(gold, \"main.shop.gold_revenue\")",
        "check": "test(\"Save all three layers\", lambda: spark.table(\"main.shop.silver\").count() == 4 and spark.table(\"main.shop.gold_revenue\").count() == 3, \"Silver has 4 rows and gold has 3.\")",
        "expected": "Silver has 4 rows and gold has 3.",
        "reassurance": ""
      },
      {
        "title": "Run and save all three stages",
        "instruction": "Define `run_pipeline(spark, raw_rows)`: build `bronze` from `raw_rows`, then repeat your stage and save lines in order and return `gold`. Each run replaces all three tables.",
        "code": "def run_pipeline(spark, raw_rows):\n    bronze = bronze_frame(spark, raw_rows)\n    save_layer(bronze, \"main.shop.bronze\")\n    silver = silver_frame(bronze)\n    save_layer(silver, \"main.shop.silver\")\n    gold = gold_frame(silver)\n    save_layer(gold, \"main.shop.gold_revenue\")\n    return gold",
        "check": "",
        "expected": "Three Delta tables are saved and the gold DataFrame is returned.",
        "reassurance": "The complete boss checks change the data, rerun the pipeline and finish with an empty batch.",
        "startFrom": [
          10
        ]
      }
    ]
  }
}
