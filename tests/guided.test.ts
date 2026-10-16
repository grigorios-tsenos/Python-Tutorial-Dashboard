import { describe, expect, it, vi } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { LESSONS } from '../src/content'
import { CODING_GUIDES, guidedCheck, guidedSource, seedDraft } from '../src/content/guided'
import { allPassed } from '../src/engine/outputText'
import { sanitize } from '../src/store/model'
import { run } from './pyodide-node'
import { GuidedPractice } from '../src/ui/GuidedPractice'
import { OutputPanel } from '../src/ui/OutputPanel'

vi.mock('../src/engine/runner', async importOriginal => ({
  ...await importOriginal<typeof import('../src/engine/runner')>(),
  useRunnerStatus: () => ({ phase: 'idle', detail: '' }),
}))

const codingLessons = LESSONS.filter(lesson => lesson.kind !== 'predict')

it('provides a guided path with verification for every coding lesson', () => {
  expect(Object.keys(CODING_GUIDES).sort()).toEqual(codingLessons.map(lesson => lesson.id).sort())
  for (const lesson of codingLessons) {
    const guide = CODING_GUIDES[lesson.id]
    expect(guide.steps.length, lesson.id).toBeGreaterThan(1)
    for (const [index, step] of guide.steps.entries()) {
      for (const value of [step.title, step.instruction, step.code, step.expected]) expect(value.trim(), `${lesson.id} step ${index + 1}`).not.toBe('')
      expect(step.code.split('\n').length, `${lesson.id} step ${index + 1}: keep the writing small`).toBeLessThanOrEqual(8)
      for (const text of [step.instruction, step.expected, step.reassurance]) expect(text, `${lesson.id} step ${index + 1}: guidance contains no solution block`).not.toContain('```')
      expect(guidedCheck(guide, index, lesson.check), `${lesson.id} step ${index + 1}`).toContain('test(')
    }
  }
})

const lines = (code: string) => code.split('\n').map(line => line.trim()).filter(Boolean)

it('opens wrap and update steps on the learner\'s own code instead of asking them to retype it', () => {
  for (const lesson of codingLessons) {
    const steps = CODING_GUIDES[lesson.id].steps
    const written = new Set<string>()
    for (const [index, step] of steps.entries()) {
      const mine = lines(step.code)
      const from = step.startFrom ?? []
      expect([...from].sort((a, b) => a - b), `${lesson.id} step ${index + 1}`).toEqual([...new Set(from)])
      for (const earlier of from) {
        expect(earlier, `${lesson.id} step ${index + 1} starts from an earlier step`).toBeLessThan(index)
        expect(lines(steps[earlier].code).some(line => mine.includes(line)), `${lesson.id} step ${index + 1} builds on step ${earlier + 1}`).toBe(true)
      }
      const seeded = new Set(from.flatMap(earlier => lines(steps[earlier].code)))
      const retyped = mine.filter(line => written.has(line) && !seeded.has(line))
      expect(retyped.length, `${lesson.id} step ${index + 1} retypes ${JSON.stringify(retyped)}`).toBeLessThanOrEqual(3)
      mine.forEach(line => written.add(line))
    }
  }
})

it('seeds a step only with the learner\'s drafts, never the reference code', () => {
  const guide = { steps: [
    { title: 'a', instruction: 'a', code: 'x = 1', check: '', expected: 'a', reassurance: '' },
    { title: 'b', instruction: 'b', code: 'y = 2', check: '', expected: 'b', reassurance: '' },
    { title: 'c', instruction: 'c', code: 'def f():\n    x = 1\n    y = 2', check: '', expected: 'c', reassurance: '', startFrom: [0, 1] },
  ] }
  expect(seedDraft(guide, ['x = 10  ', 'y = 20'], 2)).toBe('x = 10\ny = 20')
  expect(seedDraft(guide, [], 2)).toBe('')
  expect(seedDraft(guide, ['x = 10'], 1)).toBe('')
})

it('renders goals and verification without showing reference implementation code', () => {
  for (const lesson of codingLessons) {
    const guide = CODING_GUIDES[lesson.id]
    const html = renderToStaticMarkup(createElement(GuidedPractice, { lesson, guide, runRef: { current: null }, onComplete: () => {} }))
    const task = html.split('<div class="guided-editor"')[0]
    expect(task, lesson.id).not.toContain('<pre>')
    expect(task, lesson.id).toContain('Write your own approach')
    expect(task, lesson.id).toContain('What to verify')
  }
})

it('keeps solution hints out of guided failure feedback while showing failed behaviors', () => {
  const html = renderToStaticMarkup(createElement(OutputPanel, {
    result: { ok: true, stdout: '', result: null, error: null, html: [], emits: [], ms: 1, tests: [{ label: 'The original data must stay unchanged', ok: false, msg: 'secret reference implementation' }] },
    running: false, graded: true, completed: false, showTestMessages: false,
  }))
  expect(html).toContain('The original data must stay unchanged')
  expect(html).not.toContain('secret reference implementation')
})

describe.each(codingLessons.map(lesson => [lesson.id, lesson] as const))('guided %s', (_id, lesson) => {
  it('each cumulative step passes, including the original full exercise checks at the end', async () => {
    const guide = CODING_GUIDES[lesson.id]
    const drafts = guide.steps.map(step => step.code)
    for (let index = 0; index < guide.steps.length; index++) {
      const result = await run(guidedSource(guide, drafts, index), guidedCheck(guide, index, lesson.check), lesson.packages)
      const context = `${lesson.id} step ${index + 1}: ${guide.steps[index].title}`
      expect(result.error, context).toBeNull()
      expect(result.tests.filter(test => !test.ok), context).toEqual([])
      expect(allPassed(result), context).toBe(true)
    }
  })
})

it('does not accept incorrect values or a program that merely runs', async () => {
  const guide = CODING_GUIDES['np-first-array']
  const index = guide.steps.findIndex(step => step.code.includes('scores ='))
  expect(index).toBeGreaterThanOrEqual(0)
  const drafts = guide.steps.map(step => step.code)
  drafts[index] = 'scores = [0]'
  const result = await run(guidedSource(guide, drafts, index), guidedCheck(guide, index, ''), [])
  expect(allPassed(result)).toBe(false)
})

it('accepts a learner implementation that differs from the reference code', async () => {
  const guide = CODING_GUIDES['np-first-array']
  const drafts = ['import numpy as np', 'scores = np.asarray(raw)', 'boosted = np.add(scores, 0.05)', 'print(np.average(boosted))']
  expect(drafts).not.toEqual(guide.steps.map(step => step.code))
  for (let index = 0; index < drafts.length; index++) {
    const result = await run(guidedSource(guide, drafts, index), guidedCheck(guide, index, codingLessons.find(lesson => lesson.id === 'np-first-array')!.check))
    expect(allPassed(result), JSON.stringify(result.tests)).toBe(true)
  }
})

it('validates saved guided drafts without changing full-editor code', () => {
  const state = sanitize({
    code: { 'np-first-array': 'my existing work' },
    guided: {
      'np-first-array': { step: 500, drafts: ['import numpy as np', 'scores = np.array([1])'] },
      'np-shapes': { step: -4, drafts: ['x = 1'] },
      'np-broadcast': { step: 1, drafts: [42] },
      ghost: { step: 1, drafts: ['x = 1'] },
    },
  })
  expect(state.code['np-first-array']).toBe('my existing work')
  expect(state.guided).toEqual({
    'np-first-array': { step: 2, drafts: ['import numpy as np', 'scores = np.array([1])'] },
    'np-shapes': { step: 0, drafts: ['x = 1'] },
  })
})
