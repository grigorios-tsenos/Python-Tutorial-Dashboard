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

/** What the editor shows when a function or class is hovered. */
export interface HoverDoc {
  /** qualified name + signature, e.g. `numpy.linspace(start, stop, num=50, ...)` */
  sig: string
  /** the docstring up to the end of its parameters section */
  doc: string
  /** where the text comes from, e.g. `numpy 2.4.6` */
  src: string
}

export interface RunRequest {
  code: string
  check?: string
  packages?: string[]
}
