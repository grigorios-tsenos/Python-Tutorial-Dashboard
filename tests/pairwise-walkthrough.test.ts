import { expect, it } from 'vitest'
import { pairwiseFrame } from '../src/labs/PairwiseWalkthrough'

it('walks every pair through subtraction, squaring and the correct table entry', () => {
  const expected = [0, 16, 9, 25, 9, 16]
  for (let step = 0; step < 24; step++) {
    const frame = pairwiseFrame(step)
    expect(frame.i * 3 + frame.j).toBe(Math.floor(step / 4))
    expect(frame.stage).toBe(step % 4)
    expect(frame.squares).toEqual(frame.differences.map(v => v * v))
    expect(frame.distance).toBe(expected[Math.floor(step / 4)])
  }
})
