---
id: pd-pipeline
track: pandas
order: 3
title: "Puzzle: Totals Per User"
tagline: Aggregate, join, sort: the holy trinity.
kind: parsons
xp: 35
minutes: 5
---
@@body
# Put the pipeline in order

Most analytics boils down to three verbs:

| verb | pandas |
|---|---|
| **aggregate** | `orders.groupby("user_id")["amount"].sum()` |
| **join** | `totals.merge(users, on="user_id")` |
| **sort** | `report.sort_values("amount", ascending=False)` |

The lines are scrambled. Drag them (or use the arrows) into an order that builds `report`: each user's total spend with their plan, **biggest spender first**.

Hit **Run & Check**. Any valid order counts; the checker runs your arrangement.
@@lines
import pandas as pd
orders = pd.DataFrame({"user_id": [1, 1, 2, 3, 3, 3], "amount": [20, 30, 15, 5, 10, 25]})
users = pd.DataFrame({"user_id": [1, 2, 3], "plan": ["pro", "free", "free"]})
totals = orders.groupby("user_id", as_index=False)["amount"].sum()
report = totals.merge(users, on="user_id")
report = report.sort_values("amount", ascending=False)
print(report)
@@check
test("columns are user_id, amount, plan", lambda: list(report.columns) == ["user_id", "amount", "plan"])
test("biggest spender first", lambda: report["user_id"].tolist() == [1, 3, 2])
test("totals are right", lambda: report["amount"].tolist() == [50, 40, 15])
@@hint
Data must exist before it is used: imports first, then the two tables, then `totals`, then `report`.
@@hint
Aggregate (`totals`) → join with `users` → sort → print. Sorting can't happen before the merge builds `report`.
@@q
What does `groupby(..., as_index=False)` change?
@@a
The group keys stay as a normal column instead of becoming the index.
@@q
Which pandas call is the equivalent of a SQL JOIN?
@@a
`df.merge(other, on="key", how="inner")`
