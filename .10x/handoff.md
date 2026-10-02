# Handoff
Product is feature-complete for the offline phase. Run `npm run dev`; `npm test` verifies every lesson.
Extension points: new lesson = one .md file (see README); new shim = a package under `src/engine/py/shims/`; real kernels = replace `runner.ts` behind the same `run(req) -> RunResult` interface.
Open items: see tech debt in decisions/sde/orbit-dashboard.md.
