import type { RunResult } from './types'

/** Every .py file under ./py is mounted at /orbit_site (shared by worker + node tests). */
const PY_FILES = import.meta.glob('./py/**/*.py', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

export const BASE_PACKAGES = ['numpy', 'pandas']
export const SITE = '/orbit_site'

interface PyLike {
  FS: { mkdirTree(p: string): void; writeFile(p: string, d: string): void }
  runPython(code: string): any
  runPythonAsync(code: string): Promise<any>
  loadPackage(names: string[] | string): Promise<any>
  globals: { get(name: string): any }
}

export async function installPython(py: PyLike) {
  for (const [key, src] of Object.entries(PY_FILES)) {
    const rel = key.replace('./py/', '')
    const full = `${SITE}/${rel}`
    py.FS.mkdirTree(full.slice(0, full.lastIndexOf('/')))
    py.FS.writeFile(full, src)
  }
  // make every shim directory a regular importable package path
  py.runPython(
    `import sys\nfor p in ('${SITE}/shims', '${SITE}'):\n    if p not in sys.path: sys.path.insert(0, p)\nimport orbit_runtime`,
  )
}

export async function runCell(py: PyLike, code: string, check?: string, checks?: string[]): Promise<RunResult> {
  const mod = py.globals.get('orbit_runtime')
  try {
    const raw = await mod.orbit_run(code, check ?? null, checks?.length ? JSON.stringify(checks) : null)
    return JSON.parse(raw as string) as RunResult
  } finally {
    mod.destroy?.()
  }
}
