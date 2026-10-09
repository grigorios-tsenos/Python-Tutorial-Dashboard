// The vendored AI Engineering from Scratch course: index at build time, lesson files fetched on demand.
// Regenerate with `npm run sync:course` (scripts/sync-curriculum.mjs).
import index from './course/index.json'

export interface CourseLesson {
  dir: string
  n: number
  title: string
  tagline: string
  /** the curriculum's own label: Build, Learn, Capstone, "Learn + Build"… */
  type: string
  langs: string
  minutes: number
  /** a Python script ships with the lesson (main.py) */
  code: boolean
  /** imports that cannot load in the browser (torch, threading…); empty means it runs in Pyodide */
  needs: string[]
  /** extra Pyodide packages the script imports */
  packages: string[]
  /** number of quiz questions */
  quiz: number
}

export interface CoursePhase {
  dir: string
  n: number
  title: string
  blurb: string
  lessons: CourseLesson[]
}

export interface CoursePath {
  id: string
  title: string
  summary: string
  minutes: number
  /** lesson keys in order */
  lessons: string[]
}

export interface QuizQuestion {
  stage: 'pre' | 'check' | 'post'
  question: string
  options: string[]
  correct: number
  explanation: string
}

export interface CourseEntry {
  /** `<phase-dir>/<lesson-dir>`, the lesson's identity everywhere (routes, store, files) */
  key: string
  phase: CoursePhase
  lesson: CourseLesson
}

export const COURSE = index as { source: string; syncedAt: string; phases: CoursePhase[]; paths: CoursePath[] }

export const COURSE_LESSONS: CourseEntry[] = COURSE.phases.flatMap((phase) => phase.lessons.map((lesson) => ({ key: `${phase.dir}/${lesson.dir}`, phase, lesson })))
export const COURSE_BY_KEY: Record<string, CourseEntry> = Object.fromEntries(COURSE_LESSONS.map((e) => [e.key, e]))
export const PHASE_BY_DIR: Record<string, CoursePhase> = Object.fromEntries(COURSE.phases.map((p) => [p.dir, p]))
export const PATH_BY_ID: Record<string, CoursePath> = Object.fromEntries(COURSE.paths.map((p) => [p.id, p]))

export const coursePath = (key: string) => `#/course/${key}`
export const phasePath = (dir: string) => `#/course/${dir}`
export const learningPathPath = (id: string) => `#/course/path/${id}`

/** one stable hue per phase, spaced by the golden angle so neighbours never look alike */
export const phaseColor = (n: number) => `hsl(${Math.round((n * 137.508 + 160) % 360)} 72% 68%)`

/** XP for finishing a course lesson: half a point per minute of material, 20–60 */
export const courseXp = (minutes: number) => Math.min(60, Math.max(20, Math.round(minutes / 2)))

/** the first word of the curriculum's type label, for the chip: Build, Learn, Capstone */
export const typeKind = (type: string) => (/capstone/i.test(type) ? 'Capstone' : type.split(/\s*[+(]/)[0].trim() || 'Learn')

export function nextCourseKey(key: string): string | null {
  const i = COURSE_LESSONS.findIndex((e) => e.key === key)
  return i >= 0 && i < COURSE_LESSONS.length - 1 ? COURSE_LESSONS[i + 1].key : null
}
export function prevCourseKey(key: string): string | null {
  const i = COURSE_LESSONS.findIndex((e) => e.key === key)
  return i > 0 ? COURSE_LESSONS[i - 1].key : null
}

/** the lesson page shows title, tagline and the metadata line itself, so drop them from the article */
export function stripHeader(md: string): string {
  const lines = md.split('\n')
  let i = 0
  while (i < lines.length && i < 14) {
    const l = lines[i].trim()
    if (l === '' || l.startsWith('# ') || l.startsWith('> ') || /^\*\*(Type|Languages|Prerequisites|Time):\*\*/.test(l)) i++
    else break
  }
  return lines.slice(i).join('\n')
}

export const prereqOf = (md: string) => (/^\*\*Prerequisites:\*\*\s*(.+)$/m.exec(md)?.[1] ?? '').trim()

export interface CourseFiles {
  md: string
  code: string | null
  quiz: QuizQuestion[]
}

const cache = new Map<string, Promise<CourseFiles>>()
const base = () => `${import.meta.env.BASE_URL}curriculum/`

/** Fetch a lesson's text, script and quiz (cached for the session). */
export function fetchCourseLesson(key: string): Promise<CourseFiles> {
  let p = cache.get(key)
  if (!p) {
    const e = COURSE_BY_KEY[key]
    const text = async (file: string) => {
      const r = await fetch(`${base()}${key}/${file}`)
      if (!r.ok) throw new Error(`${file}: HTTP ${r.status}`)
      return r.text()
    }
    p = Promise.all([text('en.md'), e.lesson.code ? text('main.py') : null, e.lesson.quiz ? text('quiz.json').then((t) => JSON.parse(t) as QuizQuestion[]) : []]).then(([md, code, quiz]) => ({ md, code, quiz }))
    p.catch(() => cache.delete(key))
    cache.set(key, p)
  }
  return p
}
