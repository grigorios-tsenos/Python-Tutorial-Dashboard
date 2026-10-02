export interface TestResult {
  label: string
  ok: boolean
  msg: string
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
  check?: string
  packages?: string[]
}
