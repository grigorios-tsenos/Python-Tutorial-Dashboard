import type { Step } from '../content/types'
import type { Emit, RunResult, TestResult } from '../engine/types'
import { useRunnerStatus, runner } from '../engine/runner'
import { finalTests, stepTests } from '../lib/steps'
import { BroadcastGrid } from '../labs/BroadcastGrid'
import { GraphTrace } from '../labs/GraphTrace'
import { MlflowRuns } from '../labs/MlflowRuns'

function Visual({ emit }: { emit: Emit }) {
  if (emit.kind === 'graph_trace') return <GraphTrace data={emit.data} />
  if (emit.kind === 'mlflow_runs') return <MlflowRuns data={emit.data} />
  if (emit.kind === 'broadcast') return <BroadcastGrid data={emit.data} />
  if (emit.kind === 'figure') return <figure className="fig"><img src={`data:image/png;base64,${emit.data.png}`} alt={emit.data.alt || 'figure'} /></figure>
  return null
}

const VISUAL_KINDS = ['graph_trace', 'mlflow_runs', 'broadcast', 'figure']

function TestList({ tests }: { tests: TestResult[] }) {
  return (
    <ul>
      {tests.map((t, i) => (
        <li key={i} className={t.ok ? 'ok' : 'bad'}>
          <span aria-hidden>{t.ok ? '✓' : '✗'}</span> {t.label}
          {!t.ok && t.msg && <div className="test-msg">{t.msg}</div>}
        </li>
      ))}
    </ul>
  )
}

/**
 * Checks grouped by step: only the step being worked on is spelled out, so a run never shows a
 * wall of red for work that has not started yet.
 */
function StepVerdict({ result, steps, current, completed }: { result: RunResult; steps: Step[]; current: number; completed: boolean }) {
  const all = result.tests
  const passed = all.length > 0 && all.every((t) => t.ok)
  if (passed) {
    return (
      <div className="out-verdict pass">
        <div className="verdict-head">✓ All checks pass{completed ? '' : ' · lesson complete'}</div>
        <details><summary className="dim">{all.length} checks</summary><TestList tests={all} /></details>
      </div>
    )
  }
  if (current < steps.length) {
    const mine = stepTests(result, current)
    const fails = mine.filter((t) => !t.ok).length
    return (
      <div className={`out-verdict ${fails ? 'fail' : 'pass'}`}>
        <div className="verdict-head">
          {current > 0 && <span className="verdict-done">✓ {current} step{current === 1 ? '' : 's'} done · </span>}
          Step {current + 1}: {steps[current].title}
        </div>
        {mine.length ? <TestList tests={mine} /> : <p className="dim">This step's check produced no result yet.</p>}
      </div>
    )
  }
  const final = finalTests(result)
  const fails = final.filter((t) => !t.ok).length
  return (
    <div className="out-verdict fail">
      <div className="verdict-head">✓ Every step done · final checks: {fails} of {final.length} failing</div>
      <TestList tests={final} />
    </div>
  )
}

interface Props {
  result: RunResult | null
  running: boolean
  graded: boolean
  completed: boolean
  /** Visual Labs put their visualisation above the checks and console */
  visualFirst?: boolean
  steps?: Step[]
  current?: number
}

export function OutputPanel({ result, running, graded, completed, visualFirst, steps = [], current = 0 }: Props) {
  const status = useRunnerStatus()
  const booting = status.phase === 'booting'

  if (status.phase === 'error' && !running && !result) {
    return (
      <div className="output">
        <div className="out-infra">
          <strong>Python couldn't start.</strong>
          <p>{status.detail}</p>
          <button className="btn" onClick={() => runner.retry()}>Retry</button>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="output">
        <div className="out-empty">
          {booting || running ? (
            <>
              <span className="spinner" aria-hidden />
              <span>{status.detail || (running ? 'Running…' : 'Starting Python…')}</span>
            </>
          ) : (
            <span>Press <kbd>Run</kbd> or <kbd>⌘</kbd>/<kbd>Ctrl</kbd>+<kbd>Enter</kbd> to run your code. Output appears here.</span>
          )}
        </div>
      </div>
    )
  }

  const passed = result.tests.length > 0 && result.tests.every((t) => t.ok)
  const visuals = result.emits.filter((e) => VISUAL_KINDS.includes(e.kind))
  const visualBlock = visuals.map((e, i) => <Visual key={i + e.kind} emit={e} />)
  return (
    <div className={`output ${running ? 'stale' : ''}`} aria-live="polite">
      {running && <div className="out-running"><span className="spinner" aria-hidden /> {status.detail || 'Running…'}</div>}
      {result.infra && (
        <div className="out-infra">
          <strong>{result.infra}</strong>
          {status.phase === 'error' && <button className="btn" onClick={() => runner.retry()}>Retry</button>}
        </div>
      )}
      {result.error && (
        <div className="out-error">
          <div className="out-h">Error</div>
          <pre>{result.error}</pre>
        </div>
      )}
      {visualFirst && visualBlock}
      {graded && result.tests.length > 0 && steps.length > 0 && <StepVerdict result={result} steps={steps} current={current} completed={completed} />}
      {graded && result.tests.length > 0 && steps.length === 0 && (
        <div className={`out-verdict ${passed ? 'pass' : 'fail'}`}>
          <div className="verdict-head">{passed ? '✓ All checks pass' : `✗ ${result.tests.filter((t) => !t.ok).length} of ${result.tests.length} checks failing`}</div>
          <TestList tests={result.tests} />
        </div>
      )}
      {graded && !result.error && result.tests.length === 0 && !result.infra && <div className="out-note">Your code ran, but no checks produced results.</div>}
      {(result.stdout || result.result) && (
        <div className="out-console">
          <div className="out-h">Output</div>
          {result.stdout && <pre>{result.stdout}</pre>}
          {result.result && <pre className="out-result">{result.result}</pre>}
        </div>
      )}
      {result.html.map((h, i) => (
        <div key={i} className="out-table" dangerouslySetInnerHTML={{ __html: h }} />
      ))}
      {!visualFirst && visualBlock}
      {!result.error && !result.infra && !result.stdout && !result.result && result.html.length === 0 && visuals.length === 0 && result.tests.length === 0 && (
        <div className="out-note">Ran in {result.ms}ms with no output. Use <code>print(...)</code> to see values.</div>
      )}
    </div>
  )
}
