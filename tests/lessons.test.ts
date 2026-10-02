import { describe, it, expect } from 'vitest'
import { LESSONS } from '../src/content'
import { validateLesson } from '../src/content/parse'
import { TRACKS } from '../src/content/tracks'
import { seededShuffle } from '../src/lib/shuffle'
import { allPassed, outputText } from '../src/engine/outputText'
import { run } from './pyodide-node'

describe('curriculum shape', () => {
  it('has unique ids and every track is populated', () => {
    const ids = LESSONS.map((l) => l.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const t of TRACKS) expect(LESSONS.filter((l) => l.track === t.id).length, t.id).toBe(6)
  })
  it('every track ends with a boss and has sequential order', () => {
    for (const t of TRACKS) {
      const ls = LESSONS.filter((l) => l.track === t.id)
      expect(ls.map((l) => l.order)).toEqual([1, 2, 3, 4, 5, 6])
      expect(ls[5].kind).toBe('boss')
    }
  })
  it.each(LESSONS.map((l) => [l.id, l] as const))('%s is well-formed', (_id, l) => {
    expect(validateLesson(l)).toEqual([])
  })
})

describe.each(LESSONS.map((l) => [l.id, l] as const))('lesson %s executes correctly', (_id, l) => {
  if (l.kind === 'predict') {
    it('the marked answer equals the real output', async () => {
      const r = await run(l.starter, undefined, l.packages)
      expect(r.error).toBeNull()
      expect(outputText(r)).toBe(l.choices[l.answer].trim())
      expect(new Set(l.choices.map((c) => c.trim())).size).toBe(l.choices.length)
    })
    return
  }
  if (l.kind === 'parsons') {
    it('the reference ordering passes the check', async () => {
      const r = await run(l.lines.join('\n'), l.check, l.packages)
      expect(r.error).toBeNull()
      expect(r.tests.filter((t) => !t.ok), JSON.stringify(r.tests)).toEqual([])
      expect(allPassed(r)).toBe(true)
    })
    it('the shuffled starting order does not pass', async () => {
      const shuffled = seededShuffle(l.lines, l.id)
      const r = await run(shuffled.join('\n'), l.check, l.packages)
      expect(allPassed(r)).toBe(false)
    })
    return
  }
  it('the solution passes', async () => {
    const r = await run(l.solution, l.check || undefined, l.packages)
    expect(r.error).toBeNull()
    if (l.check) {
      expect(r.tests.filter((t) => !t.ok), JSON.stringify(r.tests)).toEqual([])
      expect(allPassed(r)).toBe(true)
    }
  })
  if (l.check) {
    it('the starter does not already pass', async () => {
      const r = await run(l.starter, l.check, l.packages)
      expect(allPassed(r)).toBe(false)
    })
  }
})
