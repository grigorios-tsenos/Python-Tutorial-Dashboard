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

Events have many rows per user; a user lookup should have **one** plan per user. If the lookup accidentally lists a user twice, a plain merge copies every one of that user's events. Totals inflate, nothing crashes, and the report is fiction.

Two merge arguments stop that: `how="left"` keeps every event even when its user is missing from the lookup, and `validate="many_to_one"` makes pandas raise `pd.errors.MergeError` the moment the right side has duplicate keys.

> **Mission:** implement `attach_plans(events, users)`. `events` has columns `event_id`, `user_id`, `amount`; `users` has `user_id`, `plan`. Return those event columns plus `plan`, keeping the event rows in their original order. Fill missing plans with `"unknown"`. Reject duplicate user lookup keys through merge validation, and keep both input frames unchanged.

The same function must work with new user IDs and empty events; do not hard-code the demo.

@@step Left-join the plans onto the events
`merge` is pandas' JOIN. The left frame's rows set the output; `on=` names the key column present in both:

```python
joined = events.merge(users, on="user_id", how="left", sort=False)
```

- `how="left"`: every event survives; an event whose user is not in `users` gets `NaN` for `plan`.
- `sort=False`: keep the events' order rather than sorting by key.

**Do:** merge and return `joined`, then Run. Event 9 (user 3) should show `NaN` for now.
@@stepcheck
import pandas as pd
E = pd.DataFrame({"event_id": [7, 8, 9], "user_id": [2, 1, 3], "amount": [5, 20, 10]})
U = pd.DataFrame({"user_id": [1, 2], "plan": ["pro", "free"]})
out = attach_plans(E, U)
test("left join retains all event rows in order, plus a plan column", lambda: list(out.columns) == ["event_id", "user_id", "amount", "plan"] and out["event_id"].tolist() == [7, 8, 9], 'events.merge(users, on="user_id", how="left", sort=False)')
@@step Fill the missing plans
A missing plan should read `"unknown"`, not `NaN`. `fillna` on the column does it, and `assign` returns a **new** frame with that column replaced, so nothing upstream is mutated:

```python
return joined.assign(plan=joined["plan"].fillna("unknown"))
```

**Do:** fill and return, then Run.
@@stepcheck
import pandas as pd
E = pd.DataFrame({"event_id": [7, 8, 9], "user_id": [2, 1, 3], "amount": [5, 20, 10]})
U = pd.DataFrame({"user_id": [1, 2], "plan": ["pro", "free"]})
test("missing users receive an unknown plan", lambda: attach_plans(E, U)["plan"].tolist() == ["free", "pro", "unknown"], 'joined["plan"].fillna("unknown")')
@@step Refuse duplicate lookup keys
Add `validate="many_to_one"` to the merge. It states the relationship you expect: many events per user, **one** lookup row per user. If the lookup breaks that promise, pandas raises instead of multiplying rows.

**Do:** add the argument, then Run. The step check feeds a lookup with a duplicated user and expects `MergeError`.
@@stepcheck
import pandas as pd
E = pd.DataFrame({"event_id": [7, 8, 9], "user_id": [2, 1, 3], "amount": [5, 20, 10]})
U = pd.DataFrame({"user_id": [1, 2], "plan": ["pro", "free"]})
def rejected():
    try:
        attach_plans(E, pd.concat([U, U.iloc[:1]], ignore_index=True))
    except pd.errors.MergeError:
        return True
    return False
test("duplicate lookup keys fail instead of inflating events", rejected, 'validate="many_to_one"')
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
