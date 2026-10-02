import { describe, it, expect } from 'vitest'
import { run } from './pyodide-node'

describe('engine harness', () => {
  it('captures stdout and last expression', async () => {
    const r = await run('print("hi")\n1+2')
    expect(r.ok).toBe(true)
    expect(r.stdout).toBe('hi\n')
    expect(r.result).toBe('3')
  })
  it('renders DataFrames as html', async () => {
    const r = await run('import pandas as pd\npd.DataFrame({"a":[1,2]})')
    expect(r.html[0]).toContain('<table')
  })
  it('formats user-code errors only', async () => {
    const r = await run('def f():\n    return 1/0\nf()')
    expect(r.ok).toBe(false)
    expect(r.error).toContain('ZeroDivisionError')
    expect(r.error).toContain('line 2')
  })
  it('supports top-level await', async () => {
    const r = await run('import asyncio\nawait asyncio.sleep(0.01)\n"done"')
    expect(r.result).toBe("'done'")
  })
  it('runs checks in the user namespace', async () => {
    const r = await run('x = 5', 'test("x is 5", lambda: x == 5)\ntest("bad", lambda: x == 6, "nope")')
    expect(r.tests).toEqual([
      { label: 'x is 5', ok: true, msg: '' },
      { label: 'bad', ok: false, msg: 'nope' },
    ])
  })
  it('numpy broadcast emit', async () => {
    const r = await run('import orbit, numpy as np\norbit.show_broadcast(np.ones((3,1)), np.arange(4))')
    expect(r.emits[0].data.out_shape).toEqual([3, 4])
  })
})
