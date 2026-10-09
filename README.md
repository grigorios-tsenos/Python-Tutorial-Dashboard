# Orbit — learn AI and data science by doing

A local-first tutorial dashboard: 108 hands-on lessons in 12 chapters, running **real Python in your browser** (Pyodide). No backend, no API keys, no setup. Progress stays on your device.

```
npm install
npm run dev        # http://localhost:5173
```

| script | does |
|---|---|
| `npm run build` | typecheck + static build into `dist/` (host anywhere) |
| `npm test` | engine, shims, **every lesson and every step under real Pyodide**, store logic |
| `npm run e2e` | build, then drive the app in a real browser (set `BROWSER_PATH`) |

First load fetches the Python runtime (~15 MB from jsDelivr); the browser caches it. Chapters that need scipy, scikit-learn or matplotlib fetch those packages the first time you run a lesson in them.

## What's inside

- **Map:** 12 constellations × 9 stars, in learning order: NumPy · Pandas · Statistics · Visualization · Machine Learning · Neural Nets · Python for AI · LangChain · LangGraph · MLflow · Databricks · Claude Code. Each chapter climbs Basics → Guided → Practice → Challenge → Applied → Advanced → Production → Expert → Boss and builds like one project (impute → standardize → classify → search; split → metrics → pipeline → cross-validate → ship; neuron → forward → backprop → attention → train).
- **Lesson kinds:** Run & Tweak · Visual Lab · Predict · Bug Hunt · Parsons puzzle · Build (auto-graded) · Boss.
- **Step by step:** every coding lesson is a ladder of small steps. Each step explains one idea, shows the line to write (fully in early lessons, as a pattern in later ones, as a milestone in bosses) and has its own check. Only the current step is open; finished steps fold away, later ones wait dimmed. A bar above the editor always says what to do now. The final checks try new inputs and edge cases once every step passes.
- **Learning-friendly by design:** one thing to read and one thing to do at a time, calm visuals on lesson pages, a short "why this matters" instead of a wall of text, immediate per-step feedback, and a **Focus sprint** timer in the top bar (10/15/25/45 min) that tells you to take a break when it ends.
- **Guided intro per lesson:** an optional code-free warm-up with a prediction check, then an animated demo. Collapsed by default so the page stays short; one click opens it, the choice is remembered per lesson, and the default lives in Settings.
- **Visual labs:** NumPy broadcasting grid, LangGraph step trace, MLflow run table + model registry, and every matplotlib figure rendered below the output.
- **Dashboard:** level, XP per week, first-try rate, chapter ladders, skill radar, lesson types, review-deck health, recent completions, activity heatmap, achievements. Hide any panel.
- **Learning loop:** hints unlock only after real attempts (runs or minutes, configurable: off / standard / strict), the solution asks what you tried first, every lesson ends with a one-sentence takeaway, and anything solved with help returns a day later to **redo from memory** (the XP penalty is refunded).
- **Engagement:** XP and levels, hints that cost XP, streaks, daily quest, spaced-repetition review deck, achievements, ⌘K command palette.
- **Editor:** CodeMirror 6 with Vim mode (`:w` runs, `:q` returns to the map). Page keys work even when the editor is not focused: `i` focuses it, `r` or ⌘/Ctrl+Enter runs, `[` `]` move between lessons, ⌘/Ctrl+\\ hides the guide, `?` lists them all. Both panes are resizable and the layout is remembered.
- **Settings:** light/dark, five accent colours, reduced motion, star-title visibility, intro style, focus-sprint length, export/import JSON (IndexedDB, versioned and validated).

## How the libraries work offline

NumPy, pandas, scipy, scikit-learn and matplotlib are the real packages, loaded by Pyodide. LangChain, LangGraph, MLflow and PySpark/Delta are small in-repo re-implementations with the same call shapes (`src/engine/py/shims/`), a deterministic fake LLM and no network. They cover what the lessons teach; each lesson ends with an "In the real world" note.

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
packages: scikit-learn    # optional extra Pyodide packages
---
@@body        short markdown: why this matters, then the > **Mission:** block
@@step Title  one idea, the line(s) to write, and a **Do:** instruction (markdown)
@@stepcheck   python run after the learner's code; test("label", lambda: ..., "hint")
@@step ...    (at least two steps for run / lab / bug / build / boss)
@@starter     code in the editor (predict: the code to read)
@@solution    reference solution
@@check       final checks: new inputs and edge cases
@@hint        (exactly two)
@@q / @@a     flashcards (pairs)
@@real        note about the real library
```

- Step checks see the learner's globals, `__stdout__` and `__source__`. Every step check must **fail on the starter** and **pass on the solution**; `npm test` enforces both, plus the usual rules: the solution passes the final check, the starter does not, predict answers match real output.
- `predict`: one `@@choice` per option (a literal output), `answer: <index>` in the frontmatter, `@@explain`, and no steps.
- `parsons`: `@@lines` (one valid order) plus a `@@check`, no steps.
- Every lesson also needs a warm-up and a demo: `src/content/intros/<track>.ts` for the newer chapters, `src/content/warmups.ts` and `src/content/walkthroughs.ts` for the original ones (code-free steps with a prediction check last; demo steps with stable cell ids). Demo code appears only after the solution is revealed.

`npm run build && node tests/e2e/walkthroughs.mjs` checks intro playback and mobile layout in a real browser.

## Layout

```
src/engine    Pyodide worker, runner (timeout + restart), Python harness (per-step checks, figure capture) + shims
src/content   lesson parser, tracks, lessons/*.md, intro kit, warm-ups, walkthroughs
src/lib       pure logic: steps, gamification, spaced repetition, achievements, dashboard metrics, router
src/store     zustand + IndexedDB, validation of untrusted data
src/ui        map, lesson (steps, now bar, output), review, dashboard, settings, palette, focus sprint
src/labs      visual labs and the guided intro player
.10x/         specs, ADRs, decision log and reviews from the build
```
