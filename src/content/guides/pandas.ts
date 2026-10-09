import type { CodingGuide } from '../guided'

export const PANDAS_GUIDES: Record<string, CodingGuide> = {
  "pd-first-table": {
    "setup": "import pandas as pd\nrequests = pd.DataFrame({\"endpoint\": [\"/chat\", \"/embed\", \"/chat\", \"/search\", \"/chat\"], \"latency_ms\": [140.0, 35.0, 210.0, 90.0, 125.0], \"status\": [200, 200, 500, 200, 200]})",
    "steps": [
      {
        "title": "Preview two rows",
        "instruction": "Print a preview of only the first two rows of `requests`. Keep the complete table available for later calculations.",
        "code": "print(requests.head(2))",
        "check": "test('Preview two rows', lambda: \"/embed\" in __stdout__ and \"/search\" not in __stdout__ and len(requests) == 5, 'The preview includes /embed and does not include /search; the table still has five rows.')",
        "expected": "The preview includes /embed and does not include /search; the table still has five rows.",
        "reassurance": "The preview is limited as intended, and no requests were removed."
      },
      {
        "title": "Pick the latency column",
        "instruction": "Select the `latency_ms` column from `requests` as a pandas Series named `latencies`, preserving its row order and the source table.",
        "code": "latencies = requests[\"latency_ms\"]",
        "check": "test('Pick the latency column', lambda: isinstance(latencies, pd.Series) and latencies.tolist() == [140, 35, 210, 90, 125], 'latencies contains [140, 35, 210, 90, 125].')",
        "expected": "latencies contains [140, 35, 210, 90, 125].",
        "reassurance": "You selected exactly the measurements you need for the average."
      },
      {
        "title": "Compute the average",
        "instruction": "Calculate the arithmetic average of `latencies` and store the result as `average`.",
        "code": "average = latencies.mean()",
        "check": "test('Compute the average', lambda: average == 120.0, 'average is 120.0 milliseconds.')",
        "expected": "average is 120.0 milliseconds.",
        "reassurance": "The calculation is right. The final step prints the answer for the complete check."
      },
      {
        "title": "Print the answer",
        "instruction": "Print the value of `average` after the preview, then run Check.",
        "code": "print(average)",
        "check": "",
        "expected": "The output includes 120.0 after the two-row preview.",
        "reassurance": "The complete check confirms the selected column, mean, preview and unchanged table."
      }
    ]
  },
  "pd-frames": {
    "setup": "import pandas as pd\nruns = pd.DataFrame({\"model\": [\"tiny\", \"small\", \"medium\", \"large\"], \"accuracy\": [0.71, 0.84, 0.88, 0.93], \"cost_usd\": [0.0, 0.8, 2.4, 3.1]})",
    "steps": [
      {
        "title": "Mark accurate models",
        "instruction": "Create a boolean Series named `mask` indicating which rows of `runs` have `accuracy` strictly greater than 0.85.",
        "code": "mask = runs[\"accuracy\"] > 0.85",
        "check": "test('Mark accurate models', lambda: mask.tolist() == [False, False, True, True], 'mask is [False, False, True, True].')",
        "expected": "mask is [False, False, True, True].",
        "reassurance": "The mask selects medium and large. The original table still contains all four rows."
      },
      {
        "title": "Keep the marked rows",
        "instruction": "Create `strong` containing only the rows of `runs` selected by `mask`. Retain all original columns and leave `runs` unchanged.",
        "code": "strong = runs[mask]",
        "check": "",
        "expected": "strong contains medium and large, with model, accuracy and cost_usd columns.",
        "reassurance": "The complete check verifies the selected models and retained columns."
      }
    ]
  },
  "pd-clean": {
    "setup": "import pandas as pd\nlogs = pd.DataFrame({\"endpoint\": [\"/chat\", \"/chat\", \"/embed\", \"/embed\", \"/chat\"], \"latency_ms\": [\"120\", \"95\", None, \"60\", \"oops\"]})",
    "steps": [
      {
        "title": "Convert text into numbers",
        "instruction": "Convert the `latency_ms` column in `logs` into numeric values. Replace invalid text and missing entries with missing numeric values rather than raising a parsing error.",
        "code": "logs[\"latency_ms\"] = pd.to_numeric(logs[\"latency_ms\"], errors=\"coerce\")",
        "check": "test('Convert text into numbers', lambda: logs[\"latency_ms\"].iloc[:2].tolist() == [120, 95] and logs[\"latency_ms\"].isna().tolist() == [False, False, True, False, True], '120 and 95 are numeric; None and oops become missing values.')",
        "expected": "120 and 95 are numeric; None and oops become missing values.",
        "reassurance": "The troublesome entries are now marked as missing instead of being treated as text."
      },
      {
        "title": "Count what could not be parsed",
        "instruction": "Create `lost`: how many `latency_ms` values in `logs` are now missing. Print it with a short label.",
        "code": "lost = logs[\"latency_ms\"].isna().sum()\nprint(\"unparseable:\", lost)",
        "check": "test('Count what could not be parsed', lambda: int(lost) == 2, 'The None and the oops are the two lost values.')",
        "expected": "The None and the oops are the two lost values.",
        "reassurance": "You know exactly how much data the cleaning discarded. Now average what is left."
      },
      {
        "title": "Average each endpoint",
        "instruction": "Create a Series named `means` with the average `latency_ms` for each `endpoint` in `logs`. Missing measurements must not contribute to the mean.",
        "code": "means = logs.groupby(\"endpoint\")[\"latency_ms\"].mean()",
        "check": "test('Average each endpoint', lambda: means.to_dict() == {\"/chat\": 107.5, \"/embed\": 60.0}, 'The means are /chat → 107.5 and /embed → 60.0.')",
        "expected": "The means are /chat → 107.5 and /embed → 60.0.",
        "reassurance": "Both averages are right; the bad values were excluded from their denominators."
      },
      {
        "title": "Inspect the cleaned summary",
        "instruction": "Print the endpoint averages in `means`, then run Check.",
        "code": "print(means)",
        "check": "",
        "expected": "The output shows 107.5 for /chat and 60.0 for /embed.",
        "reassurance": "The complete check confirms both endpoint averages."
      }
    ]
  },
  "pd-pipeline": {
    "setup": "",
    "steps": [
      {
        "title": "Import pandas",
        "instruction": "Import the pandas library with the alias `pd`.",
        "code": "import pandas as pd",
        "check": "test('Import pandas', lambda: pd.Series([1, 2]).sum() == 3, 'A tiny Series sums to 3.')",
        "expected": "A tiny Series sums to 3.",
        "reassurance": "The table tools are available. Next create the orders they will summarize."
      },
      {
        "title": "Create the order rows",
        "instruction": "Create a DataFrame named `orders` with six rows in this order. The `user_id` values are 1, 1, 2, 3, 3, 3, and the corresponding `amount` values are 20, 30, 15, 5, 10, 25.",
        "code": "orders = pd.DataFrame({\"user_id\": [1, 1, 2, 3, 3, 3], \"amount\": [20, 30, 15, 5, 10, 25]})",
        "check": "test('Create the order rows', lambda: len(orders) == 6 and orders[\"amount\"].sum() == 105, 'There are six orders with total amount 105.')",
        "expected": "There are six orders with total amount 105.",
        "reassurance": "The raw order amounts are ready to aggregate."
      },
      {
        "title": "Create the user lookup",
        "instruction": "Create a DataFrame named `users` with `user_id` values 1, 2, 3 and corresponding `plan` values `pro`, `free`, `free`. Each user should appear once.",
        "code": "users = pd.DataFrame({\"user_id\": [1, 2, 3], \"plan\": [\"pro\", \"free\", \"free\"]})",
        "check": "test('Create the user lookup', lambda: users[\"user_id\"].is_unique and users[\"plan\"].tolist() == [\"pro\", \"free\", \"free\"], 'User 1 is pro; users 2 and 3 are free.')",
        "expected": "User 1 is pro; users 2 and 3 are free.",
        "reassurance": "The lookup is ready. You can now reduce the orders to one row per user."
      },
      {
        "title": "Total each user’s orders",
        "instruction": "Create `totals` with one row per `user_id`, summing its `amount` values from `orders`. Keep `user_id` as a normal column alongside `amount`.",
        "code": "totals = orders.groupby(\"user_id\", as_index=False)[\"amount\"].sum()",
        "check": "test('Total each user’s orders', lambda: totals.to_dict(\"list\") == {\"user_id\": [1, 2, 3], \"amount\": [50, 15, 40]}, 'User totals are 50, 15 and 40.')",
        "expected": "User totals are 50, 15 and 40.",
        "reassurance": "Each order contributed to exactly one user total."
      },
      {
        "title": "Attach the plans",
        "instruction": "Create `report` by joining `totals` to `users` on `user_id`. Include the columns `user_id`, `amount`, `plan` in that order, with the matching plan for each user.",
        "code": "report = totals.merge(users, on=\"user_id\")",
        "check": "test('Attach the plans', lambda: list(report.columns) == [\"user_id\", \"amount\", \"plan\"] and report[\"plan\"].tolist() == [\"pro\", \"free\", \"free\"], 'report has user_id, amount and plan for all three users.')",
        "expected": "report has user_id, amount and plan for all three users.",
        "reassurance": "The join added the right plans. One sort will put the biggest spender first."
      },
      {
        "title": "Sort by spend",
        "instruction": "Update `report` so rows are ordered from highest to lowest `amount`. Preserve each user’s total and plan.",
        "code": "report = report.sort_values(\"amount\", ascending=False)",
        "check": "test('Sort by spend', lambda: report[\"user_id\"].tolist() == [1, 3, 2] and report[\"amount\"].tolist() == [50, 40, 15], 'The user order is [1, 3, 2], with amounts [50, 40, 15].')",
        "expected": "The user order is [1, 3, 2], with amounts [50, 40, 15].",
        "reassurance": "The order is correct. Print the finished report for the complete check."
      },
      {
        "title": "Print the report",
        "instruction": "Print the finished `report`, then run Check.",
        "code": "print(report)",
        "check": "",
        "expected": "The largest spender, user 1 with 50, appears first.",
        "reassurance": "The complete check verifies the final columns, ordering and totals."
      }
    ]
  },
  "pd-validated-joins": {
    "setup": "import pandas as pd\nevents = pd.DataFrame({\"event_id\": [7, 8, 9], \"user_id\": [2, 1, 3], \"amount\": [5, 20, 10]})\nusers = pd.DataFrame({\"user_id\": [1, 2], \"plan\": [\"pro\", \"free\"]})",
    "steps": [
      {
        "title": "Join with relationship validation",
        "instruction": "Create `joined` by attaching each user’s plan from `users` to `events` on `user_id`. Keep every event in its original order, leaving unmatched plans missing. Validate the many-to-one relationship so duplicate lookup keys are rejected instead of multiplying events; preserve both input tables.",
        "code": "joined = events.merge(users, on=\"user_id\", how=\"left\", sort=False, validate=\"many_to_one\")",
        "check": "test('Join with relationship validation', lambda: joined[\"event_id\"].tolist() == [7, 8, 9] and joined[\"plan\"].iloc[:2].tolist() == [\"free\", \"pro\"] and pd.isna(joined[\"plan\"].iloc[2]), 'All three events remain in order; the missing user has a missing plan.')",
        "expected": "All three events remain in order; the missing user has a missing plan.",
        "reassurance": "The example join preserved the event rows. Validation will protect new inputs from duplicate lookup keys."
      },
      {
        "title": "Give missing plans a name",
        "instruction": "Create a new DataFrame named `enriched` from `joined`, replacing missing `plan` values with the string `unknown`. Preserve the original `events` table.",
        "code": "enriched = joined.assign(plan=joined[\"plan\"].fillna(\"unknown\"))",
        "check": "test('Give missing plans a name', lambda: enriched[\"plan\"].tolist() == [\"free\", \"pro\", \"unknown\"] and list(events.columns) == [\"event_id\", \"user_id\", \"amount\"], 'The plans are [\"free\", \"pro\", \"unknown\"]; events has no added column.')",
        "expected": "The plans are [\"free\", \"pro\", \"unknown\"]; events has no added column.",
        "reassurance": "The fallback is correct and the original events are intact."
      },
      {
        "title": "Make the safe join reusable",
        "instruction": "Implement `attach_plans(events, users)`, with parameters in that order, returning an enriched DataFrame. Keep every event and its order, attach plans by `user_id`, and use `unknown` for unmatched plans. Reject duplicate user lookup keys through many-to-one validation. Handle empty tables and preserve both inputs.",
        "code": "def attach_plans(events, users):\n    \"\"\"Attach exactly one plan to every event, preserving event rows.\"\"\"\n    joined = events.merge(users, on=\"user_id\", how=\"left\", sort=False, validate=\"many_to_one\")\n    return joined.assign(plan=joined[\"plan\"].fillna(\"unknown\"))",
        "check": "",
        "expected": "The full check covers new users, repeated events, duplicate lookup rejection, empty tables and unchanged inputs.",
        "reassurance": "The complete check verifies both normal enrichment and the required duplicate-key protection."
      }
    ]
  },
  "pd-daily-pivot": {
    "setup": "import pandas as pd\nlogs = pd.DataFrame({\"at\": [\"2026-03-01T09:00:00Z\", \"2026-03-01T09:05:00Z\", \"2026-03-01T17:30:00Z\", \"2026-03-03T08:00:00Z\", \"2026-03-03T08:01:00Z\"], \"endpoint\": [\"/chat\", \"/embed\", \"/chat\", \"/chat\", \"/embed\"], \"status\": [500, 200, 503, 200, 502]})\nstart, end = \"2026-03-01\", \"2026-03-03\"",
    "steps": [
      {
        "title": "Create the complete calendar",
        "instruction": "Create a DatetimeIndex named `days` covering every day from `start` through `end`, inclusive. Use UTC midnights and give the index the name `day`, including dates with no logs.",
        "code": "days = pd.date_range(start, end, freq=\"D\", tz=\"UTC\", name=\"day\")",
        "check": "test('Create the complete calendar', lambda: days.strftime(\"%Y-%m-%d\").tolist() == [\"2026-03-01\", \"2026-03-02\", \"2026-03-03\"] and days.name == \"day\", 'days contains March 1, March 2 and March 3 as UTC midnights.')",
        "expected": "days contains March 1, March 2 and March 3 as UTC midnights.",
        "reassurance": "The quiet middle day has a place in the result before any log is counted."
      },
      {
        "title": "Assign UTC days to requests",
        "instruction": "Create a Series named `day` containing the UTC midnight date of each timestamp in the `at` column of `logs`. Interpret timezone offsets before deciding which UTC date a request belongs to.",
        "code": "day = pd.to_datetime(logs[\"at\"], utc=True).dt.floor(\"D\")",
        "check": "test('Assign UTC days to requests', lambda: day.dt.strftime(\"%Y-%m-%d\").tolist() == [\"2026-03-01\"] * 3 + [\"2026-03-03\"] * 2, 'Three requests fall on March 1 and two on March 3.')",
        "expected": "Three requests fall on March 1 and two on March 3.",
        "reassurance": "The grouping dates use one timezone consistently."
      },
      {
        "title": "Keep the requested window",
        "instruction": "Create `window` from `logs` with two added columns: `day` from the parsed dates, and boolean `errors` for status codes of at least 500. Keep only requests whose UTC day lies within `days`, including both boundaries. Preserve `logs`.",
        "code": "window = logs.assign(day=day, errors=logs[\"status\"] >= 500)[day.between(days[0], days[-1])]",
        "check": "test('Keep the requested window', lambda: len(window) == 5 and window[\"errors\"].tolist() == [True, False, True, False, True] and \"day\" not in logs.columns, 'There are five in-window requests, with error flags [True, False, True, False, True].')",
        "expected": "There are five in-window requests, with error flags [True, False, True, False, True].",
        "reassurance": "Healthy requests remain so their endpoints can still receive zero-count columns."
      },
      {
        "title": "Pivot into a wide table",
        "instruction": "Create `table` with observed `day` values as rows, alphabetically sorted `endpoint` values as columns, and the count of True `errors` in each cell of `window`. Fill absent combinations with zero and keep endpoints that only have healthy requests.",
        "code": "table = window.pivot_table(index=\"day\", columns=\"endpoint\", values=\"errors\", aggfunc=\"sum\", fill_value=0)",
        "check": "test('Pivot into a wide table', lambda: list(table.columns) == [\"/chat\", \"/embed\"] and table.values.tolist() == [[2, 0], [0, 1]], 'Two observed days produce rows [2, 0] and [0, 1].')",
        "expected": "Two observed days produce rows [2, 0] and [0, 1].",
        "reassurance": "The counts are right. The quiet day still needs to be inserted from the calendar."
      },
      {
        "title": "Restore quiet days",
        "instruction": "Create `daily` by aligning `table` to every date in `days`, filling quiet dates with zeros. Store the counts as integers.",
        "code": "daily = table.reindex(days, fill_value=0).astype(int)",
        "check": "test('Restore quiet days', lambda: daily.values.tolist() == [[2, 0], [0, 0], [0, 1]] and all(pd.api.types.is_integer_dtype(t) for t in daily.dtypes), 'The three daily rows are [2, 0], [0, 0] and [0, 1], all integers.')",
        "expected": "The three daily rows are [2, 0], [0, 0] and [0, 1], all integers.",
        "reassurance": "The missing day now appears explicitly with zeros."
      },
      {
        "title": "Build daily_errors",
        "instruction": "Implement `daily_errors(logs, start, end)`, with parameters in that order, returning daily server-error counts by endpoint with columns sorted alphabetically. Include every UTC day in the inclusive date range, even quiet days, and endpoints with only healthy in-window requests. Exclude outside-window traffic, return integer counts and name the date index `day`. Reject reversed dates with `ValueError`, handle an empty window and preserve `logs`.",
        "code": "def daily_errors(logs, start, end):\n    days = pd.date_range(start, end, freq=\"D\", tz=\"UTC\", name=\"day\")\n    if days.empty: raise ValueError(\"end must not be before start\")\n    day = pd.to_datetime(logs[\"at\"], utc=True).dt.floor(\"D\")\n    window = logs.assign(day=day, errors=logs[\"status\"] >= 500)[day.between(days[0], days[-1])]\n    table = window.pivot_table(index=\"day\", columns=\"endpoint\", values=\"errors\", aggfunc=\"sum\", fill_value=0)\n    return table.reindex(days, fill_value=0).astype(int)",
        "check": "",
        "expected": "The complete check covers UTC offsets, healthy endpoints, outside-window traffic, empty windows and reversed dates.",
        "reassurance": "The reusable dashboard transformation is checked on the cases the sample does not contain."
      }
    ]
  },
  "pd-recent-features": {
    "setup": "import pandas as pd\nevents = pd.DataFrame({\"user\": [\"a\", \"a\", \"b\"], \"at\": [\"2026-01-02\", \"2026-01-08\", \"2026-01-09\"], \"amount\": [\"5\", \"12\", \"100\"]})\nas_of, days = \"2026-01-08\", 7",
    "steps": [
      {
        "title": "Set the prediction cutoff",
        "instruction": "Create `cutoff` by interpreting `as_of` as a UTC prediction instant.",
        "code": "cutoff = pd.to_datetime(as_of, utc=True)",
        "check": "test('Set the prediction cutoff', lambda: cutoff == pd.Timestamp(\"2026-01-08\", tz=\"UTC\"), 'cutoff is midnight UTC on January 8.')",
        "expected": "cutoff is midnight UTC on January 8.",
        "reassurance": "The upper time boundary is fixed before any features are calculated."
      },
      {
        "title": "Clean a new frame",
        "instruction": "Create a new frame named `clean` from `events`. Parse mixed-format `at` values as UTC timestamps, treating invalid dates as missing; convert `amount` values to numbers, treating invalid or missing amounts as zero. Preserve `events`.",
        "code": "clean = events.assign(\n    at=pd.to_datetime(events[\"at\"], errors=\"coerce\", utc=True, format=\"mixed\"),\n    amount=pd.to_numeric(events[\"amount\"], errors=\"coerce\").fillna(0),\n)",
        "check": "test('Clean a new frame', lambda: clean[\"amount\"].tolist() == [5, 12, 100] and events[\"amount\"].tolist() == [\"5\", \"12\", \"100\"] and str(clean[\"at\"].dt.tz) == \"UTC\", 'Amounts are numeric in clean, while events still holds the original strings.')",
        "expected": "Amounts are numeric in clean, while events still holds the original strings.",
        "reassurance": "The cleaned data is ready without overwriting the raw log."
      },
      {
        "title": "Apply both time boundaries",
        "instruction": "Create `window` containing rows of `clean` within the preceding `days` days. The lower boundary is exclusive and `cutoff` is inclusive. Invalid timestamps and events after the prediction instant must be excluded.",
        "code": "window = clean[(clean[\"at\"] > cutoff - pd.Timedelta(days=days)) & (clean[\"at\"] <= cutoff)]",
        "check": "test('Apply both time boundaries', lambda: window[\"user\"].tolist() == [\"a\", \"a\"] and window[\"amount\"].tolist() == [5, 12], 'Only the two a events remain; the January 9 event is excluded.')",
        "expected": "Only the two a events remain; the January 9 event is excluded.",
        "reassurance": "The example respects prediction time and excludes its future information."
      },
      {
        "title": "Aggregate recent behavior",
        "instruction": "Create `features` with one row per user in `window`, sorted by `user`. Include normal columns `user`, `n_events` for the event count and `revenue` for the total amount, in that order.",
        "code": "features = window.groupby(\"user\", sort=True).agg(n_events=(\"at\", \"size\"), revenue=(\"amount\", \"sum\")).reset_index()",
        "check": "test('Aggregate recent behavior', lambda: features.to_dict(\"list\") == {\"user\": [\"a\"], \"n_events\": [2], \"revenue\": [17]}, 'User a has 2 events and revenue 17.')",
        "expected": "User a has 2 events and revenue 17.",
        "reassurance": "The example feature row is correct. Next preserve this pipeline for other cutoffs and windows."
      },
      {
        "title": "Build recent_features",
        "instruction": "Implement `recent_features(events, as_of, days=7)`, with parameters in that order and a default of seven days. Return `user`, `n_events`, `revenue` for events after the lower time boundary and at or before the UTC cutoff, sorted by user. Clean mixed timestamps and amounts as before, preserve inputs and handle empty results. Reject non-positive window lengths with `ValueError`.",
        "code": "def recent_features(events, as_of, days=7):\n    if days < 1: raise ValueError(\"days must be positive\")\n    cutoff = pd.to_datetime(as_of, utc=True)\n    clean = events.assign(at=pd.to_datetime(events[\"at\"], errors=\"coerce\", utc=True, format=\"mixed\"), amount=pd.to_numeric(events[\"amount\"], errors=\"coerce\").fillna(0))\n    window = clean[(clean[\"at\"] > cutoff - pd.Timedelta(days=days)) & (clean[\"at\"] <= cutoff)]\n    return window.groupby(\"user\", sort=True).agg(n_events=(\"at\", \"size\"), revenue=(\"amount\", \"sum\")).reset_index()",
        "check": "",
        "expected": "The full check covers exact boundaries, invalid values, UTC offsets, empty data, shorter windows and input preservation.",
        "reassurance": "The complete checks verify that the time-window rules hold beyond the demonstration."
      }
    ]
  },
  "pd-encode": {
    "setup": "import pandas as pd\ntrain = pd.DataFrame({\"user\": [\"a\", \"b\", \"c\", \"d\", \"e\"], \"plan\": [\"pro\", \"free\", \"team\", \"free\", \"pro\"], \"sessions\": [12, 3, 8, 1, 20]})\ncolumn = \"plan\"",
    "steps": [
      {
        "title": "Count observed categories",
        "instruction": "Create `counts` with the number of occurrences of each non-missing category in the `column` column of `train`. Ignore missing values.",
        "code": "counts = pd.Series(train[column]).dropna().value_counts()",
        "check": "test('Count observed categories', lambda: counts.to_dict() == {\"pro\": 2, \"free\": 2, \"team\": 1}, 'pro and free appear twice; team appears once.')",
        "expected": "pro and free appear twice; team appears once.",
        "reassurance": "The vocabulary will be based on observed training categories."
      },
      {
        "title": "Freeze a sorted vocabulary",
        "instruction": "Create a sorted list named `vocabulary` containing the categories in `counts` observed at least once.",
        "code": "vocabulary = sorted(counts[counts >= 1].index.tolist())",
        "check": "test('Freeze a sorted vocabulary', lambda: vocabulary == [\"free\", \"pro\", \"team\"], 'vocabulary is [\"free\", \"pro\", \"team\"].')",
        "expected": "vocabulary is [\"free\", \"pro\", \"team\"].",
        "reassurance": "This ordered list can be reused for serving batches that contain fewer categories."
      },
      {
        "title": "Make vocabulary fitting reusable",
        "instruction": "Implement `fit_vocabulary(values, min_count=1)`, with parameters in that order and a default threshold of one. Return a sorted list of categories seen at least `min_count` times, ignoring missing values. Empty input returns an empty list.",
        "code": "def fit_vocabulary(values, min_count=1):\n    \"\"\"Sorted categories seen at least min_count times (missing values ignored).\"\"\"\n    counts = pd.Series(values).dropna().value_counts()\n    return sorted(counts[counts >= min_count].index.tolist())",
        "check": "test('Make vocabulary fitting reusable', lambda: fit_vocabulary([\"b\", \"a\", \"b\", None], 2) == [\"b\"] and fit_vocabulary([]) == [], 'A threshold of 2 keeps only b in [b, a, b, missing]; empty input returns [].')",
        "expected": "A threshold of 2 keeps only b in [b, a, b, missing]; empty input returns [].",
        "reassurance": "The fitter now respects frequency thresholds as well as sorted order."
      },
      {
        "title": "Declare every output column",
        "instruction": "Create a list named `names` with one indicator-column name per entry in `vocabulary`, in vocabulary order, followed by a fallback column. Join the source column name and category with `=`; for this data the fallback name is `plan=other`.",
        "code": "names = [f\"{column}={value}\" for value in vocabulary] + [f\"{column}=other\"]",
        "check": "test('Declare every output column', lambda: names == [\"plan=free\", \"plan=pro\", \"plan=team\", \"plan=other\"], 'There are four fixed indicator columns, ending in plan=other.')",
        "expected": "There are four fixed indicator columns, ending in plan=other.",
        "reassurance": "The output shape no longer depends on which categories happen to appear in a batch."
      },
      {
        "title": "Map unknown values to other",
        "instruction": "Create a Series named `known` from the `column` column of `train`. Preserve vocabulary members and map all other values, including missing entries, to the string `other`.",
        "code": "known = train[column].where(train[column].isin(vocabulary), \"other\")",
        "check": "test('Map unknown values to other', lambda: known.tolist() == [\"pro\", \"free\", \"team\", \"free\", \"pro\"] and pd.Series([\"enterprise\", None]).where(pd.Series([\"enterprise\", None]).isin(vocabulary), \"other\").tolist() == [\"other\", \"other\"], 'Known plans stay unchanged; enterprise and missing values map to other.')",
        "expected": "Known plans stay unchanged; enterprise and missing values map to other.",
        "reassurance": "The fallback rule is checked before building the indicator columns."
      },
      {
        "title": "Encode and align the indicators",
        "instruction": "Create `indicators` with integer one-hot columns for `known`, aligned to `names` in that exact order. Keep the original index and include every named column even when its values are all zero.",
        "code": "indicators = pd.get_dummies(known, prefix=column, prefix_sep=\"=\", dtype=int).reindex(columns=names, fill_value=0)",
        "check": "test('Encode and align the indicators', lambda: list(indicators.columns) == names and indicators.sum(axis=1).tolist() == [1] * 5 and indicators[\"plan=other\"].tolist() == [0] * 5, 'Each row has one 1, and plan=other exists even though it is all zeros here.')",
        "expected": "Each row has one 1, and plan=other exists even though it is all zeros here.",
        "reassurance": "The training batch has the frozen schema and exactly one active category per row."
      },
      {
        "title": "Build the reusable encoder",
        "instruction": "Implement `encode(frame, column, vocabulary)`, with parameters in that order. Return a new frame with the selected column replaced by integer one-hot indicators in vocabulary order plus an `other` column. Indicator names use the source column name, `=` and category. Unknown or missing categories map to `other`; each row has one active indicator. Keep other columns first, preserve the input index and inputs, and support empty batches.",
        "code": "def encode(frame, column, vocabulary):\n    \"\"\"Replace column with one indicator per vocabulary entry, plus column=other.\"\"\"\n    names = [f\"{column}={value}\" for value in vocabulary] + [f\"{column}=other\"]\n    known = frame[column].where(frame[column].isin(vocabulary), \"other\")\n    indicators = pd.get_dummies(known, prefix=column, prefix_sep=\"=\", dtype=int).reindex(columns=names, fill_value=0)\n    return pd.concat([frame.drop(columns=column), indicators], axis=1)",
        "check": "",
        "expected": "The full check includes one-row requests, unseen and missing categories, custom index, vocabulary order, empty batches and unchanged inputs.",
        "reassurance": "The complete check verifies the serving cases that a training-only dummy table would miss."
      }
    ]
  },
  "pd-features": {
    "setup": "import numpy as np\nimport pandas as pd\nevents = pd.DataFrame({\"user\": [\"a\", \"a\", \"a\", \"b\", \"b\", \"c\"], \"action\": [\"view\", \"view\", \"purchase\", \"view\", \"click\", \"click\"], \"value\": [np.nan, np.nan, 30.0, np.nan, np.nan, np.nan]})",
    "steps": [
      {
        "title": "Mark views and purchases",
        "instruction": "Create a new DataFrame named `df` from `events` with boolean helper columns `is_view` and `is_purchase`, indicating actions equal to `view` and `purchase`. Preserve `events`.",
        "code": "df = events.assign(is_view=events[\"action\"].eq(\"view\"), is_purchase=events[\"action\"].eq(\"purchase\"))",
        "check": "test('Mark views and purchases', lambda: df[\"is_view\"].tolist() == [True, True, False, True, False, False] and df[\"is_purchase\"].sum() == 1 and list(events.columns) == [\"user\", \"action\", \"value\"], 'There are three view flags and one purchase flag; events has no helper columns.')",
        "expected": "There are three view flags and one purchase flag; events has no helper columns.",
        "reassurance": "The flags identify the actions correctly without changing the raw event log."
      },
      {
        "title": "Aggregate one row per user",
        "instruction": "Create `out` with one row per user, sorted by `user`. Include `n_events` counting all events, `n_views` and `n_purchases` counting their flags, and `revenue` summing `value` while ignoring missing values. Keep `user` as a normal column.",
        "code": "out = df.groupby(\"user\").agg(\n    n_events=(\"action\", \"size\"),\n    n_views=(\"is_view\", \"sum\"),\n    n_purchases=(\"is_purchase\", \"sum\"),\n    revenue=(\"value\", \"sum\"),\n).reset_index()",
        "check": "test('Aggregate one row per user', lambda: out[\"user\"].tolist() == [\"a\", \"b\", \"c\"] and out[\"n_events\"].tolist() == [3, 2, 1] and out[\"revenue\"].tolist() == [30.0, 0.0, 0.0], 'Users a, b, c have event counts [3, 2, 1] and revenue [30, 0, 0].')",
        "expected": "Users a, b, c have event counts [3, 2, 1] and revenue [30, 0, 0].",
        "reassurance": "The grouped counts and revenue are correct. Views remain available for the conversion calculation."
      },
      {
        "title": "Calculate conversion safely",
        "instruction": "Add a `conversion` column to `out`: the number of purchases per view for each user. Users with no views must receive zero rather than an infinite or missing result.",
        "code": "out[\"conversion\"] = (out[\"n_purchases\"] / out[\"n_views\"]).where(out[\"n_views\"] > 0, 0.0)",
        "check": "test('Calculate conversion safely', lambda: out[\"conversion\"].tolist() == [0.5, 0.0, 0.0], 'Conversion is [0.5, 0.0, 0.0]; the no-view user receives 0.')",
        "expected": "Conversion is [0.5, 0.0, 0.0]; the no-view user receives 0.",
        "reassurance": "The conversion rule is correct for both viewed and unviewed users."
      },
      {
        "title": "Keep the requested output schema",
        "instruction": "Create `features` with the columns `user`, `n_events`, `n_purchases`, `revenue`, `conversion` in that order. The temporary view count should no longer appear.",
        "code": "features = out.drop(columns=\"n_views\")",
        "check": "test('Keep the requested output schema', lambda: list(features.columns) == [\"user\", \"n_events\", \"n_purchases\", \"revenue\", \"conversion\"], 'The output has exactly user, n_events, n_purchases, revenue and conversion.')",
        "expected": "The output has exactly user, n_events, n_purchases, revenue and conversion.",
        "reassurance": "The example has the exact requested columns. Now turn the pipeline into a reusable function."
      },
      {
        "title": "Build the feature factory",
        "instruction": "Implement `build_user_features(events)`, returning one row per user sorted by user with columns `user`, `n_events`, `n_purchases`, `revenue`, `conversion`. Count all events, count purchase actions and sum non-missing values. Conversion is purchases per view, or zero without views. Preserve inputs and produce the same schema for empty data.",
        "code": "def build_user_features(events):\n    df = events.assign(is_view=events[\"action\"].eq(\"view\"), is_purchase=events[\"action\"].eq(\"purchase\"))\n    out = df.groupby(\"user\").agg(n_events=(\"action\", \"size\"), n_views=(\"is_view\", \"sum\"), n_purchases=(\"is_purchase\", \"sum\"), revenue=(\"value\", \"sum\")).reset_index()\n    out[\"conversion\"] = (out[\"n_purchases\"] / out[\"n_views\"]).where(out[\"n_views\"] > 0, 0.0)\n    return out.drop(columns=\"n_views\")",
        "check": "",
        "expected": "The complete check includes new users, shuffled events, purchases without views, empty input and unchanged data.",
        "reassurance": "The full checks verify that the feature factory generalizes beyond the example users."
      }
    ]
  }
}
