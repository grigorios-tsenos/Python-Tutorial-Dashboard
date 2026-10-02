import { loadPyodide } from 'pyodide'
import { installPython, runCell, BASE_PACKAGES } from '../src/engine/install'
import type { RunResult } from '../src/engine/types'

let pyPromise: Promise<any> | null = null
const loaded = new Set<string>()

export async function getPy() {
  if (!pyPromise) {
    pyPromise = (async () => {
      const py = await loadPyodide({ packageCacheDir: '.pyodide-cache' })
      await py.loadPackage(BASE_PACKAGES)
      BASE_PACKAGES.forEach((p) => loaded.add(p))
      await installPython(py as any)
      return py
    })()
  }
  return pyPromise
}

export async function run(code: string, check?: string, packages: string[] = []): Promise<RunResult> {
  const py = await getPy()
  const need = packages.filter((p) => !loaded.has(p))
  if (need.length) {
    await py.loadPackage(need)
    need.forEach((p) => loaded.add(p))
  }
  return runCell(py as any, code, check)
}
