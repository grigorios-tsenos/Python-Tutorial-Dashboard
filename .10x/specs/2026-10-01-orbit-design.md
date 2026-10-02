# Orbit — Interactive Python Tutorial Dashboard (Design)

Audience: engineers who know Python/SWE basics, moving into AI engineering & data science.
Goal: a local-first, interactive, game-like dashboard that teaches pandas/numpy/LangChain/LangGraph/MLflow/Databricks/Claude Code. Network/social features are OUT of scope (phase 2).

## Decisions (approved by user 2026-10-01)
- Execution: in-browser Pyodide (Python 3.14, numpy 2.4, pandas 3.0) in a Web Worker. No backend.
- Frameworks without browser support (LangChain, LangGraph, MLflow, PySpark/Delta, Claude Code configs) run on faithful in-repo mini-implementations (`src/engine/py/shims`), deterministic fake LLM, no keys.
- Stack: Vite + React 19 + TypeScript, CodeMirror 6, Zustand + IndexedDB persistence, Vitest.
- User tweak: **Vim mode** for the editor (toggle, ex commands :w/:q, cheat sheet).

## Concept
Constellation map: each track is a constellation, each lesson a star; progress lights lines. Dark terminal-noir aesthetic.

## Lesson kinds
run (run & tweak), predict (commit to an output guess), bug (fix broken cell), parsons (order lines), build (auto-graded), lab (visual output), boss (multi-test capstone).
Visual labs driven by Python `orbit.emit(...)`: graph trace (LangGraph), run table (MLflow), broadcast grid (NumPy).

## Features
XP/levels/streaks, 3-tier hints (cost XP), daily quest, spaced-repetition review deck (SM-2 lite), achievements, command palette (Cmd/Ctrl+K), stats page (radar, heatmap), per-lesson code persistence + reset, JSON export/import, light/dark, keyboard-first, reduced-motion.

## Curriculum v1 (32 lessons, 8 tracks x 4, last of each is a boss)
NumPy, Pandas, Python for AI, LangChain, LangGraph, MLflow, Databricks (Spark/Delta/UC), Claude Code.

## Quality gate
Every lesson's solution must pass its own check under real Pyodide in CI (Vitest); every build/bug starter must fail it; every predict answer is verified by execution.

## Non-goals (v1)
Accounts, sync, leaderboards, real LLM calls, offline service worker, mobile-native.
