export interface TestResult {
  label: string
  ok: boolean
  msg: string
  /** index of the step check that produced it; absent for the final check */
  step?: number
}

export interface Emit {
  kind: string
  data: any
}

export interface RunResult {
  ok: boolean
  stdout: string
  error: string | null
  result: string | null
  html: string[]
  emits: Emit[]
  tests: TestResult[]
  ms: number
  /** set by the runner on infrastructure failures (timeout, load error) */
  infra?: string
}

export interface RunRequest {
  code: string
  /** the final check: runs after every step check */
  check?: string
  /** one check per step, each run in order and tagged with its index */
  checks?: string[]
  packages?: string[]
}
