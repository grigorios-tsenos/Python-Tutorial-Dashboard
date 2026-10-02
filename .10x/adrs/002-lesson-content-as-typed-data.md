# ADR-002: Lessons as typed TypeScript data with executable checks
**Status:** Accepted | **Date:** 2026-10-01 | **Feature:** orbit-dashboard
## Context
Content volume is the product. It must be verifiable and refactor-safe.
## Decision
Each lesson is a `Lesson` object (markdown body, starter, solution, Python `check`, hints, flashcards). A Vitest suite executes every solution/starter in real Pyodide (node) using the same bootstrap + shims as the browser worker.
## Alternatives Considered
| MDX files | nicer authoring | no type safety, harder to test | Not chosen |
| JSON/YAML | portable | no type checking of structure, escaping pain | Not chosen |
## Consequences
+ Broken lessons fail CI. − Long template strings in TS; acceptable.
