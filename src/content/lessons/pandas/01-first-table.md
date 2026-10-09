---
id: pd-first-table
track: pandas
order: 1
title: Rows Are Things, Columns Are Facts
tagline: Every dataset starts as a table you can question.
kind: run
xp: 25
minutes: 4
---
@@body
# Tables are how data arrives

Logs, user records, benchmarks, training examples: they all arrive as **tables**. One row per *thing*, one column per *fact about it*. pandas calls the table a `DataFrame`.

Three moves cover most of what you will ever do with one, and every lesson in this chapter is these three with more steps:

```python
df.head(2)                 # LOOK: the first rows
df["latency_ms"]           # PICK a column -> a Series
df["latency_ms"].mean()    # SUMMARIZE -> one number
```

> **Mission:** you're on call and the table below holds last night's API requests. Look at the first two rows with `.head(2)`, store the `latency_ms` column in `latencies`, and store its average in `average` (then print it).
@@starter
import pandas as pd

requests = pd.DataFrame({
    "endpoint": ["/chat", "/embed", "/chat", "/search", "/chat"],
    "latency_ms": [140.0, 35.0, 210.0, 90.0, 125.0],
    "status": [200, 200, 500, 200, 200],
})

# TODO 1: look at the first two rows
print(requests)

# TODO 2: pick the latency column
latencies = requests

# TODO 3: one number: the average latency
average = 0
print(average)
@@solution
import pandas as pd

requests = pd.DataFrame({
    "endpoint": ["/chat", "/embed", "/chat", "/search", "/chat"],
    "latency_ms": [140.0, 35.0, 210.0, 90.0, 125.0],
    "status": [200, 200, 500, 200, 200],
})

print(requests.head(2))

latencies = requests["latency_ms"]

average = latencies.mean()
print(average)
@@check
import pandas as pd
test("latencies is the one column, as a Series", lambda: isinstance(latencies, pd.Series) and latencies.tolist() == [140.0, 35.0, 210.0, 90.0, 125.0], 'pick one column with requests["latency_ms"]')
test("average is the mean latency", lambda: average == 120.0)
test("the average is printed", lambda: "120.0" in __stdout__)
test("head(2) shows only the first two rows", lambda: "/embed" in __stdout__ and "/search" not in __stdout__, "print(requests.head(2)): the preview should include /embed (row 2) but not /search (row 4)")
test("the table itself is unchanged", lambda: list(requests.columns) == ["endpoint", "latency_ms", "status"] and len(requests) == 5)
@@hint
`requests.head(2)` returns the first two rows. Square brackets with a column name, `requests["latency_ms"]`, pick one column.
@@hint
`latencies = requests["latency_ms"]`, then `average = latencies.mean()`. A Series has the same handy math methods an array has.
@@q
In a well-formed table, what are rows and what are columns?
@@a
Rows are the things (one per request, user, experiment); columns are facts about each thing.
@@q
What do you get from df["col"], and what is it called?
@@a
One column with its row labels: a pandas Series.
@@real
`pd.read_csv("logs.csv")` or `pd.read_parquet(...)` is how real tables arrive, often millions of rows. `.head()`, picking columns and `.mean()` work exactly the same at that size.
