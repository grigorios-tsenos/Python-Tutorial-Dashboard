import { useState } from 'react'
import type { Step } from '../content/types'
import type { RunResult } from '../engine/types'
import { finalTests, stepState, stepTests } from '../lib/steps'
import { Markdown } from './Markdown'

interface Props {
  steps: Step[]
  /** index of the step to work on; `steps.length` means only the final checks remain */
  current: number
  result: RunResult | null
  done: boolean
  hasFinal: boolean
}

/**
 * The lesson as a ladder of small moves. Only the current step is open, so there is one thing
 * to read and one thing to do; finished steps fold to a line, later ones wait dimmed.
 */
export function Steps({ steps, current, result, done, hasFinal }: Props) {
  const [open, setOpen] = useState<Record<number, boolean>>({})
  const toggle = (i: number) => setOpen((o) => ({ ...o, [i]: !o[i] }))
  const finalState = done ? 'done' : current >= steps.length ? 'current' : 'todo'
  const finalFails = finalTests(result).filter((t) => !t.ok)
  return (
    <section className="steps" aria-label="Steps">
      <h3>
        Steps <span className="dim">· {Math.min(current, steps.length)} of {steps.length} done</span>
      </h3>
      <ol className="step-list">
        {steps.map((s, i) => {
          const state = done ? 'done' : stepState(i, current)
          const expanded = state === 'current' || !!open[i]
          const fails = state === 'current' ? stepTests(result, i).filter((t) => !t.ok) : []
          return (
            <li key={i} className={`step ${state}`} aria-current={state === 'current' ? 'step' : undefined}>
              <button className="step-head" onClick={() => state !== 'current' && toggle(i)} aria-expanded={expanded} disabled={state === 'current'}>
                <span className="step-n" aria-hidden>{state === 'done' ? '✓' : i + 1}</span>
                <span className="step-title">{s.title}</span>
                {state === 'current' && <span className="step-now">now</span>}
              </button>
              {expanded && (
                <div className="step-body">
                  <Markdown src={s.body} />
                  {fails.length > 0 && (
                    <ul className="step-fails" aria-label="What the check says">
                      {fails.map((t, k) => (
                        <li key={k}>
                          <span aria-hidden>✗</span> {t.label}
                          {t.msg && <div className="test-msg">{t.msg}</div>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </li>
          )
        })}
        {hasFinal && (
          <li className={`step final ${finalState}`} aria-current={finalState === 'current' ? 'step' : undefined}>
            <div className="step-head">
              <span className="step-n" aria-hidden>{finalState === 'done' ? '✓' : '★'}</span>
              <span className="step-title">Pass every check</span>
              {finalState === 'current' && <span className="step-now">now</span>}
            </div>
            {finalState === 'current' && (
              <div className="step-body">
                <p className="dim">Every step is in place. The final checks try new inputs and edge cases: read the first failing one and fix that behaviour.</p>
                {finalFails.length > 0 && (
                  <ul className="step-fails" aria-label="Failing final checks">
                    {finalFails.map((t, k) => (
                      <li key={k}>
                        <span aria-hidden>✗</span> {t.label}
                        {t.msg && <div className="test-msg">{t.msg}</div>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </li>
        )}
      </ol>
    </section>
  )
}

/** One line above the editor: what to do right now, and how far along the ladder you are. */
export function NowBar({ steps, current, done, hasFinal }: { steps: Step[]; current: number; done: boolean; hasFinal: boolean }) {
  const total = steps.length + (hasFinal ? 1 : 0)
  const filled = done ? total : Math.min(current, total)
  const label = done ? (
    <strong>Lesson complete. Lock it in, then take the next star.</strong>
  ) : current < steps.length ? (
    <>
      <span className="now-k">Step {current + 1} of {steps.length}</span>
      <strong>{steps[current].title}</strong>
      <span className="dim">then Run</span>
    </>
  ) : (
    <>
      <span className="now-k">Final checks</span>
      <strong>Make every check pass</strong>
    </>
  )
  return (
    <div className={`now ${done ? 'done' : ''}`} role="status" aria-live="polite">
      <div className="now-track" aria-hidden>
        {Array.from({ length: total }, (_, i) => <i key={i} className={i < filled ? 'on' : ''} />)}
      </div>
      <div className="now-text">{label}</div>
    </div>
  )
}
