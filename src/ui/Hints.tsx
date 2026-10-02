import { useState } from 'react'
import type { Lesson } from '../content/types'
import { HINT_PENALTY } from '../lib/gamification'
import { CodeEditor } from './CodeEditor'

interface Props {
  lesson: Lesson
  used: number
  onReveal: () => void
  onUseSolution: (code: string) => void
  completed: boolean
}

export function Hints({ lesson, used, onReveal, onUseSolution, completed }: Props) {
  const [confirm, setConfirm] = useState(false)
  const pct = Math.round(HINT_PENALTY * 100)
  const canSolution = lesson.kind !== 'predict'
  const solutionText = lesson.kind === 'parsons' ? lesson.lines.join('\n') : lesson.solution
  const maxTier = canSolution ? 3 : 2

  return (
    <section className="hints" aria-label="Hints">
      <h3>Stuck?</h3>
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
      {used < maxTier && !completed && (
        <div className="hint-actions">
          {confirm && used === 2 && canSolution ? (
            <>
              <span className="dim">Show the full solution? XP drops to {100 - pct * 3}%.</span>
              <button className="btn small danger" onClick={() => { onReveal(); setConfirm(false) }}>Yes, show it</button>
              <button className="btn small ghost" onClick={() => setConfirm(false)}>Not yet</button>
            </>
          ) : (
            <button
              className="btn small"
              onClick={() => {
                if (used === 2 && canSolution) setConfirm(true)
                else onReveal()
              }}
            >
              {used < 2 ? `Reveal hint ${used + 1}` : 'Reveal the solution'} <span className="dim">−{pct}% XP</span>
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
