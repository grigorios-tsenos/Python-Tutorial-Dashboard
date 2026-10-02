# Orbit — learn AI engineering by doing

An interactive, local-first tutorial dashboard for engineers moving into AI engineering and data science.
Every lesson runs **real Python in your browser** (Pyodide). No backend, no API keys, no setup. Progress is saved on your device.

```
npm install
npm run dev        # http://localhost:5173
```

| script | what it does |
|---|---|
| `npm run dev` | dev server |
| `npm run build` | typecheck + production build into `dist/` (static, host anywhere) |
| `npm test` | engine, shims, **every lesson executed under real Pyodide**, store/gamification logic |
| `npm run e2e` | build, then drive the app in a real browser (needs Chrome/Edge; set `BROWSER_PATH`) |

First load downloads the Python runtime (~15 MB from the jsDelivr CDN); the browser caches it afterwards.

## What's inside

**Map** of 8 constellations / 64 stars (pan, zoom, ⌘K): NumPy · Pandas · Python for AI · LangChain · LangGraph · MLflow · Databricks · Claude Code. Each has eight exercises that build like a real project (e.g. impute → standardize → classify → search in NumPy, or chunk → pack → retrieve in LangChain) and ends with a boss.

**Lesson kinds:** Run & Tweak · Visual Lab · Predict the output · Bug Hunt · Parsons puzzle · Build (auto-graded) · Boss.
**Visual walkthroughs:** all 64 lessons explain their purpose with animated teaching examples, Play/Back/Next controls and a check-your-reasoning prompt. Walkthrough code appears only after explicitly revealing the solution.
**Visual labs:** NumPy broadcasting, LangGraph step-through trace, MLflow run table + model registry.

**Engagement:** XP and levels, hints that cost XP, streaks, daily quest, spaced-repetition review deck, 13 achievements, stats page (skill radar, activity heatmap), command palette, light/dark theme, reduced-motion.
**Difficulty:** Guided → Practice → Challenge → Applied → Advanced → Production → Expert → Boss in each section. Later exercises use unfamiliar inputs and edge cases; the difficulty path shows your current step and completed exercises.
**Editor:** CodeMirror 6 with **Vim mode** (`:w` runs, `:q` returns to the map, cheat sheet), ⌘/Ctrl+Enter to run.
**Your data:** IndexedDB, versioned and validated; export/import JSON in Settings.

## How the AI libraries work offline

NumPy and pandas are the real thing. LangChain, LangGraph, MLflow, PySpark/Delta run on small in-repo
re-implementations with the same call shapes (`src/engine/py/shims/`), a deterministic fake LLM, and no network.
Each lesson has an "In the real world" note. Shims are intentionally minimal: they cover what the lessons teach.

## Adding a lesson

Drop a file in `src/content/lessons/<track>/NN-name.md`:

```
---
id: np-example            # kebab-case, unique
track: numpy              # see src/content/tracks.ts
order: 5
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

`predict` lessons use `@@choice` (each choice is a literal output) plus `answer: <index>` in the frontmatter and `@@explain`;
`parsons` lessons use `@@lines` (one valid order) plus a `@@check`.

Every lesson also opens with a code-free prerequisite warm-up in `src/content/warmups.ts`: introduce one concept per step, link earlier ideas, and include a prediction check before the full example. Playback pauses at unanswered checks; learners can still navigate freely. Singleton-axis warm-ups show nested containers without changing stored values.

Add a tailored teaching example in `src/content/walkthroughs.ts` with a purpose, steps, stable cell IDs and a reflection question. Predict lessons should use different values from the exercise. Walkthrough code is gated by the existing solution-reveal state.

`npm run build && node tests/e2e/walkthroughs.mjs` checks playback, mobile layouts and the solution gate in a fresh browser profile.

`npm test` then executes your lesson: the solution must pass the check, the starter must **not**, and predict answers must match real output.

## Layout

```
src/engine    Pyodide worker, runner (timeout + restart), shared installer, Python harness + shims
src/content   lesson parser, tracks, lessons/*.md
src/lib       pure logic: gamification, spaced repetition, achievements, router
src/store     zustand + IndexedDB, validation of untrusted data
src/ui        map, lesson, review, stats, settings, palette
src/labs      visual labs
.10x/         specs, ADRs, decision log and reviews from the build
```
