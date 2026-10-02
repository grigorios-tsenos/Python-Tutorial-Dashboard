# ADR-001: Run learner code in-browser with Pyodide
**Status:** Accepted | **Date:** 2026-10-01 | **Feature:** orbit-dashboard
## Context
Learners need real Python execution with zero setup. Local machine has Python 3.9 (too old for modern AI libs). Network features are deferred.
## Decision
Execute code in a Pyodide Web Worker; numpy/pandas are real; AI-framework APIs are provided by pure-Python shims with identical call shapes. Worker is terminated and restarted on timeout (20s) to survive infinite loops.
## Alternatives Considered
| Alternative | Pros | Cons | Why Not |
|---|---|---|---|
| FastAPI + local venv | Real libs | Setup friction, sandboxing arbitrary code, py3.9 | Violates zero-setup / local-first |
| Hybrid kernel adapter | Future-proof | More upfront architecture | Runner interface already isolates this seam |
## Consequences
+ Offline-capable after first load, safe sandbox, deterministic lessons. − Shims are not the real libs (documented in each lesson); first load downloads ~10-20MB (cached).
## Risks
Shim drift from real APIs -> each lesson shows the real import path and keeps shim surface minimal.
