# ADR-003: Zustand + IndexedDB (idb-keyval), versioned, exportable
**Status:** Accepted | **Date:** 2026-10-01 | **Feature:** orbit-dashboard
## Decision
Single persisted store, schema `version` field with migrate(), JSON export/import as the future sync seam. localStorage is not used for progress (size/async concerns); IndexedDB with graceful in-memory fallback.
## Alternatives Considered
| localStorage | simple | sync API, 5MB, blocks | Not chosen |
| SQLite wasm | queryable | heavy | YAGNI |
## Consequences
Hydration is async -> UI gates on `hydrated`.
