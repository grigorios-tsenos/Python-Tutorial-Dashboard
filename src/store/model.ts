import { LESSON_BY_ID } from '../content'
import { COURSE_BY_KEY } from '../content/course'
import type { Card } from '../lib/gamification'

export const STORE_VERSION = 1

export interface Completion {
  at: number
  xp: number
  hints: number
  attempts: number
}

/** a finished course lesson: quiz score (total 0 = reading lesson marked as read) and the XP it earned */
export interface CourseProgress {
  at: number
  score: number
  total: number
  xp: number
}

export type MapLabels = 'all' | 'focus' | 'off'

/** how lesson intros open by default: full warm-up first, straight to the core demo, or collapsed */
export type IntroStyle = 'full' | 'quick' | 'code'
export const DEMO_SPEEDS = [5000, 3000, 1500] as const

/** how hard the app makes it to reach for help: see lib/learning.ts */
export const RIGORS = ['off', 'standard', 'strict'] as const

/** focus sprint lengths in minutes */
export const SPRINTS = [10, 15, 25, 45] as const
export type SprintMinutes = (typeof SPRINTS)[number]
export type Rigor = (typeof RIGORS)[number]

export const ACCENTS = ['mint', 'violet', 'amber', 'sky', 'rose'] as const
export type Accent = (typeof ACCENTS)[number]

/** dashboard panels the learner can hide; the KPI row is always shown */
export const DASHBOARD_PANELS = ['weekly', 'chapters', 'radar', 'kinds', 'deck', 'recent', 'journal', 'activity', 'achievements'] as const
export type DashboardPanel = (typeof DASHBOARD_PANELS)[number]

/** lesson page panes: guide width and editor height as fractions, and whether the guide is shown */
export interface Layout {
  guide: number
  editor: number
  guideOpen: boolean
}
export const DEFAULT_LAYOUT: Layout = { guide: 0.4, editor: 0.58, guideOpen: true }

export interface Settings {
  vim: boolean
  theme: 'dark' | 'light'
  reduceMotion: boolean
  /** star-title visibility on the map: every star, only next + hovered, or hover tooltips only */
  mapLabels: MapLabels
  introStyle: IntroStyle
  demoSpeed: number
  accent: Accent
  dashboardHidden: DashboardPanel[]
  rigor: Rigor
  layout: Layout
  sprint: SprintMinutes
}

export interface Note {
  /** what the learner wrote before the solution was shown */
  stuck?: string
  /** one-sentence takeaway written after passing */
  takeaway?: string
}

export interface GuidedProgress {
  step: number
  drafts: string[]
}

export interface Persisted {
  completed: Record<string, Completion>
  code: Record<string, string>
  guided: Record<string, GuidedProgress>
  hints: Record<string, number>
  xp: number
  activity: Record<string, number>
  cards: Record<string, Card>
  badges: Record<string, number>
  settings: Settings
  /** per-lesson intro visibility chosen by the learner; absent means "use the default rules" */
  intro: Record<string, 'open' | 'collapsed'>
  /** graded runs per lesson: the effort that unlocks hints */
  tries: Record<string, number>
  notes: Record<string, Note>
  quest: { date: string; done: number; claimed: boolean }
  stats: { runs: number; vimRuns: number; reviews: number; predictMisses: number }
  lastLesson: string | null
  /** AI Engineering from Scratch course, keyed by `<phase>/<lesson>` */
  course: Record<string, CourseProgress>
  courseCode: Record<string, string>
  courseLast: string | null
}

export function defaults(): Persisted {
  return {
    completed: {},
    code: {},
    guided: {},
    hints: {},
    xp: 0,
    activity: {},
    cards: {},
    badges: {},
    settings: { vim: false, theme: 'dark', reduceMotion: false, mapLabels: 'all', introStyle: 'code', demoSpeed: 3000, accent: 'mint', dashboardHidden: [], rigor: 'standard', layout: { ...DEFAULT_LAYOUT }, sprint: 15 },
    intro: {},
    tries: {},
    notes: {},
    quest: { date: '', done: 0, claimed: false },
    stats: { runs: 0, vimRuns: 0, reviews: 0, predictMisses: 0 },
    lastLesson: null,
    course: {},
    courseCode: {},
    courseLast: null,
  }
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const num = (v: unknown, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : d)
const oneOf = <T extends string | number>(options: readonly T[], v: unknown, fallback: T): T => (options.includes(v as T) ? (v as T) : fallback)
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
  if (isObj(raw.guided)) {
    for (const [id, v] of Object.entries(raw.guided)) {
      if (!LESSON_BY_ID[id] || !isObj(v) || !Array.isArray(v.drafts) || v.drafts.length > 100) continue
      if (!v.drafts.every((draft) => typeof draft === 'string' && draft.length < 100_000)) continue
      d.guided[id] = { step: Math.min(v.drafts.length, Math.max(0, Math.floor(num(v.step)))), drafts: v.drafts }
    }
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
    const s = raw.settings
    d.settings.vim = s.vim === true
    d.settings.theme = s.theme === 'light' ? 'light' : 'dark'
    d.settings.reduceMotion = s.reduceMotion === true
    d.settings.mapLabels = oneOf(['all', 'focus', 'off'] as const, s.mapLabels, 'all')
    d.settings.introStyle = oneOf(['full', 'quick', 'code'] as const, s.introStyle, 'code')
    d.settings.demoSpeed = oneOf(DEMO_SPEEDS, s.demoSpeed, 3000)
    d.settings.accent = oneOf(ACCENTS, s.accent, 'mint')
    d.settings.rigor = oneOf(RIGORS, s.rigor, 'standard')
    d.settings.sprint = oneOf(SPRINTS, s.sprint, 15)
    if (isObj(s.layout)) {
      const frac = (v: unknown, lo: number, hi: number, dflt: number) => Math.min(hi, Math.max(lo, num(v, dflt)))
      d.settings.layout = { guide: frac(s.layout.guide, 0.22, 0.65, DEFAULT_LAYOUT.guide), editor: frac(s.layout.editor, 0.25, 0.85, DEFAULT_LAYOUT.editor), guideOpen: s.layout.guideOpen !== false }
    }
    if (Array.isArray(s.dashboardHidden)) d.settings.dashboardHidden = [...new Set(s.dashboardHidden.filter((p): p is DashboardPanel => DASHBOARD_PANELS.includes(p)))]
  }
  if (isObj(raw.intro)) {
    for (const [id, v] of Object.entries(raw.intro)) if (LESSON_BY_ID[id] && (v === 'open' || v === 'collapsed')) d.intro[id] = v
  }
  if (isObj(raw.tries)) {
    for (const [id, v] of Object.entries(raw.tries)) if (LESSON_BY_ID[id]) d.tries[id] = Math.max(0, Math.floor(num(v)))
  }
  if (isObj(raw.notes)) {
    const text = (v: unknown) => (typeof v === 'string' && v.length <= 2000 ? v : undefined)
    for (const [id, v] of Object.entries(raw.notes)) {
      if (!LESSON_BY_ID[id] || !isObj(v)) continue
      const n: Note = {}
      if (text(v.stuck)) n.stuck = text(v.stuck)
      if (text(v.takeaway)) n.takeaway = text(v.takeaway)
      if (n.stuck || n.takeaway) d.notes[id] = n
    }
  }
  if (isObj(raw.quest) && typeof raw.quest.date === 'string') {
    d.quest = { date: raw.quest.date, done: Math.max(0, Math.floor(num(raw.quest.done))), claimed: raw.quest.claimed === true }
  }
  if (isObj(raw.stats)) {
    for (const k of ['runs', 'vimRuns', 'reviews', 'predictMisses'] as const) d.stats[k] = Math.max(0, Math.floor(num(raw.stats[k])))
  }
  d.lastLesson = typeof raw.lastLesson === 'string' && LESSON_BY_ID[raw.lastLesson] ? raw.lastLesson : null
  if (isObj(raw.course)) {
    for (const [key, v] of Object.entries(raw.course)) {
      if (!COURSE_BY_KEY[key] || !isObj(v)) continue
      const total = Math.max(0, Math.floor(num(v.total)))
      d.course[key] = { at: num(v.at), score: Math.min(total, Math.max(0, Math.floor(num(v.score)))), total, xp: Math.max(0, Math.floor(num(v.xp))) }
    }
  }
  if (isObj(raw.courseCode)) {
    for (const [key, v] of Object.entries(raw.courseCode)) if (COURSE_BY_KEY[key] && typeof v === 'string' && v.length < 200_000) d.courseCode[key] = v
  }
  d.courseLast = typeof raw.courseLast === 'string' && COURSE_BY_KEY[raw.courseLast] ? raw.courseLast : null
  return d
}
