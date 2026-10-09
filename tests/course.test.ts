import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { COURSE, COURSE_BY_KEY, COURSE_LESSONS, courseXp, nextCourseKey, prevCourseKey, stripHeader, typeKind } from '../src/content/course'
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
