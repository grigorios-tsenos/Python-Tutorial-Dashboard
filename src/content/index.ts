import { parseLesson } from './parse'
import { TRACKS } from './tracks'
import type { Lesson, TrackId } from './types'

const files = import.meta.glob('./lessons/**/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

export const LESSONS: Lesson[] = Object.entries(files)
  .map(([path, src]) => parseLesson(src, path))
  .sort((a, b) => TRACKS.findIndex((t) => t.id === a.track) - TRACKS.findIndex((t) => t.id === b.track) || a.order - b.order)

export const LESSON_BY_ID: Record<string, Lesson> = Object.fromEntries(LESSONS.map((l) => [l.id, l]))

export function lessonsOf(track: TrackId): Lesson[] {
  return LESSONS.filter((l) => l.track === track)
}

export function nextLessonId(id: string): string | null {
  const l = LESSON_BY_ID[id]
  if (!l) return null
  const t = lessonsOf(l.track)
  const i = t.findIndex((x) => x.id === id)
  if (i < t.length - 1) return t[i + 1].id
  const ti = TRACKS.findIndex((x) => x.id === l.track)
  for (let k = 1; k <= TRACKS.length; k++) {
    const nt = TRACKS[(ti + k) % TRACKS.length]
    const first = lessonsOf(nt.id)[0]
    if (first && first.id !== id) return first.id
  }
  return null
}
