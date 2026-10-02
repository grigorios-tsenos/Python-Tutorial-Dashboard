import { LESSON_BY_ID } from '../content'
import type { Card } from '../lib/gamification'

export const STORE_VERSION = 1

export interface Completion {
  at: number
  xp: number
  hints: number
  attempts: number
}

export interface Settings {
  vim: boolean
  theme: 'dark' | 'light'
  reduceMotion: boolean
}

export interface Persisted {
  completed: Record<string, Completion>
  code: Record<string, string>
  hints: Record<string, number>
  xp: number
  activity: Record<string, number>
  cards: Record<string, Card>
  badges: Record<string, number>
  settings: Settings
  quest: { date: string; done: number; claimed: boolean }
  stats: { runs: number; vimRuns: number; reviews: number; predictMisses: number }
  lastLesson: string | null
}

export function defaults(): Persisted {
  return {
    completed: {},
    code: {},
    hints: {},
    xp: 0,
    activity: {},
    cards: {},
    badges: {},
    settings: { vim: false, theme: 'dark', reduceMotion: false },
    quest: { date: '', done: 0, claimed: false },
    stats: { runs: 0, vimRuns: 0, reviews: 0, predictMisses: 0 },
    lastLesson: null,
  }
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const num = (v: unknown, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : d)
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/

/** Validate untrusted data (IndexedDB contents or an imported file) into a safe Persisted object. */
export function sanitize(raw: unknown): Persisted {
  const d = defaults()
  if (!isObj(raw)) return d

  if (isObj(raw.completed)) {
    for (const [id, v] of Object.entries(raw.completed)) {
      if (LESSON_BY_ID[id] && isObj(v)) {
        d.completed[id] = { at: num(v.at), xp: Math.max(0, num(v.xp)), hints: Math.min(3, Math.max(0, num(v.hints))), attempts: Math.max(1, num(v.attempts, 1)) }
      }
    }
  }
  if (isObj(raw.code)) {
    for (const [id, v] of Object.entries(raw.code)) if (LESSON_BY_ID[id] && typeof v === 'string' && v.length < 100_000) d.code[id] = v
  }
  if (isObj(raw.hints)) {
    for (const [id, v] of Object.entries(raw.hints)) if (LESSON_BY_ID[id]) d.hints[id] = Math.min(3, Math.max(0, Math.floor(num(v))))
  }
  d.xp = Math.max(0, Math.floor(num(raw.xp)))
  if (isObj(raw.activity)) {
    for (const [k, v] of Object.entries(raw.activity)) if (DAY_KEY.test(k)) d.activity[k] = Math.max(0, Math.floor(num(v)))
  }
  if (isObj(raw.cards)) {
    for (const [id, c] of Object.entries(raw.cards)) {
      if (!isObj(c) || typeof c.lessonId !== 'string' || !LESSON_BY_ID[c.lessonId] || typeof c.q !== 'string' || typeof c.a !== 'string') continue
      d.cards[id] = {
        id, lessonId: c.lessonId, q: c.q, a: c.a, due: num(c.due), interval: Math.max(0, num(c.interval)),
        ease: Math.max(1.3, num(c.ease, 2.5)), reps: Math.max(0, num(c.reps)), lapses: Math.max(0, num(c.lapses)),
      }
    }
  }
  if (isObj(raw.badges)) for (const [id, v] of Object.entries(raw.badges)) d.badges[id] = num(v)
  if (isObj(raw.settings)) {
    d.settings.vim = raw.settings.vim === true
    d.settings.theme = raw.settings.theme === 'light' ? 'light' : 'dark'
    d.settings.reduceMotion = raw.settings.reduceMotion === true
  }
  if (isObj(raw.quest) && typeof raw.quest.date === 'string') {
    d.quest = { date: raw.quest.date, done: Math.max(0, Math.floor(num(raw.quest.done))), claimed: raw.quest.claimed === true }
  }
  if (isObj(raw.stats)) {
    for (const k of ['runs', 'vimRuns', 'reviews', 'predictMisses'] as const) d.stats[k] = Math.max(0, Math.floor(num(raw.stats[k])))
  }
  d.lastLesson = typeof raw.lastLesson === 'string' && LESSON_BY_ID[raw.lastLesson] ? raw.lastLesson : null
  return d
}
