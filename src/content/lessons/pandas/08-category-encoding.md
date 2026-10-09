---
id: pd-encode
track: pandas
order: 8
title: One-Hot Encode with a Frozen Vocabulary
tagline: Training saw three plans. Production just sent a fourth.
kind: build
xp: 60
minutes: 8
---
@@body
# Train/serve skew starts with get_dummies

`pd.get_dummies` builds one indicator column per category **that appears in the frame you pass it**:

```python
pd.get_dummies(train["plan"])     # free, pro, team   -> 3 columns
pd.get_dummies(request["plan"])   # pro               -> 1 column (!)
```

A model trained on three columns now receives one: a crash, or silently wrong inputs. The fix is to **freeze the vocabulary at training time** and encode every later batch against it, so a batch of one row still produces every column.

> **Mission:**
>
> 1. `fit_vocabulary(values, min_count=1)` → a **sorted** list of categories seen at least `min_count` times, ignoring missing values.
> 2. `encode(frame, column, vocabulary)` → a new frame with `column` replaced by integer indicator columns named `column=value`, one per vocabulary entry **in vocabulary order**, then `column=other` for anything unseen or missing. Every row has exactly one `1` among them. Other columns keep their order and come first; the index is preserved; the input is unchanged; an empty frame still gets every indicator column.

@@step fit_vocabulary: count, filter, sort
`value_counts()` counts each category; `dropna()` first so missing values never become a category:

```python
counts = pd.Series(values).dropna().value_counts()
return sorted(counts[counts >= min_count].index.tolist())
```

`pd.Series(values)` accepts a column or a plain list. `counts >= min_count` is a mask over the counts; indexing with it keeps the frequent categories, and `.index` holds their names.

**Do:** implement `fit_vocabulary`, then Run.
@@stepcheck
import pandas as pd
T = pd.Series(["pro", "free", "team", "free", "pro", None])
test("vocabulary is sorted and ignores missing values", lambda: fit_vocabulary(T) == ["free", "pro", "team"], "value_counts() after dropna(), then sorted(...)")
test("min_count leaves rare categories out", lambda: fit_vocabulary(T, min_count=2) == ["free", "pro"] and fit_vocabulary(["b", "a", "b"]) == ["a", "b"])
@@step Encode against the frozen names
Build the full column list from the vocabulary, map everything outside it (including missing) to `"other"`, then force those exact columns:

```python
names = [f"{column}={value}" for value in vocabulary] + [f"{column}=other"]
known = frame[column].where(frame[column].isin(vocabulary), "other")
indicators = pd.get_dummies(known, prefix=column, prefix_sep="=", dtype=int).reindex(columns=names, fill_value=0)
```

`where(cond, other)` keeps values where `cond` is True and substitutes elsewhere; `NaN` fails `isin`, so it becomes `"other"` too. `reindex(columns=names, fill_value=0)` adds any column the batch lacked, as zeros, in training order.

**Do:** build `indicators` and return it for now, then Run. A one-row request should come back with all four `plan=` columns.
@@stepcheck
import pandas as pd
V = ["free", "pro", "team"]
one = encode(pd.DataFrame({"user": ["z"], "plan": ["pro"], "sessions": [4]}), "plan", V)
test("a one-row request still gets every training column", lambda: [c for c in one.columns if c.startswith("plan=")] == ["plan=free", "plan=pro", "plan=team", "plan=other"] and one["plan=pro"].tolist() == [1], "get_dummies(known, ...).reindex(columns=names, fill_value=0)")
odd = encode(pd.DataFrame({"plan": ["enterprise", None, "team"]}), "plan", V)
test("unseen and missing categories become other", lambda: odd["plan=other"].tolist() == [1, 1, 0] and odd["plan=team"].tolist() == [0, 0, 1], 'frame[column].where(frame[column].isin(vocabulary), "other")')
@@step Keep the other columns first, the index intact
Drop the original column and glue the indicators to the right of what remains. `concat` with `axis=1` aligns on the index, so row labels survive:

```python
return pd.concat([frame.drop(columns=column), indicators], axis=1)
```

**Do:** return the assembled frame, then Run.
@@stepcheck
import pandas as pd
V = ["free", "pro", "team"]
odd = pd.DataFrame({"plan": ["enterprise", None, "team"], "user": ["x", "y", "w"]}, index=[10, 11, 12])
o = encode(odd, "plan", V)
test("other columns keep their order and the index is preserved", lambda: list(o.columns) == ["user", "plan=free", "plan=pro", "plan=team", "plan=other"] and list(o.index) == [10, 11, 12], "pd.concat([frame.drop(columns=column), indicators], axis=1)")
test("every row has exactly one 1", lambda: o[[c for c in o.columns if c.startswith("plan=")]].sum(axis=1).tolist() == [1, 1, 1])
@@starter
import pandas as pd

def fit_vocabulary(values, min_count=1):
    """Sorted categories seen at least min_count times (missing values ignored)."""
    # TODO
    return []

def encode(frame, column, vocabulary):
    """Replace column with one indicator per vocabulary entry, plus column=other."""
    # BUG: get_dummies builds columns from *this* frame, so a one-row batch gets one column
    return pd.get_dummies(frame, columns=[column], prefix_sep="=", dtype=int)

train = pd.DataFrame({
    "user": ["a", "b", "c", "d", "e"],
    "plan": ["pro", "free", "team", "free", "pro"],
    "sessions": [12, 3, 8, 1, 20],
})
vocab = fit_vocabulary(train["plan"])
request = pd.DataFrame({"user": ["z"], "plan": ["enterprise"], "sessions": [4]})
print(encode(train, "plan", vocab))
print(encode(request, "plan", vocab))
@@solution
import pandas as pd

def fit_vocabulary(values, min_count=1):
    """Sorted categories seen at least min_count times (missing values ignored)."""
    counts = pd.Series(values).dropna().value_counts()
    return sorted(counts[counts >= min_count].index.tolist())

def encode(frame, column, vocabulary):
    """Replace column with one indicator per vocabulary entry, plus column=other."""
    names = [f"{column}={value}" for value in vocabulary] + [f"{column}=other"]
    known = frame[column].where(frame[column].isin(vocabulary), "other")
    indicators = pd.get_dummies(known, prefix=column, prefix_sep="=", dtype=int).reindex(columns=names, fill_value=0)
    return pd.concat([frame.drop(columns=column), indicators], axis=1)

train = pd.DataFrame({
    "user": ["a", "b", "c", "d", "e"],
    "plan": ["pro", "free", "team", "free", "pro"],
    "sessions": [12, 3, 8, 1, 20],
})
vocab = fit_vocabulary(train["plan"])
request = pd.DataFrame({"user": ["z"], "plan": ["enterprise"], "sessions": [4]})
print(encode(train, "plan", vocab))
print(encode(request, "plan", vocab))
@@check
T = pd.DataFrame({"user": ["a", "b", "c", "d", "e", "f"], "plan": ["pro", "free", "team", "free", "pro", None], "sessions": [12, 3, 8, 1, 20, 5]})
t_copy = T.copy(deep=True)
test("vocabulary is sorted and ignores missing values", lambda: fit_vocabulary(T["plan"]) == ["free", "pro", "team"])
test("min_count leaves rare categories out", lambda: fit_vocabulary(T["plan"], min_count=2) == ["free", "pro"] and fit_vocabulary(T["plan"], min_count=3) == [])
test("a plain list works too", lambda: fit_vocabulary(["b", "a", "b"]) == ["a", "b"])
V = ["free", "pro", "team"]
cols = ["user", "sessions", "plan=free", "plan=pro", "plan=team", "plan=other"]
out = encode(T, "plan", V)
test("indicator columns follow the vocabulary, then other", lambda: list(out.columns) == cols)
test("training rows are encoded correctly", lambda: out[cols[2:]].values.tolist() == [[0, 1, 0, 0], [1, 0, 0, 0], [0, 0, 1, 0], [1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1]])
one = encode(pd.DataFrame({"user": ["z"], "plan": ["pro"], "sessions": [4]}), "plan", V)
test("a one-row request still gets every training column", lambda: list(one.columns) == cols and one[cols[2:]].values.tolist() == [[0, 1, 0, 0]])
odd = pd.DataFrame({"plan": ["enterprise", None, "team"], "user": ["x", "y", "w"]}, index=[10, 11, 12])
o = encode(odd, "plan", V)
test("unseen and missing categories become other", lambda: o["plan=other"].tolist() == [1, 1, 0] and o["plan=team"].tolist() == [0, 0, 1])
test("other columns keep their order and the index is preserved", lambda: list(o.columns)[:1] == ["user"] and list(o.index) == [10, 11, 12])
test("every row has exactly one 1 and the values are integers", lambda: o[cols[2:]].sum(axis=1).tolist() == [1, 1, 1] and all(pd.api.types.is_integer_dtype(t) for t in o[cols[2:]].dtypes))
test("a different column and vocabulary order are respected", lambda: list(encode(pd.DataFrame({"tier": ["gold", "basic"]}), "tier", ["silver", "gold"]).columns) == ["tier=silver", "tier=gold", "tier=other"])
empty = encode(T.iloc[:0], "plan", V)
test("an empty batch keeps the full schema", lambda: empty.empty and list(empty.columns) == cols)
test("the input frame is unchanged", lambda: T.equals(t_copy))
@@hint
`fit_vocabulary`: `pd.Series(values).dropna().value_counts()` counts each category. Keep the ones with a count `>= min_count` and return them `sorted(...)`.
@@hint
`encode`: map anything outside the vocabulary to `"other"` with `.where(series.isin(vocabulary), "other")` (missing values fail `isin` too), call `pd.get_dummies(..., prefix=column, prefix_sep="=", dtype=int)`, then `.reindex(columns=[...], fill_value=0)`. Finish with `pd.concat([frame.drop(columns=column), indicators], axis=1)`.
@@q
Why can `pd.get_dummies` on a serving batch break a trained model?
@@a
It only creates columns for categories present in that batch, so the number and order of features can differ from training.
@@q
What does `df.reindex(columns=expected, fill_value=0)` do?
@@a
Returns the columns in exactly the expected order, adding any missing ones filled with 0 (and dropping unexpected ones).
@@real
scikit-learn's `OneHotEncoder(handle_unknown="infrequent_if_exist", min_frequency=...)` does this. Save the fitted vocabulary with the model (for example as an MLflow artifact) so serving encodes requests exactly as training did.
