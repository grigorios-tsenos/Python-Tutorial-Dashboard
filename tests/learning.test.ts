import { describe, expect, it } from 'vitest'
import { LESSONS } from '../src/content'
import { debugMove, hintGate, mmss, redoQueue } from '../src/lib/learning'
import { defaults } from '../src/store/model'
import { useStore } from '../src/store/useStore'

const DAY = 86_400_000

describe('hint gates', () => {
  it('open immediately when rigor is off', () => {
    expect(hintGate('off', 0, 0, 0).open).toBe(true)
    expect(hintGate('off', 2, 0, 0)).toMatchObject({ open: true, needNote: false })
  })
  it('standard: runs or minutes, whichever comes first', () => {
    expect(hintGate('standard', 0, 0, 0)).toMatchObject({ open: false, runsLeft: 2, secondsLeft: 180 })
    expect(hintGate('standard', 0, 2, 0).open).toBe(true)
    expect(hintGate('standard', 0, 0, 180).open).toBe(true)
    expect(hintGate('standard', 1, 3, 100)).toMatchObject({ open: false, runsLeft: 1, secondsLeft: 260 })
    expect(hintGate('standard', 2, 6, 0)).toMatchObject({ open: true, needNote: true })
    expect(hintGate('standard', 1, 4, 0).needNote).toBe(false)
  })
  it('strict asks for more and clamps the tier', () => {
    expect(hintGate('strict', 2, 9, 19 * 60).open).toBe(false)
    expect(hintGate('strict', 2, 10, 0).open).toBe(true)
    expect(hintGate('strict', 7, 10, 0)).toEqual(hintGate('strict', 2, 10, 0))
  })
  it('formats remaining time', () => {
    expect(mmss(0)).toBe('0:00')
    expect(mmss(65)).toBe('1:05')
    expect(mmss(599.4)).toBe('10:00')
  })
})

describe('redo queue', () => {
  const [a, b, c, d] = LESSONS
  const now = 10 * DAY
  it('lists assisted lessons at least a day old, most-assisted first then oldest', () => {
    const completed = {
      [a.id]: { at: now - 2 * DAY, xp: 10, hints: 1, attempts: 2 },
      [b.id]: { at: now - 3 * DAY, xp: 10, hints: 3, attempts: 5 },
      [c.id]: { at: now - 2 * DAY, xp: 10, hints: 0, attempts: 1 }, // mastered: not queued
      [d.id]: { at: now - DAY / 2, xp: 10, hints: 3, attempts: 1 }, // too fresh
      ghost: { at: 0, xp: 1, hints: 3, attempts: 1 },
    }
    expect(redoQueue(completed, now).map((l) => l.id)).toEqual([b.id, a.id])
    expect(redoQueue({}, now)).toEqual([])
  })
})

describe('debug moves', () => {
  it('rotate and never repeat on consecutive fails', () => {
    const seen = new Set([1, 2, 3, 4, 5].map(debugMove))
    expect(seen.size).toBe(5)
    expect(debugMove(6)).toBe(debugMove(1))
    expect(debugMove(0)).toBe(debugMove(1))
  })
})

describe('store: redo from memory', () => {
  const lesson = LESSONS.find((l) => l.kind === 'build')!
  const reset = () => useStore.setState({ ...defaults(), hydrated: true })

  it('upgrades an assisted completion when passed again without hints and refunds the XP', () => {
    reset()
    const s = useStore.getState()
    s.revealHint(lesson.id)
    s.revealHint(lesson.id)
    s.revealHint(lesson.id)
    const first = s.completeLesson(lesson.id, 4)!
    expect(first.redo).toBe(false)
    expect(first.xp).toBe(Math.round(lesson.xp * 0.55))
    expect(useStore.getState().completed[lesson.id].hints).toBe(3)

    expect(useStore.getState().completeLesson(lesson.id, 1)).toBeNull() // same help level: nothing new

    useStore.getState().redoLesson(lesson.id)
    expect(useStore.getState().hints[lesson.id]).toBe(0)
    expect(useStore.getState().code[lesson.id]).toBeUndefined()
    const again = useStore.getState().completeLesson(lesson.id, 1)!
    expect(again.redo).toBe(true)
    expect(again.xp).toBe(lesson.xp - first.xp)
    expect(again.cardsAdded).toBe(0)
    const c = useStore.getState().completed[lesson.id]
    expect(c.hints).toBe(0)
    expect(c.xp).toBe(lesson.xp)
    expect(useStore.getState().xp).toBe(lesson.xp + first.questBonus)
  })

  it('counts graded runs per lesson and keeps notes', () => {
    reset()
    const s = useStore.getState()
    s.recordRun(lesson.id, false)
    s.recordRun(lesson.id, false)
    s.recordRun(undefined, true)
    expect(useStore.getState().tries[lesson.id]).toBe(2)
    expect(useStore.getState().stats.runs).toBe(3)
    s.setNote(lesson.id, { stuck: 'the shapes do not line up' })
    s.setNote(lesson.id, { takeaway: 'None inserts an axis' })
    expect(useStore.getState().notes[lesson.id]).toEqual({ stuck: 'the shapes do not line up', takeaway: 'None inserts an axis' })
  })
})
