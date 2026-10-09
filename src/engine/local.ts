import type { RunResult } from './types'

/** Run a course script on this machine through the dev server (scripts/local-runner.mjs): for the lessons the browser cannot run. */
export async function runLocal(key: string, code: string, signal?: AbortSignal): Promise<RunResult> {
  const t0 = Date.now()
  try {
    const r = await fetch('/__run', { method: 'POST', headers: { 'content-type': 'application/json', 'x-orbit-run': '1' }, body: JSON.stringify({ key, code }), signal })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return (await r.json()) as RunResult
  } catch (e) {
    const msg = signal?.aborted ? 'Stopped.' : `This script runs on your machine, which needs the dev server: start the app with \`npm run dev\` (uv does the Python side). ${String((e as Error)?.message ?? e)}`
    return { ok: false, stdout: '', error: msg, result: null, html: [], emits: [], tests: [], ms: Date.now() - t0, infra: msg }
  }
}
