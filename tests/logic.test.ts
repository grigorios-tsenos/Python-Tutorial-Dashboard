import { describe, it, expect } from 'vitest'
import { addDays } from '../src/lib/dates'
import { bestStreak, currentStreak, levelFromXp, levelProgress, newCard, schedule, xpAward, xpForLevel } from '../src/lib/gamification'
import { sanitize } from '../src/store/model'
import { parseHash } from '../src/lib/router'
import { seededShuffle } from '../src/lib/shuffle'
import { parseLesson } from '../src/content/parse'
import { LESSONS } from '../src/content'
import { recommended } from '../src/lib/progress'

it('advances to unfinished challenges and stops when every lesson is done', () => {
  const done = { 'np-shapes': true, 'np-broadcast': true }
  expect(recommended(done, 'np-shapes')?.id).toBe('np-views')
  expect(recommended(done, 'np-views')?.id).toBe('np-views')
  expect(recommended(Object.fromEntries(LESSONS.map((l) => [l.id, true])), 'cc-report')).toBeNull()
})

describe('levels and xp', () => {
  it('level thresholds are consistent', () => {
    expect(levelFromXp(0)).toBe(1)
    expect(levelFromXp(59)).toBe(1)
    expect(levelFromXp(60)).toBe(2)
    for (let l = 1; l < 10; l++) expect(levelFromXp(xpForLevel(l))).toBe(l)
    const p = levelProgress(100)
    expect(p.level).toBe(2)
    expect(p.pct).toBeGreaterThan(0)
    expect(p.pct).toBeLessThan(1)
  })
  it('hints cost 15% each, capped at 3', () => {
    expect(xpAward(100, 0)).toBe(100)
    expect(xpAward(100, 1)).toBe(85)
    expect(xpAward(100, 3)).toBe(55)
    expect(xpAward(100, 9)).toBe(55)
  })
})

describe('streaks', () => {
  it('counts consecutive days ending today or yesterday', () => {
    const t = '2026-10-10'
    expect(currentStreak([], t)).toBe(0)
    expect(currentStreak([t], t)).toBe(1)
    expect(currentStreak([addDays(t, -1), addDays(t, -2)], t)).toBe(2)
    expect(currentStreak([addDays(t, -2)], t)).toBe(0)
    expect(currentStreak([t, addDays(t, -1), addDays(t, -3)], t)).toBe(2)
  })
  it('handles month boundaries and best streak', () => {
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01')
    expect(bestStreak(['2026-01-31', '2026-02-01', '2026-02-02', '2026-02-10'])).toBe(3)
  })
})

describe('spaced repetition', () => {
  const now = 1_000_000
  const c0 = newCard('x', 0, 'q', 'a', now)
  it('grows intervals and resets on lapse', () => {
    const c1 = schedule(c0, 2, now)
    expect(c1.interval).toBe(1)
    const c2 = schedule(c1, 2, now)
    expect(c2.interval).toBe(4)
    const c3 = schedule(c2, 2, now)
    expect(c3.interval).toBeGreaterThan(c2.interval)
    const lapsed = schedule(c3, 0, now)
    expect(lapsed.reps).toBe(0)
    expect(lapsed.lapses).toBe(1)
    expect(lapsed.due - now).toBe(10 * 60_000)
    expect(lapsed.ease).toBeGreaterThanOrEqual(1.3)
  })
  it('ease never drops below 1.3', () => {
    let c = c0
    for (let i = 0; i < 30; i++) c = schedule(c, 0, now)
    expect(c.ease).toBe(1.3)
  })
})

describe('sanitize (untrusted import)', () => {
  it('returns defaults for garbage', () => {
    for (const bad of [null, 5, 'x', [], { completed: 'no' }]) {
      const s = sanitize(bad)
      expect(s.xp).toBe(0)
      expect(s.completed).toEqual({})
    }
  })
  it('drops unknown lessons, clamps values, keeps good data', () => {
    const s = sanitize({
      xp: -50,
      completed: { 'np-shapes': { at: 5, xp: 20, hints: 99, attempts: 0 }, 'nope': { at: 1, xp: 1, hints: 0, attempts: 1 } },
      code: { 'np-shapes': 'x=1', ghost: 'y', 'np-views': 42 },
      activity: { '2026-10-01': 3, 'bad-key': 2 },
      settings: { vim: true, theme: 'neon', reduceMotion: 'yes', mapLabels: 'sometimes', introStyle: 'psychic', demoSpeed: 123 },
      intro: { 'np-shapes': 'collapsed', 'nope': 'collapsed', 'np-views': 'sideways' },
      '__proto__': { polluted: true },
    })
    expect(s.xp).toBe(0)
    expect(Object.keys(s.completed)).toEqual(['np-shapes'])
    expect(s.completed['np-shapes'].hints).toBe(3)
    expect(s.completed['np-shapes'].attempts).toBe(1)
    expect(s.code).toEqual({ 'np-shapes': 'x=1' })
    expect(s.activity).toEqual({ '2026-10-01': 3 })
    expect(s.settings).toEqual({ vim: true, theme: 'dark', reduceMotion: false, mapLabels: 'all', introStyle: 'full', demoSpeed: 3000 })
    expect(s.intro).toEqual({ 'np-shapes': 'collapsed' })
    expect(sanitize({ settings: { mapLabels: 'focus' } }).settings.mapLabels).toBe('focus')
    expect(sanitize({ settings: { introStyle: 'quick', demoSpeed: 1500 } }).settings).toMatchObject({ introStyle: 'quick', demoSpeed: 1500 })
    expect(({} as any).polluted).toBeUndefined()
  })
})

describe('router + shuffle + parser', () => {
  it('parses hashes', () => {
    expect(parseHash('')).toEqual({ name: 'map' })
    expect(parseHash('#/lesson/np-shapes')).toEqual({ name: 'lesson', id: 'np-shapes' })
    expect(parseHash('#/review')).toEqual({ name: 'review' })
    expect(parseHash('#/stats')).toEqual({ name: 'stats' })
    expect(parseHash('#/wat')).toEqual({ name: 'map' })
  })
  it('shuffle is deterministic and never the identity', () => {
    const a = [1, 2, 3, 4, 5, 6]
    expect(seededShuffle(a, 'x')).toEqual(seededShuffle(a, 'x'))
    for (const seed of ['a', 'b', 'c', 'd', 'e']) expect(seededShuffle(a, seed)).not.toEqual(a)
    expect(seededShuffle(a, 'x').slice().sort()).toEqual(a)
  })
  it('lesson parser rejects malformed files', () => {
    expect(() => parseLesson('no frontmatter')).toThrow()
    expect(() => parseLesson('---\nid: a\nkind: nope\n---\n')).toThrow(/bad kind/)
    expect(() => parseLesson('---\nid: a\nkind: run\n---\n@@q\nx\n')).toThrow(/mismatch/)
  })
})
