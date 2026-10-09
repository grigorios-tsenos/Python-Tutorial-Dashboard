/// <reference lib="webworker" />
import { BASE_PACKAGES, hoverDoc, installPython, runCell } from './install'
import type { HoverDoc, RunRequest, RunResult } from './types'

export const PYODIDE_VERSION = 'v314.0.7'
const INDEX_URL = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`

const post = (msg: unknown) => (self as unknown as Worker).postMessage(msg)

let pyPromise: Promise<any> | null = null
const loaded = new Set<string>(BASE_PACKAGES)

function boot() {
  if (!pyPromise) {
    pyPromise = (async () => {
      post({ type: 'status', phase: 'booting', detail: 'Downloading the Python runtime…' })
      const mod = await import(/* @vite-ignore */ `${INDEX_URL}pyodide.mjs`)
      const py = await mod.loadPyodide({ indexURL: INDEX_URL })
      post({ type: 'status', phase: 'booting', detail: 'Loading NumPy & pandas…' })
      await py.loadPackage(BASE_PACKAGES)
      await installPython(py)
      post({ type: 'status', phase: 'ready', detail: '' })
      return py
    })().catch((e) => {
      pyPromise = null
      throw e
    })
  }
  return pyPromise
}

function failed(message: string): RunResult {
  return { ok: false, stdout: '', error: null, result: null, html: [], emits: [], tests: [], ms: 0, infra: message }
}

// serialise runs: Pyodide is single-threaded
let queue: Promise<void> = Promise.resolve()

self.onmessage = (ev: MessageEvent) => {
  const msg = ev.data
  if (msg.type === 'boot') {
    boot().catch((e) => post({ type: 'status', phase: 'error', detail: String(e?.message ?? e) }))
    return
  }
  if (msg.type === 'hover') {
    // queued behind runs like everything else; a failure just means no tooltip
    queue = queue.then(async () => {
      let doc: HoverDoc | null = null
      try {
        const py = await boot()
        if (!loaded.has('jedi')) {
          await py.loadPackage('jedi')
          loaded.add('jedi')
        }
        doc = hoverDoc(py, msg.code, msg.line, msg.col)
      } catch {}
      post({ type: 'hover', id: msg.id, doc })
    })
    return
  }
  if (msg.type !== 'run') return
  const { id, code, check, packages } = msg as RunRequest & { id: number }
  queue = queue.then(async () => {
    try {
      const py = await boot()
      const need = (packages ?? []).filter((p) => !loaded.has(p))
      if (need.length) {
        post({ type: 'status', phase: 'booting', detail: `Loading ${need.join(', ')}…` })
        await py.loadPackage(need)
        need.forEach((p) => loaded.add(p))
        post({ type: 'status', phase: 'ready', detail: '' })
      }
      post({ type: 'started', id })
      const result = await runCell(py, code, check)
      post({ type: 'result', id, result })
    } catch (e: any) {
      const text = String(e?.message ?? e)
      const infra = /fetch|network|load|import/i.test(text)
        ? `Couldn't load the Python runtime (${text}). Check your connection and retry.`
        : text
      if (!pyPromise) post({ type: 'status', phase: 'error', detail: infra })
      post({ type: 'result', id, result: failed(infra) })
    }
  })
}
