import type { Step } from '../content/types'
import type { RunResult, TestResult } from '../engine/types'

export type StepState = 'done' | 'current' | 'todo'

/** Tests a given step check produced in this run. */
export const stepTests = (result: RunResult | null, index: number): TestResult[] => result?.tests.filter((t) => t.step === index) ?? []

/** Tests from the lesson's final check (no step tag). */
export const finalTests = (result: RunResult | null): TestResult[] => result?.tests.filter((t) => t.step === undefined) ?? []

/** A step is passed when its check ran and every test in it is green. */
export function stepPassed(result: RunResult | null, index: number): boolean {
  const ts = stepTests(result, index)
  return ts.length > 0 && ts.every((t) => t.ok)
}

/**
 * Which step to work on after a run: the first one that does not pass, or `steps.length` once
 * every step passes (the final checks remain). `null` when the run tells us nothing (crash,
 * runtime failure), so the learner keeps their place instead of being thrown back to step 1.
 */
export function firstOpenStep(result: RunResult | null, steps: Step[]): number | null {
  if (!result || result.error || result.infra) return null
  for (let i = 0; i < steps.length; i++) if (!stepPassed(result, i)) return i
  return steps.length
}

export const stepState = (index: number, current: number): StepState => (index < current ? 'done' : index === current ? 'current' : 'todo')
