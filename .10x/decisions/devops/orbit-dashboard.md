# devops — orbit-dashboard
Static site: `npm run build` → `dist/`. Any static host. CI recipe: `npm ci && npm run typecheck && npm test && npm run build` (e2e optional, needs a Chromium). Rollback = redeploy previous `dist/` (client state is versioned and sanitised, so old/new bundles share IndexedDB safely: bump STORE_VERSION only with a migrate()).
Pyodide version is pinned in `src/engine/pyodide.worker.ts` (`PYODIDE_VERSION`) and in devDependency `pyodide` (used only by tests): keep them equal.
