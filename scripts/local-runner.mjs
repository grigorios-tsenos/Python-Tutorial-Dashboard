// Runs a course script on this machine for the lessons Pyodide cannot run (PyTorch, threads, subprocesses…).
// Served by the Vite dev/preview server at POST /__run; uv creates a cached environment per package set,
// so the first torch run downloads ~120 MB and later runs start in well under a second. CPU/MPS only: the
// scripts pick `cuda if available else cpu` themselves and macOS has no CUDA.
import { spawn } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pipPackages } from './pyimports.mjs'

const ROOT = resolve(import.meta.dirname, '..')
const SRC = resolve(process.env.CURRICULUM_DIR || join(homedir(), 'ai-engineering-from-scratch'))
const TIMEOUT_MS = 10 * 60_000 // ponytail: one fixed limit; a Stop button can cancel earlier through the request's abort
const MAX_OUT = 1_000_000
const KEY = /^[\w-]+\/[\w-]+$/

/** Run `code` as the lesson's main.py: in a copy of the lesson's code/ folder when the course is cloned, so sibling modules, data files and __file__ work. */
export function runLocal({ key, code, signal }) {
  const t0 = Date.now()
  const fail = (error) => ({ ok: false, stdout: '', error, result: null, html: [], emits: [], tests: [], ms: Date.now() - t0, infra: error })
  if (!KEY.test(key) || !existsSync(join(ROOT, 'public', 'curriculum', key))) return Promise.resolve(fail(`unknown lesson ${key}`))
  const dir = mkdtempSync(join(tmpdir(), 'orbit-run-'))
  const clone = join(SRC, 'phases', key, 'code')
  if (existsSync(clone)) cpSync(clone, dir, { recursive: true })
  writeFileSync(join(dir, 'main.py'), code)
  const siblings = readdirSync(dir).filter((f) => f.endsWith('.py')).map((f) => f.slice(0, -3))
  const args = ['run', '--python', '3.12', '--no-project', ...pipPackages(code, siblings).flatMap((p) => ['--with', p]), 'python', 'main.py']

  return new Promise((done) => {
    let stdout = ''
    let stderr = ''
    const finish = (r) => {
      rmSync(dir, { recursive: true, force: true })
      done({ ok: r.ok, stdout: r.stdout, error: r.error, result: null, html: [], emits: [], tests: [], ms: Date.now() - t0, ...(r.infra ? { infra: r.infra } : {}) })
    }
    const child = spawn('uv', args, { cwd: dir, env: { ...process.env, PYTHONUNBUFFERED: '1', PYTORCH_ENABLE_MPS_FALLBACK: '1', MPLBACKEND: 'Agg', ORBIT_LOCAL_RUN: '1' } })
    const timer = setTimeout(() => child.kill('SIGKILL'), TIMEOUT_MS)
    signal?.addEventListener('abort', () => child.kill('SIGKILL'))
    child.stdout.on('data', (c) => (stdout.length < MAX_OUT ? (stdout += c) : null))
    child.stderr.on('data', (c) => (stderr.length < MAX_OUT ? (stderr += c) : null))
    child.on('error', (e) => {
      clearTimeout(timer)
      finish(fail(e.code === 'ENOENT' ? 'uv is not installed. Install it with `brew install uv` (or `curl -LsSf https://astral.sh/uv/install.sh | sh`) and restart `npm run dev`.' : String(e)))
    })
    child.on('close', (code, sig) => {
      clearTimeout(timer)
      if (sig === 'SIGKILL') return finish({ ...fail(signal?.aborted ? 'Stopped.' : `Stopped after ${TIMEOUT_MS / 60_000} minutes.`), stdout })
      // uv's own progress lines are noise on success; keep them when something failed
      const noise = /^(Downloading|Downloaded|Installed|Resolved|Prepared|Audited|Built|Uninstalled|Creating|Using) /
      const err = stderr.split('\n').filter((l) => code !== 0 || !noise.test(l)).join('\n').trim()
      finish({ ok: code === 0, stdout: code === 0 && err ? `${stdout}\n[stderr]\n${err}` : stdout, error: code === 0 ? null : err || `exit code ${code}` })
    })
  })
}

/** POST /__run {key, code} → RunResult; anything else falls through. Exported for the HTTP-level test. */
export function middleware(req, res, next) {
  if (req.url !== '/__run') return next()
  // only this page may run code on this machine: a custom header forces a CORS preflight for other origins, and the origin must match the server
  const origin = req.headers.origin
  if (req.method !== 'POST' || !req.headers['x-orbit-run'] || (origin && new URL(origin).host !== req.headers.host)) {
    res.statusCode = 403
    return res.end('forbidden')
  }
  // the client went away (Stop button, closed tab): the response closes before it finished, not the request stream
  const ac = new AbortController()
  res.on('close', () => res.writableFinished || ac.abort())
  let body = ''
  req.on('data', (c) => {
    body += c
    if (body.length > 2_000_000) req.destroy()
  })
  req.on('end', async () => {
    let parsed
    try {
      parsed = JSON.parse(body)
    } catch {
      res.statusCode = 400
      return res.end('bad json')
    }
    const result = await runLocal({ key: String(parsed.key ?? ''), code: String(parsed.code ?? ''), signal: ac.signal })
    if (res.writableEnded) return
    res.setHeader('content-type', 'application/json')
    res.end(JSON.stringify(result))
  })
}

/** Vite plugin: the /__run endpoint on `npm run dev` and `npm run preview` */
export const localRunner = () => ({
  name: 'orbit-local-runner',
  configureServer: (server) => void server.middlewares.use(middleware),
  configurePreviewServer: (server) => void server.middlewares.use(middleware),
})
