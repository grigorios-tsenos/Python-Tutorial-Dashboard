import { useState } from 'react'
import type { Lesson } from '../content/types'
import { HINT_PENALTY } from '../lib/gamification'
import { hintGate, mmss } from '../lib/learning'
import type { Rigor } from '../store/model'
import { CodeEditor } from './CodeEditor'

interface Props {
  lesson: Lesson
  used: number
  /** mastered lessons (passed without hints) hide the hint controls */
  completed: boolean
  /** any finished lesson folds the hints it used away, so a redo starts from memory */
  done: boolean
  rigor: Rigor
  /** graded runs so far (predict: wrong picks) and seconds spent on this lesson */
  runs: number
  seconds: number
  stuckNote: string
  onNote: (text: string) => void
  onReveal: () => void
  onUseSolution: (code: string) => void
}

export function Hints({ lesson, used, completed, done, rigor, runs, seconds, stuckNote, onNote, onReveal, onUseSolution }: Props) {
  const [confirm, setConfirm] = useState(false)
  const pct = Math.round(HINT_PENALTY * 100)
  const canSolution = lesson.kind !== 'predict'
  const solutionText = lesson.kind === 'parsons' ? lesson.lines.join('\n') : lesson.solution
  const maxTier = canSolution ? 3 : 2
  const gate = hintGate(rigor, used, runs, seconds)
  const isSolution = used === 2 && canSolution
  const label = used < 2 ? `hint ${used + 1}` : 'the solution'
  const noteOk = !gate.needNote || stuckNote.trim().length >= 20

  const revealed = (
    <>
      {lesson.hints.slice(0, Math.min(used, 2)).map((h, i) => (
        <div key={i} className="hint-card">
          <span className="hint-n">Hint {i + 1}</span>
          <div dangerouslySetInnerHTML={{ __html: inlineMd(h) }} />
        </div>
      ))}
      {used >= 3 && canSolution && (
        <div className="hint-card solution">
          <span className="hint-n">Solution</span>
          <div className="solution-code">
            <CodeEditor docKey={`sol-${lesson.id}`} value={solutionText} readOnly />
          </div>
          <button className="btn small" onClick={() => onUseSolution(solutionText)}>Copy into the {lesson.kind === 'parsons' ? 'board' : 'editor'}</button>
        </div>
      )}
    </>
  )

  return (
    <section className="hints" aria-label="Hints">
      <h3>Stuck?</h3>
      {used > 0 && (done ? <details className="hint-history"><summary>Hints you used ({used >= 3 && canSolution ? 'solution shown' : used})</summary>{revealed}</details> : revealed)}
      {used < maxTier && !completed && (
        <div className="hint-actions">
          {!gate.open ? (
            <p className="gate">
              <strong>Try first.</strong> {label[0].toUpperCase() + label.slice(1)} unlocks after {gate.runsLeft} more {lesson.kind === 'predict' ? 'guess' : 'run'}{gate.runsLeft === 1 ? '' : lesson.kind === 'predict' ? 'es' : 's'} or {mmss(gate.secondsLeft)} more on this lesson.
              {runs === 0 && lesson.kind !== 'predict' && ' Run what you have, even if it is wrong: the failing checks are the real hint.'}
            </p>
          ) : confirm && isSolution ? (
            <div className="precommit">
              {gate.needNote ? (
                <label>
                  Before the answer: what did you try, and where exactly are you stuck? <span className="dim">Writing it down is what makes the solution stick.</span>
                  <textarea value={stuckNote} onChange={(e) => onNote(e.target.value)} rows={3} placeholder="I tried … The failing check says … I think the problem is …" />
                </label>
              ) : (
                <span className="dim">Show the full solution? XP drops to {100 - pct * 3}%.</span>
              )}
              <div className="row">
                <button className="btn small danger" disabled={!noteOk} onClick={() => { onReveal(); setConfirm(false) }}>Yes, show it</button>
                <button className="btn small ghost" onClick={() => setConfirm(false)}>Not yet</button>
                {gate.needNote && !noteOk && <span className="dim small">{Math.max(0, 20 - stuckNote.trim().length)} more characters</span>}
              </div>
            </div>
          ) : (
            <button className="btn small" onClick={() => (isSolution ? setConfirm(true) : onReveal())}>
              Reveal {label} <span className="dim">−{pct}% XP</span>
            </button>
          )}
        </div>
      )}
    </section>
  )
}

/** Hints use only `inline code` and **bold**: escape HTML first, then convert. */
function inlineMd(s: string): string {
  const esc = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return esc.replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
}
