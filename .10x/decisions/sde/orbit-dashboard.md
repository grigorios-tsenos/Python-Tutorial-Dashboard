# sde — orbit-dashboard (what was built)

- **Engine**: `orbit_runtime.py` (async cell runner: stdout capture, last-expression display, DataFrame HTML, top-level await, user-frame-only tracebacks, `test()` check API), `orbit.py` (emit channel to UI), `install.ts` shared by worker and node tests, `pyodide.worker.ts`, `runner.ts` (serialised runs, 20s timeout → terminate+restart, retry on CDN failure).
- **Shims** (pure Python, same API shapes): `langchain_core` (prompts, LCEL, parsers, tools, fake chat models), `langgraph` (StateGraph, reducers, conditional edges, MemorySaver, interrupt_before, prebuilt react agent, recursion limit, trace emit), `mlflow` (tracking, search_runs filter/order, pyfunc, registry+aliases), `pyspark.sql` (+Delta: versions, time travel, DESCRIBE HISTORY, DeltaTable delete/update/restore, SQL via sqlite, SQL NULL three-valued logic, aggregates inside expressions).
- **Content**: 32 lessons as `.md` files + parser/validator; 8 tracks x 4, last is a boss.
- **App**: map (SVG pan/zoom/focus), lesson workbench (CodeMirror 6 + Vim), Parsons board, predict panel, 3 visual labs, review (SM-2 lite), stats, settings (export/import/reset), command palette, toasts, celebration.
- **State**: zustand persist → IndexedDB; `sanitize()` guards persisted + imported data.

## Deviations from the approved spec
- Visual labs: 3 shipped (Broadcast, Graph trace, MLflow). The "DataFrame transform timeline" was descoped; pandas lessons render real DataFrames as tables instead.
- Lessons: 32 at launch (spec said "about 40" in conversation; spec file says 32).
- Added: lazy-loaded lesson screen (initial JS 119 kB gz).

## Tech debt
- Shims cover only what lessons use; no pyspark window functions/joins on expressions, no MLflow autolog.
- No service worker: Pyodide needs the network on first visit (browser-cached after).
- Map has no pinch-zoom on touch; mobile layout is functional, not optimised.
- `pandas` HTML output relies on pandas escaping (self-XSS only; see security review).
