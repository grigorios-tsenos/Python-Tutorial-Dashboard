# Orbit — learn AI and data science by doing

A local-first tutorial dashboard: 108 hands-on lessons in 12 chapters, running **real Python in your browser** (Pyodide). No backend, no API keys, no setup. Progress stays on your device.

```
npm install
npm run dev        # http://localhost:5173
```

| script | does |
|---|---|
| `npm run build` | typecheck + static build into `dist/` (host anywhere) |
| `npm test` | engine, shims, **every lesson and every guided step under real Pyodide**, store logic |
| `npm run e2e` | build, then drive the app in a real browser (set `BROWSER_PATH`) |
| `npm run sync:course` | re-vendor the AI Engineering from Scratch course from `$CURRICULUM_DIR` (default `~/ai-engineering-from-scratch`) |

First load fetches the Python runtime (~15 MB from jsDelivr); the browser caches it. Chapters that need scipy, scikit-learn or matplotlib fetch those packages the first time you run a lesson in them.

## What's inside

- **Map:** 12 constellations × 9 stars, in learning order: NumPy · Pandas · Statistics · Visualization · Machine Learning · Neural Nets · Python for AI · LangChain · LangGraph · MLflow · Databricks · Claude Code. Each chapter climbs Basics → Guided → Practice → Challenge → Applied → Advanced → Production → Expert → Boss and builds like one project (impute → standardize → classify → search; split → metrics → pipeline → cross-validate → ship; neuron → forward → backprop → attention → train).
- **Lesson kinds:** Run & Tweak · Visual Lab · Predict · Bug Hunt · Parsons puzzle · Build (auto-graded) · Boss.
- **Line by line practice:** every lesson opens with small guided goals, without showing the solution to type. Write your own approach, check its behavior, compare the expected result, and continue after it passes. Each step names its inputs and required outputs and has verification guidance and supportive feedback; the last step runs the original exercise checks. Prediction lessons trace one line at a time before choosing an answer. Guided drafts are saved separately from the full exercise editor, which is one click away.
- **Learning-friendly by design:** one thing to read and one thing to do at a time, calm visuals on lesson pages, a short "why this matters" instead of a wall of text, immediate per-step feedback, and a **Focus sprint** timer in the top bar (10/15/25/45 min) that tells you to take a break when it ends.
- **Guided intro per lesson:** an optional code-free warm-up with a prediction check, then an animated demo. Collapsed by default so the page stays short; one click opens it, the choice is remembered per lesson, and the default lives in Settings.
- **Visual labs:** NumPy broadcasting grid, LangGraph step trace, MLflow run table + model registry, and every matplotlib figure rendered below the output.
- **Dashboard:** level, XP per week, first-try rate, chapter ladders, skill radar, lesson types, review-deck health, recent completions, activity heatmap, achievements. Hide any panel.
- **Learning loop:** hints unlock only after real attempts (runs or minutes, configurable: off / standard / strict), the solution asks what you tried first, every lesson ends with a one-sentence takeaway, and anything solved with help returns a day later to **redo from memory** (the XP penalty is refunded).
- **Engagement:** XP and levels, hints that cost XP, streaks, daily quest, spaced-repetition review deck, achievements, ⌘K command palette.
- **Editor:** CodeMirror 6 with Vim mode (`:w` runs, `:q` returns to the map). Hover a function or class to see its signature and parameter docs, read from the library's own docstring. Page keys work even when the editor is not focused: `i` focuses it, `r` or ⌘/Ctrl+Enter runs, `[` `]` move between lessons, ⌘/Ctrl+\\ hides the guide, `?` lists them all. Both panes are resizable and the layout is remembered.
- **Settings:** light/dark, five accent colours, reduced motion, star-title visibility, intro style, focus-sprint length, export/import JSON (IndexedDB, versioned and validated).

## The Course: AI Engineering from Scratch

The **Course** tab carries the full [AI Engineering from Scratch](https://github.com/rohitg00/ai-engineering-from-scratch) curriculum (MIT): 523 lessons in 20 phases, from setup and math foundations to agents, infrastructure and capstones, plus its 12 learning paths (MCP, Agent Skills, applied AI engineer, …) as filters.

- **Lesson page:** the article on the left (diagrams render live; links to other lessons stay inside the app), the lesson's `main.py` in the editor on the right. Scripts that only need the standard library, NumPy, pandas, scipy or scikit-learn run in the browser (403 of 514); the rest (PyTorch, threads, subprocesses) are shown read-only with the command to run them locally.
- **Completion:** every lesson with a quiz ends with it (pre-reading, check and post-reading questions, one at a time, with explanations). 70 % passes and pays XP scaled to the lesson's length (20–60 XP); a better retake tops up the difference. Lessons without a quiz are marked as read. Course lessons count toward the daily quest, activity heatmap, level and the "Course lessons" dashboard tile.
- **Content pipeline:** `scripts/sync-curriculum.mjs` copies each lesson's text, script, quiz and figures into `public/curriculum/<phase>/<lesson>/` (fetched on demand) and writes the index `src/content/course/index.json` (titles, types, minutes, which scripts can run in Pyodide). Re-run it after pulling a new version of the course.
- **Tests:** `tests/course.test.ts` checks the index against the vendored files, link rewriting, progress sanitizing and runs three course scripts under Pyodide; `node tests/e2e/course.mjs` drives the Course pages in a real browser.

## How the libraries work offline

NumPy, pandas, scipy, scikit-learn and matplotlib are the real packages, loaded by Pyodide. LangChain, LangGraph, MLflow and PySpark/Delta are small in-repo re-implementations with the same call shapes (`src/engine/py/shims/`), a deterministic fake LLM and no network. They cover what the lessons teach; each lesson ends with an "In the real world" note.

Hover docs for the shimmed libraries come from the real packages, not the shims: `src/engine/py/official_docs.json` is a snapshot of their signatures and parameter docs. After adding or renaming a shim function, rebuild it with `uv run scripts/official_docs.py` (downloads the real packages into a throwaway environment).

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
@@starter     code in the editor (predict: the code to read)
@@solution    reference solution
@@check       python run after the learner's code; test("label", lambda: ..., "hint") sees the globals, __stdout__ and __source__
@@hint        (exactly two)
@@q / @@a     flashcards (pairs)
@@real        note about the real library
```

- `predict`: one `@@choice` per option (a literal output), `answer: <index>` in the frontmatter, and `@@explain`.
- `parsons`: `@@lines` (one valid order) plus a `@@check`.
- Every lesson also needs a warm-up and a demo: `src/content/intros/<track>.ts` for the newer chapters, `src/content/warmups.ts` and `src/content/walkthroughs.ts` for the original ones (code-free steps with a prediction check last; demo steps with stable cell ids). Demo code appears only after the solution is revealed.
- Coding lessons also need a `CodingGuide` in `src/content/guides/<track>.ts`: optional unchanged setup, then small goals with instructions, behavioral checks, expected results, and reassurance. Instructions must explain the inputs, required names and behavior without giving implementation code. Each step's `code` is an internal reference for curriculum tests and must never be rendered as instructions. Learner attempts run cumulatively; the last step also runs `@@check`. `tests/guided.test.ts` executes every checkpoint and the completed program in real Python. Prediction tracing guidance lives in `src/ui/PredictionGuide.tsx`.

`npm test` then executes the lesson: the solution must pass, the starter must **not**, predict answers must match real output, and every guided step must pass cumulatively. `npm run build && node tests/e2e/walkthroughs.mjs` checks intro playback and mobile layout in a real browser; `node tests/e2e/guided.mjs` drives the line-by-line practice.

## Layout

```
src/engine    Pyodide worker, runner (timeout + restart), Python harness (checks, figure capture, hover docs) + shims
src/content   lesson parser, tracks, lessons/*.md, intro kit, warm-ups, walkthroughs, line-by-line guides, course index
src/ui        … CourseView (phases + learning paths), CourseLessonView (article + script + quiz), CourseMarkdown, Quiz
public/curriculum  vendored AI Engineering from Scratch lessons (regenerate with npm run sync:course)
src/lib       pure logic: gamification, spaced repetition, achievements, dashboard metrics, router
src/store     zustand + IndexedDB, validation of untrusted data
src/ui        map, lesson (line-by-line practice, prediction tracing, output), review, dashboard, settings, palette, focus sprint
src/labs      visual labs and the guided intro player
scripts/      official_docs.py: rebuilds the hover-docs snapshot; sync-curriculum.mjs: re-vendors the course
.10x/         specs, ADRs, decision log and reviews from the build
```
