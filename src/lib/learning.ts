import { LESSON_BY_ID } from '../content'
import type { Lesson } from '../content/types'
import type { Completion, Rigor } from '../store/model'

/**
 * Learning mechanics that make giving up cost effort instead of a click:
 * hints unlock after real attempts, the solution asks for a written stuck-note first,
 * and anything solved with help comes back a day later to be redone from memory.
 */

/** per tier (hint 1, hint 2, solution): graded runs OR minutes on the lesson, whichever comes first */
const GATES: Record<Rigor, { runs: number[]; minutes: number[]; note: boolean }> = {
  off: { runs: [0, 0, 0], minutes: [0, 0, 0], note: false },
  standard: { runs: [2, 4, 6], minutes: [3, 6, 10], note: true },
  strict: { runs: [3, 6, 10], minutes: [5, 10, 20], note: true },
}

export interface Gate {
  open: boolean
  runsLeft: number
  secondsLeft: number
  /** the solution tier asks for a stuck-note before it opens */
  needNote: boolean
}

/** Is tier `used` (0 = hint 1, 1 = hint 2, 2 = solution) unlocked after `runs` graded attempts and `seconds` on task? */
export function hintGate(rigor: Rigor, used: number, runs: number, seconds: number): Gate {
  const g = GATES[rigor]
  const tier = Math.min(Math.max(used, 0), 2)
  const runsLeft = Math.max(0, g.runs[tier] - runs)
  const secondsLeft = Math.max(0, g.minutes[tier] * 60 - seconds)
  return { open: runsLeft === 0 || secondsLeft === 0, runsLeft, secondsLeft, needNote: g.note && tier === 2 }
}

export const mmss = (seconds: number) => { const t = Math.ceil(seconds); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}` }

const DAY = 86_400_000
export const REDO_AFTER = DAY

/** Lessons finished with help, old enough to redo from memory: most-assisted first, then oldest. */
export function redoQueue(completed: Record<string, Completion>, now: number): Lesson[] {
  return Object.entries(completed)
    .filter(([id, c]) => c.hints > 0 && now - c.at >= REDO_AFTER && LESSON_BY_ID[id])
    .sort(([, a], [, b]) => b.hints - a.hints || a.at - b.at)
    .map(([id]) => LESSON_BY_ID[id])
}

/** Generic debugging moves, rotated by failed attempt count. None of them is the answer. */
const MOVES = [
  'Read the first failing check. Its label names the one behaviour to fix. Change one thing, run again.',
  'Print the value or shape right before the line you suspect. Guess what it will show before you look.',
  'Re-read only the mission bullet that matches the failing check. Most misses are a skipped word like "sorted" or "unchanged".',
  'Shrink the input: two rows, one column. Compute the expected answer by hand, then compare.',
  'Say out loud what each line does. The line you cannot explain is usually the bug.',
]
export const debugMove = (fails: number) => MOVES[Math.max(0, fails - 1) % MOVES.length]
