import { useSyncExternalStore } from 'react'
import type { RunRequest, RunResult } from './types'

export type Phase = 'idle' | 'booting' | 'ready' | 'running' | 'error'
export interface RunnerStatus {
  phase: Phase
  detail: string
}

export const RUN_TIMEOUT_MS = 20_000

interface Pending {
  resolve: (r: RunResult) => void
  timer?: ReturnType<typeof setTimeout>
}

const infraResult = (message: string): RunResult => ({ ok: false, stdout: '', error: null, result: null, html: [], emits: [], tests: [], ms: 0, infra: message })

class Runner {
  private worker: Worker | null = null
  private pending = new Map<number, Pending>()
  private nextId = 1
  private listeners = new Set<() => void>()
  private status: RunnerStatus = { phase: 'idle', detail: '' }

  getStatus = () => this.status
  subscribe = (cb: () => void) => {
    this.listeners.add(cb)
    return () => this.listeners.delete(cb)
  }

  private setStatus(s: RunnerStatus) {
    this.status = s
    this.listeners.forEach((l) => l())
  }

  private ensureWorker(): Worker {
    if (this.worker) return this.worker
    const w = new Worker(new URL('./pyodide.worker.ts', import.meta.url), { type: 'module' })
    w.onmessage = (ev: MessageEvent) => this.onMessage(ev.data)
    w.onerror = (ev) => {
      this.failAll(`The Python worker crashed: ${ev.message || 'unknown error'}`)
      this.setStatus({ phase: 'error', detail: ev.message || 'Worker crashed' })
      this.worker = null
    }
    this.worker = w
    this.setStatus({ phase: 'booting', detail: 'Starting Python…' })
    return w
  }

  /** Pre-warm the runtime so the first Run is instant. */
  boot() {
    this.ensureWorker().postMessage({ type: 'boot' })
  }

  retry() {
    this.worker?.terminate()
    this.worker = null
    this.boot()
  }

  private onMessage(msg: any) {
    if (msg.type === 'status') {
      if (this.pending.size > 0 && msg.phase === 'ready') this.setStatus({ phase: 'running', detail: '' })
      else this.setStatus({ phase: msg.phase, detail: msg.detail })
    } else if (msg.type === 'started') {
      const p = this.pending.get(msg.id)
      if (p) {
        this.setStatus({ phase: 'running', detail: '' })
        p.timer = setTimeout(() => this.timeout(msg.id), RUN_TIMEOUT_MS)
      }
    } else if (msg.type === 'result') {
      const p = this.pending.get(msg.id)
      if (!p) return
      if (p.timer) clearTimeout(p.timer)
      this.pending.delete(msg.id)
      p.resolve(msg.result)
      if (this.pending.size === 0 && this.status.phase !== 'error') this.setStatus({ phase: 'ready', detail: '' })
    }
  }

  private timeout(id: number) {
    const p = this.pending.get(id)
    if (!p) return
    this.pending.delete(id)
    p.resolve(infraResult(`Your code ran for more than ${RUN_TIMEOUT_MS / 1000}s, so Orbit stopped it. Look for an infinite loop. The Python runtime has been restarted.`))
    // an infinite loop can't be interrupted: restart the worker and fail anything queued behind it
    this.worker?.terminate()
    this.worker = null
    this.failAll('The Python runtime was restarted. Run again.')
    this.boot()
  }

  private failAll(message: string) {
    for (const [id, p] of this.pending) {
      if (p.timer) clearTimeout(p.timer)
      p.resolve(infraResult(message))
      this.pending.delete(id)
    }
  }

  run(req: RunRequest): Promise<RunResult> {
    const worker = this.ensureWorker()
    const id = this.nextId++
    return new Promise<RunResult>((resolve) => {
      this.pending.set(id, { resolve })
      if (this.status.phase === 'ready') this.setStatus({ phase: 'running', detail: '' })
      worker.postMessage({ type: 'run', id, ...req })
    })
  }
}

export const runner = new Runner()

export function useRunnerStatus(): RunnerStatus {
  return useSyncExternalStore(runner.subscribe, runner.getStatus)
}
