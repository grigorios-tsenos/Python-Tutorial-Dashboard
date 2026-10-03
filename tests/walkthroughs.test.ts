import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LESSONS } from '../src/content'
import { WALKTHROUGHS } from '../src/content/walkthroughs'
import { LessonWalkthrough, layoutWalkthrough } from '../src/labs/LessonWalkthrough'

it('covers every lesson with a tailored teaching example', () => {
  expect([...Object.keys(WALKTHROUGHS), 'np-pairwise'].sort()).toEqual(LESSONS.map(l => l.id).sort())
  for (const data of Object.values(WALKTHROUGHS)) {
    expect(data.purpose.length).toBeGreaterThan(20)
    expect(data.steps.length).toBeGreaterThanOrEqual(4)
    expect(data.question).toBeTruthy()
    expect(data.answer).toBeTruthy()
    for (const step of data.steps) {
      expect(step.explanation).toBeTruthy()
      expect(step.code).toBeTruthy()
      expect(step.areas.length).toBeGreaterThan(0)
      const { cells } = layoutWalkthrough(step)
      expect(new Set(cells.map(c => c.id)).size, step.title).toBe(cells.length)
      for (const cell of cells) {
        expect(cell.text).toBeTruthy()
        expect(cell.x).toBeGreaterThanOrEqual(0)
        expect(cell.width).toBeGreaterThan(0)
        expect(cell.x + cell.width).toBeLessThanOrEqual(660)
      }
    }
  }
})

it('stacks stages at small widths and keeps every cell inside the diagram', () => {
  for (const data of Object.values(WALKTHROUGHS)) {
    for (const step of data.steps) {
      const layout = layoutWalkthrough(step, 280)
      for (const cell of layout.cells) {
        expect(cell.x + cell.width).toBeLessThanOrEqual(280)
        expect(cell.y + 48).toBeLessThanOrEqual(layout.height)
      }
      if (layout.areas.length > 1) expect(layout.areas[1].y).toBeGreaterThan(layout.areas[0].y)
    }
  }
})

it('keeps reshaped values identifiable while their positions change', () => {
  const [before, after] = WALKTHROUGHS['np-shapes'].steps.map(step => layoutWalkthrough(step).cells)
  expect(before.map(c => [c.id, c.text])).toEqual(after.map(c => [c.id, c.text]))
  expect(after.find(c => c.id === 'd')!.y).toBeGreaterThan(before.find(c => c.id === 'd')!.y)
})

import { useStore } from '../src/store/useStore'
// renderToStaticMarkup reads the store's initial snapshot (zustand's server-render path),
// so these tests shape that snapshot directly instead of calling setState.
const initial = useStore.getInitialState()
const setIntroStyle = (style: 'full' | 'quick' | 'code') => { initial.settings.introStyle = style }

describe.each(LESSONS.map(l => l.id))('%s code visibility', id => {
  it('omits code until the solution has been explicitly revealed', () => {
    setIntroStyle('full')
    const locked = renderToStaticMarkup(createElement(LessonWalkthrough, { lessonId: id, solutionRevealed: false }))
    expect(locked).toContain('What’s the point?')
    expect(locked).not.toContain('<code>')
    expect(locked).not.toContain('Connect this step to code')
    // "start at the demo" jumps straight to steps that carry code, so gate it there too
    setIntroStyle('quick')
    const lockedDemo = renderToStaticMarkup(createElement(LessonWalkthrough, { lessonId: id, solutionRevealed: false }))
    expect(lockedDemo).not.toContain('<code>')
    const revealed = renderToStaticMarkup(createElement(LessonWalkthrough, { lessonId: id, solutionRevealed: true }))
    expect(revealed).toContain('<code>')
    setIntroStyle('full')
  })
})

it('collapses the intro when completed or set to straight-to-code, and remembers per-lesson choices', () => {
  initial.completed['np-shapes'] = { at: 1, xp: 1, hints: 0, attempts: 1 }
  expect(renderToStaticMarkup(createElement(LessonWalkthrough, { lessonId: 'np-shapes', solutionRevealed: false }))).toContain('Show the intro')
  initial.intro['np-shapes'] = 'open'
  expect(renderToStaticMarkup(createElement(LessonWalkthrough, { lessonId: 'np-shapes', solutionRevealed: false }))).toContain('What’s the point?')
  delete initial.completed['np-shapes']
  delete initial.intro['np-shapes']
  setIntroStyle('code')
  expect(renderToStaticMarkup(createElement(LessonWalkthrough, { lessonId: 'np-views', solutionRevealed: false }))).toContain('Show the intro')
  initial.intro['np-views'] = 'open'
  expect(renderToStaticMarkup(createElement(LessonWalkthrough, { lessonId: 'np-views', solutionRevealed: false }))).toContain('What’s the point?')
  delete initial.intro['np-views']
  setIntroStyle('full')
})

import { WARMUPS } from '../src/content/warmups'
it('offers smaller code-free prerequisite steps and valid prediction checks for every lesson', () => {
  expect(Object.keys(WARMUPS).sort()).toEqual(LESSONS.map(l => l.id).sort())
  const visit = (id: string, ancestors: string[] = []) => {
    expect(ancestors).not.toContain(id)
    for (const prerequisite of WARMUPS[id].review) {
      expect(WARMUPS[prerequisite]).toBeTruthy()
      visit(prerequisite, [...ancestors, id])
    }
  }
  for (const [id, warmup] of Object.entries(WARMUPS)) {
    visit(id)
    expect(warmup.steps.length).toBeGreaterThanOrEqual(3)
    expect(warmup.steps.at(-1)?.check).toBeTruthy()
    for (const step of warmup.steps) {
      expect(step.code).toBe('')
      const layout = layoutWalkthrough(step, 280)
      expect(new Set(layout.cells.map(c => c.id)).size).toBe(layout.cells.length)
      for (const cell of layout.cells) expect(cell.x + cell.width).toBeLessThanOrEqual(280)
      if (step.check) {
        expect(step.check.options[step.check.answer]).toBeTruthy()
        expect(step.check.explanation).toBeTruthy()
      }
    }
  }
})
it('separates nested containers from stored values before broadcasting pairs', () => {
  const steps = WARMUPS['np-pairwise'].steps
  expect(steps.length).toBe(10)
  expect(JSON.parse(steps[0].nesting!)).toEqual([3, 4])
  expect(JSON.parse(steps[1].nesting!)).toEqual([[3, 4]])
  expect(JSON.parse(steps[3].nesting!).flat(2)).toEqual([0, 0, 3, 4])
  expect(steps[1].check).toBeTruthy()
  expect(steps[3].check).toBeTruthy()
})
