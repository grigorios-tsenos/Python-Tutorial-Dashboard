import type { Emit, RunResult } from '../engine/types'
import { useRunnerStatus, runner } from '../engine/runner'
import { BroadcastGrid } from '../labs/BroadcastGrid'
import { GraphTrace } from '../labs/GraphTrace'
import { MlflowRuns } from '../labs/MlflowRuns'

function Visual({ emit }: { emit: Emit }) {
  if (emit.kind === 'graph_trace') return <GraphTrace data={emit.data} />
  if (emit.kind === 'mlflow_runs') return <MlflowRuns data={emit.data} />
  if (emit.kind === 'broadcast') return <BroadcastGrid data={emit.data} />
  return null
}

interface Props {
  result: RunResult | null
  running: boolean
  graded: boolean
  completed: boolean
  /** Visual Labs put their visualisation above the checks and console */
  visualFirst?: boolean
}

export function OutputPanel({ result, running, graded, completed, visualFirst }: Props) {
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
  const visuals = result.emits.filter((e) => ['graph_trace', 'mlflow_runs', 'broadcast'].includes(e.kind))
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
      {graded && result.tests.length > 0 && (
        <div className={`out-verdict ${passed ? 'pass' : 'fail'}`}>
          <div className="verdict-head">
            {passed ? (completed ? '✓ All checks pass' : '✓ All checks pass') : `✗ ${result.tests.filter((t) => !t.ok).length} of ${result.tests.length} checks failing`}
          </div>
          <ul>
            {result.tests.map((t, i) => (
              <li key={i} className={t.ok ? 'ok' : 'bad'}>
                <span aria-hidden>{t.ok ? '✓' : '✗'}</span> {t.label}
                {!t.ok && t.msg && <div className="test-msg">{t.msg}</div>}
              </li>
            ))}
          </ul>
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
