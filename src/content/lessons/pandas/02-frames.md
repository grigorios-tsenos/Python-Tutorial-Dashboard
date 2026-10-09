---
id: pd-frames
track: pandas
order: 2
title: Meet the DataFrame
tagline: A spreadsheet that speaks Python and never complains about 10 million rows.
kind: run
xp: 25
minutes: 5
---
@@body
# Rows, columns, and boolean masks

A **DataFrame** is a table of named, typed columns. A **Series** is one column. The daily workhorse is the *boolean mask*: a column of True/False, one per row, that says which rows you want.

```python
df["temp"] > 8             # a True/False mask, one entry per row
df[df["temp"] > 8]         # keep only the rows where the mask is True
```

No loops: describe *which rows you want*, pandas does the rest.

> **Mission:** from the model benchmark table, keep only the models with accuracy **above 0.85** and store them in `strong`.

@@step Build the mask
Compare a whole column with a number and you get a Series of booleans, one per row, in row order:

```python
mask = runs["accuracy"] > 0.85     # [False, False, True, True]
```

`0.85` itself is *not* above `0.85`: the comparison is strict.

**Do:** add the line above after the table, then Run.
@@stepcheck
import pandas as pd
test("mask is one boolean per row", lambda: isinstance(mask, pd.Series) and mask.tolist() == [False, False, True, True], 'mask = runs["accuracy"] > 0.85')
@@step Keep only the rows where the mask is True
Put the mask inside square brackets on the **whole frame**. Rows whose mask is True survive, every column comes along:

```python
strong = runs[mask]
```

**Do:** replace `strong = runs` with the line above, then Run. The result shows `medium` and `large` only.
@@stepcheck
test("only strong models remain", lambda: list(strong["model"]) == ["medium", "large"], "strong = runs[mask]")
@@starter
import pandas as pd

runs = pd.DataFrame({
    "model": ["tiny", "small", "medium", "large"],
    "accuracy": [0.71, 0.84, 0.88, 0.93],
    "cost_usd": [0.0, 0.8, 2.4, 3.1],
})

# TODO 1: a True/False mask: which rows have accuracy above 0.85?

# TODO 2: keep only those rows
strong = runs

strong
@@solution
import pandas as pd

runs = pd.DataFrame({
    "model": ["tiny", "small", "medium", "large"],
    "accuracy": [0.71, 0.84, 0.88, 0.93],
    "cost_usd": [0.0, 0.8, 2.4, 3.1],
})

mask = runs["accuracy"] > 0.85

strong = runs[mask]

strong
@@check
test("only strong models remain", lambda: list(strong["model"]) == ["medium", "large"], "keep rows where accuracy > 0.85")
test("all columns kept", lambda: list(strong.columns) == ["model", "accuracy", "cost_usd"])
test("the original table still has every row", lambda: len(runs) == 4)
@@hint
Build a mask with `runs["accuracy"] > 0.85`, then use it inside square brackets on the whole frame.
@@hint
`mask = runs["accuracy"] > 0.85` then `strong = runs[mask]`.
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
