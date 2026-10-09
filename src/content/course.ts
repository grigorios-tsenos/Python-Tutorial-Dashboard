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
  /** estimated hours from the curriculum's ROADMAP.md */
  hours: number
  lessons: CourseLesson[]
}

/** the learner's study plan (the curriculum's LEARNING.md): one status per phase, from placement or chosen by hand */
export type PhaseStatus = 'skip' | 'review' | 'do'
export interface CoursePlan {
  at: number
  /** placement score 0–10, or null when the entry phase was self-selected */
  score: number | null
  /** per-area placement scores (0–2 each), empty when self-selected */
  areas: number[]
  entry: number
  status: Record<string, PhaseStatus>
}
export const phaseStatus = (plan: CoursePlan | null | undefined, dir: string): PhaseStatus => plan?.status[dir] ?? 'do'


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

/** the lesson order the learner follows: a learning path when one is active and contains the lesson, otherwise the whole course */
function orderFor(key: string, pathId?: string | null): string[] {
  const path = pathId ? PATH_BY_ID[pathId] : undefined
  return path && path.lessons.includes(key) ? path.lessons : COURSE_LESSONS.map((e) => e.key)
}
export function nextCourseKey(key: string, pathId?: string | null): string | null {
  const order = orderFor(key, pathId)
  const i = order.indexOf(key)
  return i >= 0 && i < order.length - 1 ? order[i + 1] : null
}
export function prevCourseKey(key: string, pathId?: string | null): string | null {
  const order = orderFor(key, pathId)
  const i = order.indexOf(key)
  return i > 0 ? order[i - 1] : null
}

/**
 * What to open next (the tutor's Step 0): an unfinished lesson the learner opened last, else the first unfinished
 * lesson of the active learning path, else the lesson after the last one when it is still to do, else the first
 * unfinished lesson of the first phase the plan says to Do or Review.
 */
export function continueKey(progress: Record<string, unknown>, courseLast: string | null, plan: CoursePlan | null, pathId: string | null): string | null {
  if (courseLast && !progress[courseLast] && (!pathId || !PATH_BY_ID[pathId] || PATH_BY_ID[pathId].lessons.includes(courseLast))) return courseLast
  const path = pathId ? PATH_BY_ID[pathId] : undefined
  if (path) return path.lessons.find((k) => !progress[k]) ?? null
  const todo = (key: string | null) => !!key && !progress[key] && phaseStatus(plan, COURSE_BY_KEY[key].phase.dir) !== 'skip'
  const after = courseLast ? nextCourseKey(courseLast) : null
  if (todo(after)) return after
  return COURSE_LESSONS.find((e) => todo(e.key))?.key ?? null
}

/** n items spread evenly over a list; `seed` shifts the picks so retakes see different ones until the pool wraps */
export function pickSpread<T>(items: T[], n: number, seed = 0): T[] {
  if (items.length <= n) return items
  const step = items.length / n
  const shift = Math.abs(seed) % Math.max(1, Math.floor(step))
  return Array.from({ length: n }, (_, i) => items[Math.min(items.length - 1, Math.floor(i * step) + shift)])
}

/** the phase quiz grades of the curriculum's check-understanding skill (8 questions) */
export function phaseGrade(score: number, total: number): { label: string; advice: string } {
  const r = score / Math.max(1, total)
  if (r >= 7 / 8) return { label: 'Mastered', advice: 'You have a strong grasp of this phase. Move on to the next one.' }
  if (r >= 5 / 8) return { label: 'Almost', advice: 'Solid foundation. Review the lessons behind the questions you missed before moving on.' }
  if (r >= 3 / 8) return { label: 'Developing', advice: 'You are building understanding but need to revisit some lessons.' }
  return { label: 'Start over', advice: 'This phase needs more time. Work through the lessons again from the beginning.' }
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

/**
 * The curated lesson skeleton is problem → concept → build → use. Split the article before "Use It" (or the first
 * section after the build) so the check-stage questions sit between building and using; [article, ''] when there is no such section.
 */
export function splitArticle(md: string): [string, string] {
  const m = /^## (Use It|Ship It|Verify It|Exercises|Key Terms)\b.*$/m.exec(md)
  return m ? [md.slice(0, m.index), md.slice(m.index)] : [md, '']
}

export const prereqOf = (md: string) => (/^\*\*Prerequisites:\*\*\s*(.+)$/m.exec(md)?.[1] ?? '').trim()

export interface CourseFiles {
  md: string
  code: string | null
  quiz: QuizQuestion[]
}

const cache = new Map<string, Promise<CourseFiles>>()
const quizCache = new Map<string, Promise<QuizQuestion[]>>()
const base = () => `${import.meta.env.BASE_URL}curriculum/`

/** Just a lesson's quiz (for warm-ups and phase checks); [] when it has none. */
export function fetchCourseQuiz(key: string): Promise<QuizQuestion[]> {
  let p = quizCache.get(key)
  if (!p) {
    const e = COURSE_BY_KEY[key]
    p = !e?.lesson.quiz ? Promise.resolve([]) : fetch(`${base()}${key}/quiz.json`).then((r) => (r.ok ? (r.json() as Promise<QuizQuestion[]>) : Promise.reject(new Error(`quiz.json: HTTP ${r.status}`))))
    p.catch(() => quizCache.delete(key))
    quizCache.set(key, p)
  }
  return p
}

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
