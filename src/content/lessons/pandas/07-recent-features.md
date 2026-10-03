---
id: pd-recent-features
track: pandas
order: 7
title: Build Features from a Time Window
tagline: A model at noon must never learn from an event that happened at one.
kind: build
xp: 60
minutes: 8
---
@@body
# Aggregate only what was known at prediction time

A lifetime total and a last-week total answer different questions. Time-bounded features describe recent behaviour, and the upper bound prevents **future data leakage**.

Parse times with `pd.to_datetime(..., errors="coerce", utc=True)`: bad timestamps become `NaT` and belong to no window, and UTC makes different offsets comparable.

> **Mission:** implement `recent_features(events, as_of, days=7)`. Inputs have `user`, `at` and `amount`. Keep events where `as_of - days < at <= as_of` (lower bound exclusive, upper inclusive), then return `user`, `n_events` and `revenue` per user, sorted by user, only for users with an event in the window. Invalid amounts count as `0`; invalid times are excluded. Keep the input unchanged; empty results keep the output columns; `days < 1` raises `ValueError`.
@@starter
import pandas as pd

def recent_features(events, as_of, days=7):
    """Per-user event counts and revenue in a bounded time window."""
    # TODO
    return pd.DataFrame(columns=["user", "n_events", "revenue"])

events = pd.DataFrame({
    "user": ["a", "a", "b"],
    "at": ["2026-01-02", "2026-01-08", "2026-01-09"],
    "amount": ["5", "12", "100"],
})
print(recent_features(events, "2026-01-08"))
@@solution
import pandas as pd

def recent_features(events, as_of, days=7):
    """Per-user event counts and revenue in a bounded time window."""
    if days < 1:
        raise ValueError("days must be positive")
    cutoff = pd.to_datetime(as_of, utc=True)
    clean = events.assign(
        at=pd.to_datetime(events["at"], errors="coerce", utc=True, format="mixed"),
        amount=pd.to_numeric(events["amount"], errors="coerce").fillna(0),
    )
    window = clean[(clean["at"] > cutoff - pd.Timedelta(days=days)) & (clean["at"] <= cutoff)]
    return window.groupby("user", sort=True).agg(n_events=("at", "size"), revenue=("amount", "sum")).reset_index()

events = pd.DataFrame({
    "user": ["a", "a", "b"],
    "at": ["2026-01-02", "2026-01-08", "2026-01-09"],
    "amount": ["5", "12", "100"],
})
print(recent_features(events, "2026-01-08"))
@@check
E = pd.DataFrame({
    "user": ["b", "a", "a", "a", "b", "c", "d"],
    "at": ["2026-01-07T12:00:00Z", "2026-01-01T12:00:00Z", "2026-01-01T12:00:01Z", "2026-01-08T12:00:00Z", "2026-01-09T00:00:00Z", "broken", "2026-01-08T14:00:00+02:00"],
    "amount": ["bad", "100", "2", "5", "200", "99", "3"],
})
original = E.copy(deep=True)
out = recent_features(E, "2026-01-08T12:00:00Z")
test("window boundaries exclude old and future events", lambda: out["user"].tolist() == ["a", "b", "d"] and out["n_events"].tolist() == [2, 1, 1])
test("invalid amounts become zero and UTC offsets agree", lambda: out["revenue"].tolist() == [7, 0, 3])
short = recent_features(E, "2026-01-08T12:00:00Z", days=2)
test("changing the window changes the features", lambda: short["n_events"].tolist() == [1, 1, 1] and short["revenue"].tolist() == [5, 0, 3])
test("input frame is unchanged", lambda: E.equals(original))
empty = recent_features(E, "2025-01-01")
test("no matching events retain the output schema", lambda: empty.empty and list(empty.columns) == ["user", "n_events", "revenue"])
test("empty input is supported", lambda: recent_features(E.iloc[:0], "2026-01-08").empty)
try:
    recent_features(E, "2026-01-08", days=0)
    rejected = False
except ValueError:
    rejected = True
test("non-positive window lengths are rejected", lambda: rejected)
@@hint
Parse times with `utc=True, errors="coerce", format="mixed"` for mixed timestamp formats. Build a mask with `times > cutoff - pd.Timedelta(days=days)` and `times <= cutoff`.
@@hint
Use `.assign(...)` to clean a new frame, then `groupby("user").agg(n_events=("at", "size"), revenue=("amount", "sum")).reset_index()`. Fill invalid numeric amounts with `0` before aggregating.
@@q
Why must a prediction-time feature exclude future events?
@@a
They were not available when the prediction would be made; including them leaks future information into the model.
@@q
How does `utc=True` help compare timestamps with different offsets?
@@a
It converts them to the same timezone, so equal instants compare equal despite different written offsets.
@@real
Feature pipelines often compute several windows, such as one day, one week and one month. The same cutoff discipline keeps offline training features consistent with what production could know at that moment.
