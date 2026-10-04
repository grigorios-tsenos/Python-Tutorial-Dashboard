import { LESSONS, LESSON_BY_ID, lessonsOf } from '../content'
import { TRACKS } from '../content/tracks'
import { KIND_LABEL, type Lesson, type LessonKind } from '../content/types'
import type { Completion } from '../store/model'
import { addDays, dayKey, parseKey } from './dates'
import type { Card } from './gamification'

const DAY = 86_400_000
export const MATURE_DAYS = 21

export interface WeekBucket {
  /** Monday of the week, as a day key */
  start: string
  xp: number
  lessons: number
}

/** Monday on or before `today`. */
export function weekStart(today: string): string {
  const offset = (parseKey(today).getDay() + 6) % 7
  return addDays(today, -offset)
}

/** XP from finished lessons per calendar week (Monday start), oldest first, ending with the current week. */
export function weeklyXp(completed: Record<string, Completion>, today: string, weeks = 12): WeekBucket[] {
  const current = weekStart(today)
  const first = parseKey(addDays(current, -7 * (weeks - 1))).getTime()
  const out: WeekBucket[] = Array.from({ length: weeks }, (_, i) => ({ start: addDays(current, -7 * (weeks - 1 - i)), xp: 0, lessons: 0 }))
  for (const c of Object.values(completed)) {
    const day = parseKey(dayKey(new Date(c.at))).getTime()
    const idx = Math.floor((day - first) / (7 * DAY))
    if (idx >= 0 && idx < weeks) {
      out[idx].xp += c.xp
      out[idx].lessons += 1
    }
  }
  return out
}

export interface Accuracy {
  /** share of finished lessons solved on the first run (null before any completion) */
  firstTry: number | null
  /** share finished without opening a hint */
  hintFree: number | null
  avgAttempts: number | null
}

export function accuracy(completed: Record<string, Completion>): Accuracy {
  const all = Object.values(completed)
  if (all.length === 0) return { firstTry: null, hintFree: null, avgAttempts: null }
  const firstTry = all.filter((c) => c.attempts <= 1).length / all.length
  const hintFree = all.filter((c) => c.hints === 0).length / all.length
  const avgAttempts = all.reduce((s, c) => s + c.attempts, 0) / all.length
  return { firstTry, hintFree, avgAttempts }
}

/** Estimated minutes spent, from each finished lesson's nominal length. */
export function minutesInvested(completed: Record<string, unknown>): number {
  return Object.keys(completed).reduce((s, id) => s + (LESSON_BY_ID[id]?.minutes ?? 0), 0)
}

export interface KindRow {
  kind: LessonKind
  label: string
  done: number
  total: number
}

export function kindBreakdown(completed: Record<string, unknown>): KindRow[] {
  return (Object.keys(KIND_LABEL) as LessonKind[])
    .map((kind) => {
      const ls = LESSONS.filter((l) => l.kind === kind)
      return { kind, label: KIND_LABEL[kind], done: ls.filter((l) => completed[l.id]).length, total: ls.length }
    })
    .filter((r) => r.total > 0)
}

export interface LadderRow {
  track: (typeof TRACKS)[number]
  steps: { lesson: Lesson; done: boolean }[]
  next: Lesson | null
  done: number
}

/** Each chapter's nine steps, with the first unfinished lesson as its next stop. */
export function chapterLadder(completed: Record<string, unknown>): LadderRow[] {
  return TRACKS.map((track) => {
    const steps = lessonsOf(track.id).map((lesson) => ({ lesson, done: !!completed[lesson.id] }))
    return { track, steps, next: steps.find((s) => !s.done)?.lesson ?? null, done: steps.filter((s) => s.done).length }
  })
}

export interface DeckHealth {
  total: number
  due: number
  /** reviewed at least once, interval under MATURE_DAYS */
  learning: number
  /** interval of MATURE_DAYS or more */
  mature: number
  /** never graded */
  fresh: number
  avgEase: number | null
  /** cards most often forgotten, up to `n` */
  hardest: Card[]
}

export function deckHealth(cards: Record<string, Card>, now: number, n = 3): DeckHealth {
  const all = Object.values(cards)
  const mature = all.filter((c) => c.interval >= MATURE_DAYS).length
  const fresh = all.filter((c) => c.reps === 0 && c.lapses === 0).length
  const hardest = all.filter((c) => c.lapses > 0).sort((a, b) => b.lapses - a.lapses || a.ease - b.ease || a.q.localeCompare(b.q)).slice(0, n)
  return {
    total: all.length,
    due: all.filter((c) => c.due <= now).length,
    learning: all.length - mature - fresh,
    mature,
    fresh,
    avgEase: all.length ? all.reduce((s, c) => s + c.ease, 0) / all.length : null,
    hardest,
  }
}

export interface RecentRow extends Completion {
  lesson: Lesson
}

export function recentCompletions(completed: Record<string, Completion>, n = 6): RecentRow[] {
  return Object.entries(completed)
    .flatMap(([id, c]) => (LESSON_BY_ID[id] ? [{ ...c, lesson: LESSON_BY_ID[id] }] : []))
    .sort((a, b) => b.at - a.at)
    .slice(0, n)
}

const compactFormat = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })
/** 1284 -> "1.3K", 950 -> "950", 1_250_000 -> "1.3M" */
export const compact = (n: number): string => compactFormat.format(n)

/** 135 -> "2h 15m", 45 -> "45m", 0 -> "0m" */
export function formatMinutes(min: number): string {
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`
}

export function timeAgo(at: number, now: number): string {
  const d = Math.floor((now - at) / DAY)
  if (d <= 0) return 'today'
  if (d === 1) return 'yesterday'
  if (d < 7) return `${d} days ago`
  if (d < 30) return `${Math.floor(d / 7)}w ago`
  return `${Math.floor(d / 30)}mo ago`
}

/** Clean axis ticks for a bar chart: 0, half, max (max rounded up to a friendly number). */
export function niceMax(v: number): number {
  if (v <= 0) return 10
  const pow = 10 ** Math.floor(Math.log10(v))
  const unit = v / pow
  const step = unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 5 ? 5 : 10
  return step * pow
}
