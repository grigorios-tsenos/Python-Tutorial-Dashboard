import type { RunResult } from './types'

/** The text a learner "sees" from a run: printed output plus the last expression's repr. */
export function outputText(r: Pick<RunResult, 'stdout' | 'result'>): string {
  return (r.stdout + (r.result ? r.result + '\n' : '')).trim()
}

export function allPassed(r: Pick<RunResult, 'ok' | 'tests'>): boolean {
  return r.ok && r.tests.length > 0 && r.tests.every((t) => t.ok)
}
