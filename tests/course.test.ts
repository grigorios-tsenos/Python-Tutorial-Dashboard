import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { COURSE, COURSE_BY_KEY, COURSE_LESSONS, PATH_BY_ID, continueKey, courseXp, nextCourseKey, phaseGrade, pickSpread, prevCourseKey, splitArticle, stripHeader, typeKind } from '../src/content/course'
import { AREAS, PLACEMENT, entryPhase, planFromPhase, planFromPlacement, planHours } from '../src/content/placement'
import { sanitize } from '../src/store/model'
import { useStore } from '../src/store/useStore'
import { renderCourseMarkdown, resolveCourseHref } from '../src/ui/CourseMarkdown'
import { run } from './pyodide-node'

const PUBLIC = 'public/curriculum'

describe('course index', () => {
  it('covers the whole curriculum and every lesson file it promises exists', () => {
    expect(COURSE.phases.length).toBe(20)
    expect(COURSE_LESSONS.length).toBe(523)
    expect(new Set(COURSE_LESSONS.map((e) => e.key)).size).toBe(523)
    for (const { key, lesson } of COURSE_LESSONS) {
      expect(existsSync(`${PUBLIC}/${key}/en.md`), key).toBe(true)
      expect(existsSync(`${PUBLIC}/${key}/main.py`), key).toBe(lesson.code)
      expect(existsSync(`${PUBLIC}/${key}/quiz.json`), key).toBe(lesson.quiz > 0)
      expect(lesson.minutes).toBeGreaterThan(0)
      expect(lesson.title.length).toBeGreaterThan(0)
    }
  })
  it('quizzes are normalized multiple-choice questions with a valid answer', () => {
    for (const { key, lesson } of COURSE_LESSONS.filter((e) => e.lesson.quiz)) {
      const quiz = JSON.parse(readFileSync(`${PUBLIC}/${key}/quiz.json`, 'utf8'))
      expect(quiz.length, key).toBe(lesson.quiz)
      for (const q of quiz) {
        expect(['pre', 'check', 'post']).toContain(q.stage)
        expect(q.options.length).toBeGreaterThanOrEqual(2)
        expect(q.correct).toBeGreaterThanOrEqual(0)
        expect(q.correct).toBeLessThan(q.options.length)
      }
    }
  })
  it('learning paths only reference real lessons', () => {
    expect(COURSE.paths.length).toBeGreaterThan(5)
    for (const p of COURSE.paths) for (const key of p.lessons) expect(COURSE_BY_KEY[key], `${p.id}: ${key}`).toBeDefined()
  })
  it('orders lessons across phases and scores XP by length', () => {
    expect(prevCourseKey(COURSE_LESSONS[0].key)).toBeNull()
    expect(nextCourseKey(COURSE_LESSONS[0].key)).toBe(COURSE_LESSONS[1].key)
    expect(nextCourseKey(COURSE_LESSONS.at(-1)!.key)).toBeNull()
    expect(courseXp(45)).toBe(23)
    expect(courseXp(5)).toBe(20)
    expect(courseXp(1800)).toBe(60)
    expect(typeKind('Learn + Build')).toBe('Learn')
    expect(typeKind('Build (Capstone)')).toBe('Capstone')
    expect(COURSE.phases.map((p) => p.hours)).toEqual([14, 23, 21, 15, 27, 30, 18, 14, 14, 13, 26, 19, 65, 43, 55, 20, 28, 32, 31, 620])
  })
})

describe('study plan (the curriculum\'s placement and tutor loop)', () => {
  it('placement maps a score to an entry phase and marks 1/2 areas for review', () => {
    expect(PLACEMENT.length).toBe(10)
    for (let a = 0; a < AREAS.length; a++) expect(PLACEMENT.filter((q) => q.area === a).length).toBe(2)
    expect([0, 3, 4, 5, 6, 7, 8, 9, 10].map(entryPhase)).toEqual([1, 1, 3, 3, 7, 7, 11, 11, 14])
    const plan = planFromPlacement([2, 1, 2, 1, 2], COURSE.phases, 1)
    expect(plan).toMatchObject({ at: 1, score: 8, entry: 11 })
    expect(plan.status['00-setup-and-tooling']).toBe('skip')
    expect(plan.status['01-math-foundations']).toBe('skip')
    expect(plan.status['02-ml-fundamentals']).toBe('review')
    expect(plan.status['05-nlp-foundations-to-advanced']).toBe('review')
    expect(plan.status['07-transformers-deep-dive']).toBe('review')
    expect(plan.status['10-llms-from-scratch']).toBe('skip')
    expect(plan.status['11-llm-engineering']).toBe('do')
    expect(plan.status['19-capstone-projects']).toBe('do')
    expect(planHours(plan, COURSE.phases)).toBe(21 + 30 + 14 + 19 + 65 + 43 + 55 + 20 + 28 + 32 + 31 + 620)
    const self = planFromPhase(7, COURSE.phases)
    expect(self.score).toBeNull()
    expect(self.status['06-speech-and-audio']).toBe('skip')
    expect(self.status['07-transformers-deep-dive']).toBe('do')
  })
  it('continueKey follows the open lesson, then the active path, then the plan', () => {
    const plan = planFromPhase(3, COURSE.phases)
    const first3 = COURSE_LESSONS.find((e) => e.phase.n === 3)!.key
    expect(continueKey({}, null, null, null)).toBe(COURSE_LESSONS[0].key)
    expect(continueKey({}, null, plan, null)).toBe(first3)
    expect(continueKey({ [first3]: true }, null, plan, null)).toBe(nextCourseKey(first3))
    const open = COURSE_LESSONS[5].key
    expect(continueKey({}, open, plan, null)).toBe(open)
    expect(continueKey({ [open]: true }, open, plan, null)).toBe(first3) // the next lesson is in a skipped phase
    expect(continueKey({ [open]: true }, open, null, null)).toBe(COURSE_LESSONS[6].key) // no plan: carry on after the last one
    expect(continueKey({ [first3]: true }, first3, plan, null)).toBe(nextCourseKey(first3))
    const mcp = PATH_BY_ID['model-context-protocol']
    expect(continueKey({}, null, plan, mcp.id)).toBe(mcp.lessons[0])
    expect(continueKey({ [mcp.lessons[0]]: true }, null, plan, mcp.id)).toBe(mcp.lessons[1])
    expect(continueKey({}, open, plan, mcp.id)).toBe(mcp.lessons[0])
    expect(nextCourseKey(mcp.lessons[0], mcp.id)).toBe(mcp.lessons[1])
    expect(prevCourseKey(mcp.lessons[1], mcp.id)).toBe(mcp.lessons[0])
    expect(nextCourseKey(mcp.lessons.at(-1)!, mcp.id)).toBeNull()
    expect(nextCourseKey(COURSE_LESSONS[0].key, mcp.id)).toBe(COURSE_LESSONS[1].key)
  })
  it('splits the article before Use It, spreads phase-check picks, grades like check-understanding', () => {
    expect(splitArticle('## The Problem\na\n## Build It\nb\n## Use It\nc\n## Ship It\nd')).toEqual(['## The Problem\na\n## Build It\nb\n', '## Use It\nc\n## Ship It\nd'])
    expect(splitArticle('## Only\nx')).toEqual(['## Only\nx', ''])
    const [head, tail] = splitArticle(stripHeader(readFileSync(`${PUBLIC}/02-ml-fundamentals/02-linear-regression/en.md`, 'utf8')))
    expect(head).toContain('## Build It')
    expect(tail.startsWith('## Use It')).toBe(true)
    const twenty = Array.from({ length: 20 }, (_, i) => i)
    expect(pickSpread([1, 2, 3], 8)).toEqual([1, 2, 3])
    expect(pickSpread(twenty, 4, 0)).toEqual([0, 5, 10, 15])
    expect(pickSpread(twenty, 4, 1)).toEqual([1, 6, 11, 16])
    expect(pickSpread(twenty, 4, 5)).toEqual([0, 5, 10, 15])
    expect([8, 7, 6, 4, 2].map((n) => phaseGrade(n, 8).label)).toEqual(['Mastered', 'Mastered', 'Almost', 'Developing', 'Start over'])
  })
})

describe('course markdown', () => {
  const key = '02-ml-fundamentals/02-linear-regression'
  it('strips the title and metadata the page header already shows', () => {
    const md = readFileSync(`${PUBLIC}/${key}/en.md`, 'utf8')
    const body = stripHeader(md)
    expect(body.startsWith('## Learning Objectives')).toBe(true)
    expect(body).not.toMatch(/^\*\*Time:\*\*/m)
  })
  it('rewrites relative links to routes, figures and the source repo', () => {
    expect(resolveCourseHref('../assets/attention.svg', key)).toBe('/curriculum/02-ml-fundamentals/02-linear-regression/assets/attention.svg')
    expect(resolveCourseHref('../../../13-tools-and-protocols/28-mcp-tool-contracts-and-content/docs/en.md', key)).toBe('#/course/13-tools-and-protocols/28-mcp-tool-contracts-and-content')
    expect(resolveCourseHref('../../03-logistic-regression/', key)).toBe('#/course/02-ml-fundamentals/03-logistic-regression')
    expect(resolveCourseHref('../code/main.py', key)).toBe(`${COURSE.source}/blob/main/phases/02-ml-fundamentals/02-linear-regression/code/main.py`)
    expect(resolveCourseHref('../../../../README.md', key)).toBe(`${COURSE.source}/blob/main/README.md`)
    expect(resolveCourseHref('https://example.com/x', key)).toBe('https://example.com/x')
    expect(resolveCourseHref('#the-concept', key)).toBe('#the-concept')
  })
  it('renders mermaid fences as diagram placeholders and python with highlighting', () => {
    const html = renderCourseMarkdown('```mermaid\nflowchart TD\n  A --> B\n```\n\n```python\nx = 1\n```\n\n[next](../../03-logistic-regression/)', key)
    expect(html).toContain('<pre class="mermaid">flowchart TD')
    expect(html).toContain('<span class="tok-n">1</span>')
    expect(html).toContain('href="#/course/02-ml-fundamentals/03-logistic-regression"')
  })
})

describe('course progress', () => {
  it('sanitize keeps real course lessons and drops the rest', () => {
    const s = sanitize({
      course: { '02-ml-fundamentals/02-linear-regression': { at: 1, score: 9, total: 5, xp: 45 }, 'nope/nope': { at: 1, score: 1, total: 1, xp: 1 } },
      courseCode: { '02-ml-fundamentals/02-linear-regression': 'print(1)', 'nope/nope': 'x' },
      courseLast: 'nope/nope',
    })
    expect(s.course).toEqual({ '02-ml-fundamentals/02-linear-regression': { at: 1, score: 5, total: 5, xp: 45 } })
    expect(s.courseCode).toEqual({ '02-ml-fundamentals/02-linear-regression': 'print(1)' })
    expect(s.courseLast).toBeNull()
  })
  it('completeCourseLesson pays XP for a pass, refuses a fail, and only tops up on a better retake', () => {
    useStore.getState().resetAll()
    const st = useStore.getState()
    const key = '02-ml-fundamentals/02-linear-regression' // 90 min → 45 XP
    expect(st.completeCourseLesson(key, 3, 5)).toBeNull() // 60 % fails
    expect(st.completeCourseLesson(key, 4, 5)).toMatchObject({ xp: 36, redo: false })
    expect(st.completeCourseLesson(key, 4, 5)).toBeNull()
    expect(st.completeCourseLesson(key, 5, 5)).toMatchObject({ xp: 9, redo: true })
    expect(useStore.getState().xp).toBe(45)
    expect(useStore.getState().course[key]).toMatchObject({ score: 5, total: 5, xp: 45 })
    expect(st.completeCourseLesson('14-agent-engineering/01-the-agent-loop', 0, 0)?.xp).toBe(courseXp(COURSE_BY_KEY['14-agent-engineering/01-the-agent-loop'].lesson.minutes))
    expect(st.completeCourseLesson('nope/nope', 1, 1)).toBeNull()
  })
  it('a failed quiz queues the lesson for review and a pass clears it; phase checks keep the best; the plan is validated', () => {
    useStore.getState().resetAll()
    const st = useStore.getState()
    const key = '02-ml-fundamentals/03-logistic-regression'
    expect(st.completeCourseLesson(key, 1, 5)).toBeNull()
    expect(useStore.getState().courseReview[key]).toBeGreaterThan(0)
    expect(st.completeCourseLesson(key, 5, 5)).not.toBeNull()
    expect(useStore.getState().courseReview[key]).toBeUndefined()
    st.setPhaseCheck('01-math-foundations', 5, 8)
    st.setPhaseCheck('01-math-foundations', 3, 8)
    expect(useStore.getState().coursePhaseCheck['01-math-foundations'].score).toBe(5)
    st.setPhaseStatus('03-deep-learning-core', 'skip')
    expect(useStore.getState().coursePlan?.status['03-deep-learning-core']).toBe('skip')
    st.setCoursePath('agent-skills')
    expect(useStore.getState().coursePathActive).toBe('agent-skills')
    const s = sanitize({
      coursePlan: { at: 1, score: 7, areas: [2, 2, 2, 1, 0], entry: 7, status: { '01-math-foundations': 'skip', nope: 'do', '02-ml-fundamentals': 'maybe' } },
      courseReview: { 'nope/x': 1, '02-ml-fundamentals/02-linear-regression': 5 },
      coursePhaseCheck: { '01-math-foundations': { at: 1, score: 9, total: 8 }, nope: { at: 1, score: 1, total: 8 } },
      coursePathActive: 'model-context-protocol',
    })
    expect(s.coursePlan).toEqual({ at: 1, score: 7, areas: [2, 2, 2, 1, 0], entry: 7, status: { '01-math-foundations': 'skip' } })
    expect(s.courseReview).toEqual({ '02-ml-fundamentals/02-linear-regression': 5 })
    expect(s.coursePhaseCheck).toEqual({ '01-math-foundations': { at: 1, score: 8, total: 8 } })
    expect(s.coursePathActive).toBe('model-context-protocol')
    expect(sanitize({ coursePathActive: 'nope', coursePlan: 'x' })).toMatchObject({ coursePathActive: null, coursePlan: null })
  })
})

describe('course scripts run under Pyodide', () => {
  const sample = ['14-agent-engineering/01-the-agent-loop', '02-ml-fundamentals/02-linear-regression', '01-math-foundations/02-vectors-matrices-operations']
  it.each(sample)('%s prints without errors', async (key) => {
    const { lesson } = COURSE_BY_KEY[key]
    expect(lesson.code && lesson.needs.length === 0, `${key} should be marked runnable`).toBe(true)
    const r = await run(readFileSync(`${PUBLIC}/${key}/main.py`, 'utf8'), undefined, lesson.packages)
    expect(r.error, r.error ?? '').toBeNull()
    expect(r.stdout.trim().length).toBeGreaterThan(20)
  })
})
