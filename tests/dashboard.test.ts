import { describe, expect, it } from 'vitest'
import { LESSONS } from '../src/content'
import { TRACKS } from '../src/content/tracks'
import { accuracy, chapterLadder, compact, deckHealth, formatMinutes, kindBreakdown, minutesInvested, niceMax, recentCompletions, timeAgo, weekStart, weeklyXp } from '../src/lib/dashboard'
import { newCard } from '../src/lib/gamification'

const DAY = 86_400_000
const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12).getTime()
const done = (xp: number, when: number, extra: Partial<{ hints: number; attempts: number }> = {}) => ({ at: when, xp, hints: 0, attempts: 1, ...extra })

describe('weekly xp', () => {
  it('starts weeks on Monday', () => {
    expect(weekStart('2026-10-03')).toBe('2026-09-28') // Saturday -> Monday
    expect(weekStart('2026-09-28')).toBe('2026-09-28')
    expect(weekStart('2026-10-04')).toBe('2026-09-28') // Sunday belongs to the week before
  })
  it('buckets completions into the right week and drops old ones', () => {
    const completed = {
      a: done(30, at(2026, 10, 2)), // this week
      b: done(20, at(2026, 9, 27)), // Sunday of last week
      c: done(10, at(2026, 1, 1)), // long ago
    }
    const weeks = weeklyXp(completed, '2026-10-03', 4)
    expect(weeks.map((w) => w.start)).toEqual(['2026-09-07', '2026-09-14', '2026-09-21', '2026-09-28'])
    expect(weeks.map((w) => w.xp)).toEqual([0, 0, 20, 30])
    expect(weeks.map((w) => w.lessons)).toEqual([0, 0, 1, 1])
  })
})

describe('accuracy and time', () => {
  it('is null before any completion', () => {
    expect(accuracy({})).toEqual({ firstTry: null, hintFree: null, avgAttempts: null })
    expect(minutesInvested({})).toBe(0)
  })
  it('computes first-try and hint-free shares', () => {
    const a = accuracy({ x: done(1, 1), y: done(1, 1, { attempts: 3, hints: 2 }), z: done(1, 1, { attempts: 1, hints: 1 }), w: done(1, 1, { attempts: 2 }) })
    expect(a.firstTry).toBeCloseTo(0.5)
    expect(a.hintFree).toBeCloseTo(0.5)
    expect(a.avgAttempts).toBeCloseTo(1.75)
  })
  it('sums nominal minutes of finished lessons and ignores unknown ids', () => {
    const [a, b] = LESSONS
    expect(minutesInvested({ [a.id]: 1, [b.id]: 1, ghost: 1 })).toBe(a.minutes + b.minutes)
  })
})

describe('breakdowns', () => {
  it('covers every lesson exactly once by kind', () => {
    const rows = kindBreakdown({})
    expect(rows.reduce((s, r) => s + r.total, 0)).toBe(LESSONS.length)
    expect(rows.every((r) => r.done === 0)).toBe(true)
    const boss = kindBreakdown({ [LESSONS.find((l) => l.kind === 'boss')!.id]: 1 }).find((r) => r.kind === 'boss')!
    expect(boss.done).toBe(1)
  })
  it('lists nine steps per chapter and points at the first unfinished one', () => {
    const rows = chapterLadder({})
    expect(rows.length).toBe(TRACKS.length)
    expect(rows.every((r) => r.steps.length === 9 && r.next === r.steps[0].lesson)).toBe(true)
    const np = rows[0]
    const all = Object.fromEntries(np.steps.map((s) => [s.lesson.id, 1]))
    const full = chapterLadder(all)[0]
    expect(full.done).toBe(9)
    expect(full.next).toBeNull()
    const partial = chapterLadder({ [np.steps[0].lesson.id]: 1, [np.steps[2].lesson.id]: 1 })[0]
    expect(partial.next?.id).toBe(np.steps[1].lesson.id)
  })
})

describe('deck health', () => {
  it('splits fresh, learning and mature cards and finds the hardest', () => {
    const now = 1_000_000
    const fresh = newCard('np-shapes', 0, 'q0', 'a', now - 1)
    const learning = { ...newCard('np-shapes', 1, 'q1', 'a', now), reps: 2, interval: 4, due: now + DAY, lapses: 1 }
    const mature = { ...newCard('np-shapes', 2, 'q2', 'a', now), reps: 6, interval: 30, due: now + 10 * DAY }
    const hard = { ...newCard('np-shapes', 3, 'q3', 'a', now), reps: 1, interval: 1, due: now - 5, lapses: 3, ease: 1.5 }
    const h = deckHealth({ a: fresh, b: learning, c: mature, d: hard }, now)
    expect(h.total).toBe(4)
    expect(h.due).toBe(2) // the fresh card (due in the past) and the hard one
    expect(h.fresh).toBe(1)
    expect(h.mature).toBe(1)
    expect(h.learning).toBe(2)
    expect(h.hardest.map((c) => c.q)).toEqual(['q3', 'q1'])
    expect(h.avgEase).toBeCloseTo((2.5 + 2.5 + 2.5 + 1.5) / 4)
  })
  it('handles an empty deck', () => {
    expect(deckHealth({}, 0)).toMatchObject({ total: 0, due: 0, learning: 0, mature: 0, fresh: 0, avgEase: null, hardest: [] })
  })
})

describe('recent completions and formatting', () => {
  it('orders newest first, limits, and skips unknown lessons', () => {
    const [a, b, c] = LESSONS
    const rows = recentCompletions({ [a.id]: done(1, 10), [b.id]: done(1, 30), [c.id]: done(1, 20), ghost: done(1, 99) }, 2)
    expect(rows.map((r) => r.lesson.id)).toEqual([b.id, c.id])
  })
  it('formats numbers, minutes and relative time', () => {
    expect(compact(950)).toBe('950')
    expect(compact(1284)).toBe('1.3K')
    expect(compact(12_000)).toBe('12K')
    expect(compact(1_250_000)).toBe('1.3M')
    expect(formatMinutes(0)).toBe('0m')
    expect(formatMinutes(45)).toBe('45m')
    expect(formatMinutes(135)).toBe('2h 15m')
    expect(formatMinutes(120)).toBe('2h')
    const now = 100 * DAY
    expect(timeAgo(now - DAY / 2, now)).toBe('today')
    expect(timeAgo(now - DAY, now)).toBe('yesterday')
    expect(timeAgo(now - 3 * DAY, now)).toBe('3 days ago')
    expect(timeAgo(now - 15 * DAY, now)).toBe('2w ago')
    expect(timeAgo(now - 70 * DAY, now)).toBe('2mo ago')
    expect(niceMax(0)).toBe(10)
    expect(niceMax(7)).toBe(10)
    expect(niceMax(130)).toBe(200)
    expect(niceMax(400)).toBe(500)
    expect(niceMax(500)).toBe(500)
  })
})
