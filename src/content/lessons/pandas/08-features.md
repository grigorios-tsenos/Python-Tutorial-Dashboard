---
id: pd-features
track: pandas
order: 8
title: "Boss: Feature Factory"
tagline: Turn a raw event log into the table a model can learn from.
kind: boss
xp: 100
minutes: 12
---
@@body
# Boss: build user features from clickstream events

Models don't read logs; they read **feature tables**: one row per entity, one column per signal. Turning events into features is the single most common data-science task in industry.

You get an event log: `user`, `action` (`view`, `click` or `purchase`) and `value` (revenue, only set on purchases).

> **Mission:** write `build_user_features(events)` returning a DataFrame with **exactly** these columns, one row per user, sorted by user:
>
> | column | meaning |
> |---|---|
> | `user` | the user id |
> | `n_events` | total events |
> | `n_purchases` | number of `purchase` events |
> | `revenue` | sum of `value` (0.0 if none) |
> | `conversion` | purchases ÷ views, or `0.0` if the user has no views |

Don't mutate the input frame. The boss checks unfamiliar users, shuffled events, a purchaser with no views, and an empty event frame. Empty input must still return the five named columns.
@@starter
import numpy as np
import pandas as pd

def build_user_features(events):
    # TODO: one row per user with n_events, n_purchases, revenue, conversion
    return events

events = pd.DataFrame({
    "user":   ["a", "a", "a", "b", "b", "c"],
    "action": ["view", "view", "purchase", "view", "click", "click"],
    "value":  [np.nan, np.nan, 30.0, np.nan, np.nan, np.nan],
})
build_user_features(events)
@@solution
import numpy as np
import pandas as pd

def build_user_features(events):
    df = events.assign(
        is_view=events["action"].eq("view"),
        is_purchase=events["action"].eq("purchase"),
    )
    out = df.groupby("user").agg(
        n_events=("action", "size"),
        n_views=("is_view", "sum"),
        n_purchases=("is_purchase", "sum"),
        revenue=("value", "sum"),
    ).reset_index()
    out["conversion"] = (out["n_purchases"] / out["n_views"]).where(out["n_views"] > 0, 0.0)
    return out.drop(columns="n_views")

events = pd.DataFrame({
    "user":   ["a", "a", "a", "b", "b", "c"],
    "action": ["view", "view", "purchase", "view", "click", "click"],
    "value":  [np.nan, np.nan, 30.0, np.nan, np.nan, np.nan],
})
build_user_features(events)
@@check
import numpy as np
import pandas as pd
E = pd.DataFrame({
    "user": ["a", "a", "a", "b", "b", "c"],
    "action": ["view", "view", "purchase", "view", "click", "click"],
    "value": [np.nan, np.nan, 30.0, np.nan, np.nan, np.nan],
})
out = build_user_features(E)
test("exact columns", lambda: list(out.columns) == ["user", "n_events", "n_purchases", "revenue", "conversion"], "columns must be user, n_events, n_purchases, revenue, conversion (in that order)")
test("one row per user, sorted", lambda: out["user"].tolist() == ["a", "b", "c"])
test("event counts", lambda: out["n_events"].tolist() == [3, 2, 1])
test("purchase counts", lambda: out["n_purchases"].tolist() == [1, 0, 0])
test("revenue is 0.0 when there are no purchases", lambda: out["revenue"].tolist() == [30.0, 0.0, 0.0])
test("conversion = purchases / views, 0.0 without views", lambda: out["conversion"].tolist() == [0.5, 0.0, 0.0])
test("input frame untouched", lambda: list(E.columns) == ["user", "action", "value"])
unseen = pd.DataFrame({
    "user": ["z", "x", "z", "y", "w"],
    "action": ["purchase", "view", "view", "click", "purchase"],
    "value": [7.0, np.nan, np.nan, np.nan, 12.0],
})
original = unseen.copy(deep=True)
fresh = build_user_features(unseen)
test("new users and shuffled events generalize", lambda: fresh["user"].tolist() == ["w", "x", "y", "z"] and fresh["n_events"].tolist() == [1, 1, 1, 2])
test("purchases without views have zero conversion", lambda: fresh["conversion"].tolist() == [0.0, 0.0, 0.0, 1.0] and fresh["revenue"].tolist() == [12.0, 0.0, 0.0, 7.0])
test("all input values stay unchanged", lambda: unseen.equals(original))
empty = build_user_features(E.iloc[:0])
test("empty events retain the output schema", lambda: empty.empty and list(empty.columns) == ["user", "n_events", "n_purchases", "revenue", "conversion"])
@@hint
Create two helper boolean columns (`action == "view"`, `action == "purchase"`) with `.assign(...)`, then `groupby("user").agg(...)` using named aggregation like `n_events=("action", "size")`.
@@hint
Summing a boolean column counts the Trues. For conversion, divide purchases by views, then `.where(views > 0, 0.0)` to patch the divide-by-zero rows. Drop the helper `n_views` column at the end and call `.reset_index()` so `user` is a column.
@@q
What is named aggregation in pandas?
@@a
`.agg(new_name=("column", "func"))`: it names each output column explicitly.
@@q
How do you count how many rows in a group satisfy a condition?
@@a
Make a boolean column and sum it: Trues count as 1.
@@real
In production these become features in a feature store (Databricks Feature Engineering, Feast). The pandas logic is identical; only the scale and the storage change.
