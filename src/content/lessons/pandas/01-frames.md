---
id: pd-frames
track: pandas
order: 1
title: Meet the DataFrame
tagline: A spreadsheet that speaks Python and never complains about 10 million rows.
kind: run
xp: 25
minutes: 5
---
@@body
# Rows, columns, and boolean masks

A **DataFrame** is a table: named columns, each a typed array. A **Series** is one column. The superpower you'll use every day is the *boolean mask*:

```python
import pandas as pd

df = pd.DataFrame({"city": ["Oslo", "Lima", "Kyiv"], "temp": [4, 19, 9]})

df["temp"]                 # one column (a Series)
df["temp"] > 8             # a True/False mask, one entry per row
df[df["temp"] > 8]         # keep only the rows where the mask is True
```

No loops. You describe *which rows you want*, pandas does the rest.

> **Mission:** from the model benchmark table, keep only the models with accuracy **above 0.85** and store them in `strong`.
@@starter
import pandas as pd

runs = pd.DataFrame({
    "model": ["tiny", "small", "medium", "large"],
    "accuracy": [0.71, 0.84, 0.88, 0.93],
    "cost_usd": [0.0, 0.8, 2.4, 3.1],
})

# TODO: keep only the rows with accuracy above 0.85
strong = runs

strong
@@solution
import pandas as pd

runs = pd.DataFrame({
    "model": ["tiny", "small", "medium", "large"],
    "accuracy": [0.71, 0.84, 0.88, 0.93],
    "cost_usd": [0.0, 0.8, 2.4, 3.1],
})

strong = runs[runs["accuracy"] > 0.85]

strong
@@check
test("only strong models remain", lambda: list(strong["model"]) == ["medium", "large"], "keep rows where accuracy > 0.85")
test("all columns kept", lambda: list(strong.columns) == ["model", "accuracy", "cost_usd"])
@@hint
Build a mask with `runs["accuracy"] > 0.85`, then use it inside square brackets on the whole frame.
@@hint
`strong = runs[runs["accuracy"] > 0.85]`
@@q
What does `df[df["x"] > 3]` return?
@@a
A new DataFrame with only the rows where column x is greater than 3.
@@q
Difference between a DataFrame and a Series?
@@a
A DataFrame is a 2-D table of columns; a Series is a single labelled column.
@@real
`pip install pandas`. Real pandas 3 uses copy-on-write by default and a dedicated `str` dtype for text, which is what you are running here.
