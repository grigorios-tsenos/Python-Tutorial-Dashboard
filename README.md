# Orbit — learn AI engineering by doing

A local-first tutorial dashboard: 72 hands-on lessons in 8 chapters, running **real Python in your browser** (Pyodide). No backend, no API keys, no setup. Progress stays on your device.

```
npm install
npm run dev        # http://localhost:5173
```

| script | does |
|---|---|
| `npm run build` | typecheck + static build into `dist/` (host anywhere) |
| `npm test` | engine, shims, **every lesson under real Pyodide**, store logic |
| `npm run e2e` | build, then drive the app in a real browser (set `BROWSER_PATH`) |

First load fetches the Python runtime (~15 MB from jsDelivr); the browser caches it.

## What's inside

- **Map:** 8 constellations × 9 stars: NumPy · Pandas · Python for AI · LangChain · LangGraph · MLflow · Databricks · Claude Code. Each chapter climbs Basics → Guided → Practice → Challenge → Applied → Advanced → Production → Expert → Boss and builds like one project (impute → standardize → classify → search; chunk → pack → retrieve).
- **Lesson kinds:** Run & Tweak · Visual Lab · Predict · Bug Hunt · Parsons puzzle · Build (auto-graded) · Boss.
- **Guided intro per lesson:** a code-free warm-up with a prediction check, then an animated demo. Collapsible and remembered per lesson; the default (full / start at the demo / straight to code) lives in Settings.
- **Visual labs:** NumPy broadcasting grid, LangGraph step trace, MLflow run table + model registry.
- **Dashboard:** level, XP per week, first-try rate, chapter ladders, skill radar, lesson types, review-deck health, recent completions, activity heatmap, achievements. Hide any panel.
- **Learning loop:** hints unlock only after real attempts (runs or minutes, configurable: off / standard / strict), the solution asks what you tried first, every lesson ends with a one-sentence takeaway, and anything solved with help returns a day later to **redo from memory** (the XP penalty is refunded). The map shows today's loop: recall → redo → learn.
- **Engagement:** XP and levels, hints that cost XP, streaks, daily quest, spaced-repetition review deck, 13 achievements, ⌘K command palette.
- **Editor:** CodeMirror 6 with Vim mode (`:w` runs, `:q` returns to the map). Page keys work even when the editor is not focused: `i` focuses it, `r` or ⌘/Ctrl+Enter runs, `[` `]` move between lessons, ⌘/Ctrl+\\ hides the guide, `?` lists them all. Both panes are resizable (drag the bars, double-click to reset) and the layout is remembered.
- **Settings:** light/dark, five accent colours, reduced motion, star-title visibility, export/import JSON (IndexedDB, versioned and validated).

## How the AI libraries work offline

NumPy and pandas are the real thing. LangChain, LangGraph, MLflow and PySpark/Delta are small in-repo re-implementations with the same call shapes (`src/engine/py/shims/`), a deterministic fake LLM and no network. They cover what the lessons teach; each lesson ends with an "In the real world" note.

## Adding a lesson

Drop a file in `src/content/lessons/<track>/NN-name.md`:

```
---
id: np-example            # kebab-case, unique
track: numpy              # see src/content/tracks.ts
order: 5                  # 1..9 within the track; 9 is the boss
title: ...
tagline: ...
kind: build               # run | lab | predict | bug | parsons | build | boss
xp: 40
minutes: 6
packages: pydantic        # optional extra Pyodide packages
---
@@body        markdown shown to the learner
@@starter     code in the editor (predict: the code to read)
@@solution    reference solution
@@check       python run after the learner's code; use test("label", lambda: ...)
@@hint        (exactly two)
@@q / @@a     flashcards (pairs)
@@real        note about the real library
```

- `predict`: one `@@choice` per option (a literal output), `answer: <index>` in the frontmatter, and `@@explain`.
- `parsons`: `@@lines` (one valid order) plus a `@@check`.
- Every lesson also needs a warm-up in `src/content/warmups.ts` (code-free steps, prediction check last) and a demo in `src/content/walkthroughs.ts` (purpose, steps with stable cell ids, reflection question). Demo code appears only after the solution is revealed.

`npm test` then executes the lesson: the solution must pass, the starter must **not**, and predict answers must match real output. `npm run build && node tests/e2e/walkthroughs.mjs` checks intro playback and mobile layout in a real browser.

## Layout

```
src/engine    Pyodide worker, runner (timeout + restart), Python harness + shims
src/content   lesson parser, tracks, lessons/*.md, warm-ups, walkthroughs
src/lib       pure logic: gamification, spaced repetition, achievements, dashboard metrics, router
src/store     zustand + IndexedDB, validation of untrusted data
src/ui        map, lesson, review, dashboard, settings, palette
src/labs      visual labs and the guided intro player
.10x/         specs, ADRs, decision log and reviews from the build
```
