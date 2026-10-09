import { execSync } from 'node:child_process'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { describe, expect, it } from 'vitest'
import { middleware, runLocal } from '../scripts/local-runner.mjs'

const hasUv = (() => {
  try {
    execSync('uv --version', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
})()
const KEY = '14-agent-engineering/01-the-agent-loop'

describe.skipIf(!hasUv)('local runner (uv, for the scripts the browser cannot run)', () => {
  it('runs a threaded script as main.py on Python 3.12', async () => {
    const r = await runLocal({ key: KEY, code: 'import threading, os, sys\nprint("py", sys.version_info[:2], os.path.basename(__file__), threading.active_count())\n' })
    expect(r.error).toBeNull()
    expect(r.ok).toBe(true)
    expect(r.stdout).toContain('py (3, 12) main.py 1')
    expect(r.ms).toBeGreaterThan(0)
  })
  it('reports Python errors, refuses unknown lessons, and can be stopped', async () => {
    const r = await runLocal({ key: KEY, code: 'print("before")\nraise SystemExit("boom")' })
    expect(r.ok).toBe(false)
    expect(r.stdout).toContain('before')
    expect(r.error).toContain('boom')
    expect((await runLocal({ key: '../../etc', code: '' })).infra).toMatch(/unknown lesson/)
    const ac = new AbortController()
    setTimeout(() => ac.abort(), 1500)
    const stopped = await runLocal({ key: KEY, code: 'import time\nprint("tick", flush=True)\ntime.sleep(60)', signal: ac.signal })
    expect(stopped.ok).toBe(false)
    expect(stopped.error).toBe('Stopped.')
    expect(stopped.stdout).toContain('tick')
  })
  it('serves /__run to the page itself and refuses other origins or plain posts', async () => {
    const server = createServer((req, res) => middleware(req, res, () => res.writeHead(404).end()))
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r))
    const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    const post = (headers: Record<string, string>, body = JSON.stringify({ key: KEY, code: 'import threading\nprint("hi", threading.active_count())' })) =>
      fetch(`${origin}/__run`, { method: 'POST', headers: { 'content-type': 'application/json', origin, ...headers }, body })
    try {
      const ok = await post({ 'x-orbit-run': '1' })
      expect(ok.status).toBe(200)
      expect(await ok.json()).toMatchObject({ ok: true, stdout: 'hi 1\n', error: null })
      expect((await post({ 'x-orbit-run': '1', origin: 'http://evil.localhost:9' })).status).toBe(403)
      expect((await post({})).status).toBe(403)
      expect((await post({ 'x-orbit-run': '1' }, '{nope')).status).toBe(400)
      expect((await fetch(`${origin}/other`)).status).toBe(404)
    } finally {
      server.close()
    }
  })
  it('installs torch on demand and runs it on the CPU', async () => {
    const r = await runLocal({ key: '03-deep-learning-core/11-intro-to-pytorch', code: 'import torch\nx = torch.ones(2, 2)\nprint(x.sum().item(), torch.cuda.is_available())\n' })
    expect(r.error).toBeNull()
    expect(r.stdout).toContain('4.0 False')
  })
})
