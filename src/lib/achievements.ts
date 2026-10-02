import { LESSONS, lessonsOf } from '../content'
import { TRACKS } from '../content/tracks'
import { bestStreak, levelFromXp } from './gamification'

export interface AchievementCtx {
  completed: Record<string, { at: number; hints: number }>
  xp: number
  activityDays: string[]
  stats: { runs: number; vimRuns: number; reviews: number; predictMisses: number }
  now: number
}

export interface Achievement {
  id: string
  name: string
  desc: string
  icon: string
  test: (c: AchievementCtx) => boolean
}

const done = (c: AchievementCtx) => Object.keys(c.completed)

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-run', name: 'Hello, Orbit', desc: 'Run your first piece of code', icon: '▶', test: (c) => c.stats.runs >= 1 },
  { id: 'first-star', name: 'First Light', desc: 'Light your first star', icon: '✦', test: (c) => done(c).length >= 1 },
  { id: 'five-stars', name: 'Five Alive', desc: 'Complete 5 lessons', icon: '✧', test: (c) => done(c).length >= 5 },
  { id: 'twenty-stars', name: 'Galaxy Brain', desc: 'Complete 20 lessons', icon: '❂', test: (c) => done(c).length >= 20 },
  {
    id: 'constellation', name: 'Constellation Lit', desc: 'Finish every lesson in a track', icon: '★',
    test: (c) => TRACKS.some((t) => lessonsOf(t.id).every((l) => c.completed[l.id])),
  },
  {
    id: 'cartographer', name: 'Cartographer', desc: 'Complete a lesson in 4 different tracks', icon: '◈',
    test: (c) => TRACKS.filter((t) => lessonsOf(t.id).some((l) => c.completed[l.id])).length >= 4,
  },
  {
    id: 'unassisted', name: 'Unassisted', desc: 'Beat a boss without a single hint', icon: '⚔',
    test: (c) => LESSONS.some((l) => l.kind === 'boss' && c.completed[l.id] && c.completed[l.id].hints === 0),
  },
  { id: 'streak-3', name: 'On a Roll', desc: '3-day streak', icon: '🔥', test: (c) => bestStreak(c.activityDays) >= 3 },
  { id: 'streak-7', name: 'Unstoppable', desc: '7-day streak', icon: '☄', test: (c) => bestStreak(c.activityDays) >= 7 },
  { id: 'vim', name: 'Esc :wq', desc: 'Run code 5 times in Vim mode', icon: '⌨', test: (c) => c.stats.vimRuns >= 5 },
  { id: 'memory', name: 'Memory Palace', desc: 'Review 10 flashcards', icon: '🧠', test: (c) => c.stats.reviews >= 10 },
  { id: 'level-5', name: 'Level 5', desc: 'Reach level 5', icon: '⬆', test: (c) => levelFromXp(c.xp) >= 5 },
  {
    id: 'night-owl', name: 'Night Owl', desc: 'Finish a lesson between midnight and 5am', icon: '☾',
    test: (c) => Object.values(c.completed).some((v) => new Date(v.at).getHours() < 5),
  },
]

export const ACHIEVEMENT_BY_ID = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]))
