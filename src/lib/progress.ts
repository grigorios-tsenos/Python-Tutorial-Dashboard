import { LESSONS, lessonsOf, nextLessonId } from '../content'
import { TRACKS } from '../content/tracks'
import type { Lesson } from '../content/types'

export function trackProgress(completed: Record<string, unknown>) {
  return TRACKS.map((t) => {
    const ls = lessonsOf(t.id)
    const done = ls.filter((l) => completed[l.id]).length
    return { track: t, done, total: ls.length, pct: ls.length ? done / ls.length : 0 }
  })
}

/** The star to nudge the learner toward: continue where they left off, else the first unfinished lesson. */
export function recommended(completed: Record<string, unknown>, lastLesson: string | null): Lesson | null {
  const remaining = LESSONS.filter((l) => !completed[l.id])
  if (remaining.length === 0) return null
  if (lastLesson) {
    if (!completed[lastLesson]) return LESSONS.find((l) => l.id === lastLesson) ?? remaining[0]
    let id: string | null = lastLesson
    for (let i = 0; i < LESSONS.length && id; i++) {
      id = nextLessonId(id)
      if (id && !completed[id]) return LESSONS.find((l) => l.id === id) ?? remaining[0]
    }
  }
  return remaining[0]
}
