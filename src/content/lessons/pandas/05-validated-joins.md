---
id: pd-validated-joins
track: pandas
order: 5
title: Join Tables without Multiplying Rows
tagline: Duplicate lookup keys can quietly turn a report into fiction.
kind: build
xp: 50
minutes: 6
---
@@body
# Validate the relationship before trusting the join

Events have many rows per user; a user lookup should have **one** plan per user. A duplicate lookup key makes a normal merge copy every matching event: totals inflate while the code still runs.

`validate="many_to_one"` enforces the relationship in the merge itself, raising `pd.errors.MergeError` when right-side keys are duplicated. A **left join** keeps events whose users are missing from the lookup.

> **Mission:** implement `attach_plans(events, users)`. `events` has columns `event_id`, `user_id`, `amount`; `users` has `user_id`, `plan`. Return those event columns plus `plan`, keeping the event rows in their original order. Fill missing plans with `"unknown"`. Reject duplicate user lookup keys through merge validation, and keep both input frames unchanged.

The same function must work with new user IDs and empty events; do not hard-code the demo.
@@starter
import pandas as pd

def attach_plans(events, users):
    """Attach exactly one plan to every event, preserving event rows."""
    # TODO
    return events

events = pd.DataFrame({"event_id": [7, 8, 9], "user_id": [2, 1, 3], "amount": [5, 20, 10]})
users = pd.DataFrame({"user_id": [1, 2], "plan": ["pro", "free"]})
print(attach_plans(events, users))
@@solution
import pandas as pd

def attach_plans(events, users):
    """Attach exactly one plan to every event, preserving event rows."""
    joined = events.merge(users, on="user_id", how="left", sort=False, validate="many_to_one")
    return joined.assign(plan=joined["plan"].fillna("unknown"))

events = pd.DataFrame({"event_id": [7, 8, 9], "user_id": [2, 1, 3], "amount": [5, 20, 10]})
users = pd.DataFrame({"user_id": [1, 2], "plan": ["pro", "free"]})
print(attach_plans(events, users))
@@check
E = pd.DataFrame({"event_id": [7, 8, 9], "user_id": [2, 1, 3], "amount": [5, 20, 10]})
U = pd.DataFrame({"user_id": [1, 2], "plan": ["pro", "free"]})
e_copy, u_copy = E.copy(deep=True), U.copy(deep=True)
out = attach_plans(E, U)
test("left join retains all event rows in order", lambda: out["event_id"].tolist() == [7, 8, 9] and out["amount"].tolist() == [5, 20, 10])
test("missing users receive an unknown plan", lambda: out["plan"].tolist() == ["free", "pro", "unknown"])
test("output has exactly the requested columns", lambda: list(out.columns) == ["event_id", "user_id", "amount", "plan"])
fresh_events = pd.DataFrame({"event_id": [1, 2, 3], "user_id": [99, 99, 42], "amount": [2, 3, 4]})
fresh_users = pd.DataFrame({"user_id": [42, 99], "plan": [None, "team"]})
test("repeated events and new users generalize", lambda: attach_plans(fresh_events, fresh_users)["plan"].tolist() == ["team", "team", "unknown"])
try:
    attach_plans(E, pd.concat([U, U.iloc[:1]], ignore_index=True))
    duplicate_rejected = False
except pd.errors.MergeError:
    duplicate_rejected = True
test("duplicate lookup keys fail instead of inflating events", lambda: duplicate_rejected)
test("input frames are unchanged", lambda: E.equals(e_copy) and U.equals(u_copy))
empty = attach_plans(E.iloc[:0], U)
test("empty events retain the output schema", lambda: empty.empty and list(empty.columns) == ["event_id", "user_id", "amount", "plan"])
test("empty lookup keeps all events as unknown", lambda: attach_plans(E, U.iloc[:0])["plan"].tolist() == ["unknown", "unknown", "unknown"])
@@hint
Use `events.merge(users, on="user_id", how="left", sort=False, validate="many_to_one")`. Validation belongs to the join, where duplicate right-side keys would multiply rows.
@@hint
Fill the joined frame's `plan` column with `.fillna("unknown")`. `.assign(plan=...)` returns a new frame and leaves the inputs alone.
@@q
What does `validate="many_to_one"` guarantee?
@@a
The right-side join keys are unique; many left-side rows may refer to the same right-side row.
@@q
Why use a left join when attaching metadata to events?
@@a
It retains every event, including those whose metadata is missing, rather than silently dropping them.
@@real
The same validation protects feature enrichment and financial reports from accidental row multiplication. Choose the relationship that matches your data: one-to-one, one-to-many, or many-to-one.
