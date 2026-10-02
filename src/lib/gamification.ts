import { addDays } from './dates'

export const XP_PER_LEVEL_UNIT = 60
export const HINT_PENALTY = 0.15
export const QUEST_TARGET = 2
export const QUEST_BONUS = 30

export function levelFromXp(xp: number): number {
  return Math.floor(Math.sqrt(Math.max(0, xp) / XP_PER_LEVEL_UNIT)) + 1
}

export function xpForLevel(level: number): number {
  return XP_PER_LEVEL_UNIT * (level - 1) ** 2
}

export function levelProgress(xp: number) {
  const level = levelFromXp(xp)
  const floor = xpForLevel(level)
  const next = xpForLevel(level + 1)
  return { level, into: xp - floor, need: next - floor, pct: Math.min(1, (xp - floor) / (next - floor)) }
}

/** XP for finishing a lesson: each hint (the 3rd is the solution) costs 15%. */
export function xpAward(base: number, hintsUsed: number): number {
  const penalty = Math.min(Math.max(hintsUsed, 0), 3) * HINT_PENALTY
  return Math.max(1, Math.round(base * (1 - penalty)))
}

/** Consecutive active days ending today (or yesterday, so the streak survives until you've had a chance today). */
export function currentStreak(activeDays: Iterable<string>, today: string): number {
  const set = new Set(activeDays)
  let cursor = set.has(today) ? today : addDays(today, -1)
  if (!set.has(cursor)) return 0
  let n = 0
  while (set.has(cursor)) {
    n++
    cursor = addDays(cursor, -1)
  }
  return n
}

export function bestStreak(activeDays: Iterable<string>): number {
  const days = [...new Set(activeDays)].sort()
  let best = 0
  let run = 0
  let prev: string | null = null
  for (const d of days) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1
    best = Math.max(best, run)
    prev = d
  }
  return best
}

// ---------- spaced repetition (SM-2 lite) ----------

export interface Card {
  id: string
  lessonId: string
  q: string
  a: string
  due: number
  interval: number // days
  ease: number
  reps: number
  lapses: number
}

export type Grade = 0 | 1 | 2 | 3 // again, hard, good, easy
export const GRADE_LABEL = ['Again', 'Hard', 'Good', 'Easy'] as const

const DAY = 86_400_000
const AGAIN_DELAY = 10 * 60_000

export function newCard(lessonId: string, idx: number, q: string, a: string, now: number): Card {
  return { id: `${lessonId}#${idx}`, lessonId, q, a, due: now, interval: 0, ease: 2.5, reps: 0, lapses: 0 }
}

export function schedule(card: Card, grade: Grade, now: number): Card {
  if (grade === 0) {
    return { ...card, reps: 0, lapses: card.lapses + 1, interval: 0, ease: Math.max(1.3, card.ease - 0.2), due: now + AGAIN_DELAY }
  }
  const ease = Math.max(1.3, card.ease + (grade === 1 ? -0.15 : grade === 3 ? 0.15 : 0))
  const reps = card.reps + 1
  let interval: number
  if (reps === 1) interval = grade === 3 ? 3 : 1
  else if (reps === 2) interval = grade === 1 ? 2 : grade === 3 ? 6 : 4
  else interval = Math.max(card.interval + 1, Math.round(card.interval * ease * (grade === 1 ? 0.8 : grade === 3 ? 1.3 : 1)))
  return { ...card, reps, ease, interval, due: now + interval * DAY }
}

export function previewInterval(card: Card, grade: Grade, now: number): string {
  const next = schedule(card, grade, now)
  const ms = next.due - now
  if (ms < DAY) return `${Math.max(1, Math.round(ms / 60_000))}m`
  return `${Math.round(ms / DAY)}d`
}
