import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { LESSON_BY_ID } from '../content'
import { ACHIEVEMENTS, type Achievement } from '../lib/achievements'
import { dayKey } from '../lib/dates'
import { QUEST_BONUS, QUEST_TARGET, levelFromXp, newCard, schedule, xpAward, type Grade } from '../lib/gamification'
import { idbStorage } from './idb'
import { STORE_VERSION, defaults, sanitize, type GuidedProgress, type Note, type Persisted, type Settings } from './model'

export interface CompletionSummary {
  xp: number
  levelUp: number | null
  badges: Achievement[]
  questBonus: number
  cardsAdded: number
  hints: number
  /** an already-finished lesson passed again with less help */
  redo: boolean
}

interface Actions {
  setCode: (id: string, code: string) => void
  setGuided: (id: string, progress: GuidedProgress) => void
  /** every run counts for stats; a graded run on `id` also counts toward that lesson's hint gate */
  recordRun: (id: string | undefined, vim: boolean) => void
  revealHint: (id: string) => number
  completeLesson: (id: string, attempts: number) => CompletionSummary | null
  missPredict: (id: string) => void
  gradeCard: (id: string, grade: Grade) => void
  setSetting: <K extends keyof Settings>(k: K, v: Settings[K]) => void
  setIntroPref: (id: string, v: 'open' | 'collapsed') => void
  setNote: (id: string, patch: Note) => void
  /** clear hints and saved code so a finished lesson can be passed again from memory */
  redoLesson: (id: string) => void
  setLastLesson: (id: string) => void
  exportJson: () => string
  importJson: (text: string) => { ok: true } | { ok: false; error: string }
  resetAll: () => void
}

export type Store = Persisted & Actions & { hydrated: boolean }

const PERSISTED_KEYS = Object.keys(defaults()) as (keyof Persisted)[]

function pickPersisted(s: Persisted): Persisted {
  const out: Record<string, unknown> = {}
  for (const k of PERSISTED_KEYS) out[k] = s[k]
  return out as unknown as Persisted
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...defaults(),
      hydrated: false,

      setCode: (id, code) => set((s) => ({ code: { ...s.code, [id]: code } })),
      setGuided: (id, progress) => set((s) => ({ guided: { ...s.guided, [id]: progress } })),

      recordRun: (id, vim) =>
        set((s) => {
          const today = dayKey()
          return {
            stats: { ...s.stats, runs: s.stats.runs + 1, vimRuns: s.stats.vimRuns + (vim ? 1 : 0) },
            activity: { ...s.activity, [today]: (s.activity[today] ?? 0) + 1 },
            tries: id ? { ...s.tries, [id]: (s.tries[id] ?? 0) + 1 } : s.tries,
          }
        }),

      revealHint: (id) => {
        const next = Math.min(3, (get().hints[id] ?? 0) + 1)
        set((s) => ({ hints: { ...s.hints, [id]: next } }))
        return next
      },

      completeLesson: (id, attempts) => {
        const s = get()
        const lesson = LESSON_BY_ID[id]
        if (!lesson) return null
        const prev = s.completed[id]
        const hints = s.hints[id] ?? 0
        if (prev && hints >= prev.hints) return null // nothing new learned since last time
        const now = Date.now()
        const today = dayKey(new Date(now))
        const gained = xpAward(lesson.xp, hints)
        const delta = prev ? gained - prev.xp : gained // a redo refunds the hint penalty

        let quest = s.quest.date === today ? { ...s.quest } : { date: today, done: 0, claimed: false }
        let questBonus = 0
        const cards = { ...s.cards }
        let cardsAdded = 0
        if (!prev) {
          quest.done += 1
          if (!quest.claimed && quest.done >= QUEST_TARGET) {
            quest = { ...quest, claimed: true }
            questBonus = QUEST_BONUS
          }
          lesson.cards.forEach((c, i) => {
            const card = newCard(id, i, c.q, c.a, now)
            if (!cards[card.id]) {
              cards[card.id] = card
              cardsAdded++
            }
          })
        }

        const xp = s.xp + delta + questBonus
        const completed = { ...s.completed, [id]: { at: now, xp: gained, hints, attempts } }
        const activity = { ...s.activity, [today]: (s.activity[today] ?? 0) + 1 }

        const ctx = { completed, xp, activityDays: Object.keys(activity), stats: s.stats, now }
        const newBadges = ACHIEVEMENTS.filter((a) => !s.badges[a.id] && a.test(ctx))
        const badges = { ...s.badges }
        for (const b of newBadges) badges[b.id] = now

        const before = levelFromXp(s.xp)
        const after = levelFromXp(xp)
        set({ completed, xp, cards, activity, badges, quest, lastLesson: id })
        return { xp: delta, levelUp: after > before ? after : null, badges: newBadges, questBonus, cardsAdded, hints, redo: !!prev }
      },

      missPredict: (id) => {
        const lesson = LESSON_BY_ID[id]
        if (!lesson) return
        const now = Date.now()
        set((s) => {
          const cards = { ...s.cards }
          lesson.cards.forEach((c, i) => {
            const card = newCard(id, i, c.q, c.a, now)
            if (!cards[card.id]) cards[card.id] = card
          })
          return { cards, stats: { ...s.stats, predictMisses: s.stats.predictMisses + 1 } }
        })
      },

      gradeCard: (id, grade) =>
        set((s) => {
          const card = s.cards[id]
          if (!card) return {}
          const today = dayKey()
          return {
            cards: { ...s.cards, [id]: schedule(card, grade, Date.now()) },
            stats: { ...s.stats, reviews: s.stats.reviews + 1 },
            activity: { ...s.activity, [today]: (s.activity[today] ?? 0) + 1 },
          }
        }),

      setSetting: (k, v) => set((s) => ({ settings: { ...s.settings, [k]: v } })),
      setIntroPref: (id, v) => set((s) => ({ intro: { ...s.intro, [id]: v } })),
      setNote: (id, patch) => set((s) => ({ notes: { ...s.notes, [id]: { ...s.notes[id], ...patch } } })),
      redoLesson: (id) =>
        set((s) => {
          const { [id]: _code, ...code } = s.code
          const { [id]: _guided, ...guided } = s.guided
          return { code, guided, hints: { ...s.hints, [id]: 0 }, tries: { ...s.tries, [id]: 0 } }
        }),
      setLastLesson: (id) => set({ lastLesson: id }),

      exportJson: () =>
        JSON.stringify({ app: 'orbit', version: STORE_VERSION, exportedAt: new Date().toISOString(), data: pickPersisted(get()) }, null, 2),

      importJson: (text) => {
        try {
          const parsed = JSON.parse(text)
          if (!parsed || parsed.app !== 'orbit' || typeof parsed.data !== 'object') return { ok: false, error: 'This is not an Orbit export file.' }
          set({ ...sanitize(parsed.data) })
          return { ok: true }
        } catch {
          return { ok: false, error: 'Could not read that file as JSON.' }
        }
      },

      resetAll: () => set({ ...defaults() }),
    }),
    {
      name: 'orbit-progress',
      version: STORE_VERSION,
      storage: createJSONStorage(() => idbStorage),
      partialize: (s) => pickPersisted(s),
      merge: (persisted, current) => ({ ...current, ...sanitize(persisted) }),
      migrate: (persisted) => sanitize(persisted) as unknown as Store,
      onRehydrateStorage: () => () => useStore.setState({ hydrated: true }),
    },
  ),
)
