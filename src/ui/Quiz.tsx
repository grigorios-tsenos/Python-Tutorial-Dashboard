import { useState } from 'react'
import type { QuizQuestion } from '../content/course'
import type { CourseProgress } from '../store/model'

const STAGE_LABEL: Record<QuizQuestion['stage'], string> = { pre: 'Before you read', check: 'Check', post: 'After reading' }
export const PASS_MARK = 0.7

interface Props {
  questions: QuizQuestion[]
  /** the best previous result, if any */
  done?: CourseProgress
  onFinish: (score: number, total: number) => void
}

/** One question at a time, explanation after each answer, a score at the end. */
export function Quiz({ questions, done, onFinish }: Props) {
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [state, setState] = useState<'idle' | 'live' | 'finished'>(done ? 'idle' : 'live')
  const total = questions.length
  const q = questions[i]

  const start = () => {
    setI(0)
    setPicked(null)
    setScore(0)
    setState('live')
  }
  const pick = (k: number) => {
    if (picked !== null) return
    setPicked(k)
    if (k === q.correct) setScore((s) => s + 1)
  }
  const next = () => {
    if (i + 1 < total) {
      setI(i + 1)
      setPicked(null)
    } else {
      setState('finished')
      onFinish(score, total)
    }
  }

  if (state !== 'live') {
    const shown = state === 'finished' ? { score, total } : done!
    const passed = shown.total > 0 && shown.score / shown.total >= PASS_MARK
    return (
      <div className="quiz-summary" role="status">
        <div className="quiz-score">{shown.score} / {shown.total}</div>
        <p>{passed ? (state === 'finished' ? 'Passed. This lesson is complete.' : 'You already passed this quiz.') : 'Not yet: 70 % passes. Skim the sections you missed and try again.'}</p>
        <button className="btn ghost" onClick={start}>{state === 'finished' ? 'Try again' : 'Retake the quiz'}</button>
      </div>
    )
  }

  return (
    <div className="quiz" aria-live="polite">
      <div className="quiz-head">
        <span className="chip">{STAGE_LABEL[q.stage]}</span>
        <span className="dim small">Question {i + 1} of {total} · {score} correct</span>
      </div>
      <p className="quiz-q">{q.question}</p>
      <div className="choices quiz-choices" role="group" aria-label="Answers">
        {q.options.map((opt, k) => {
          const chosen = picked === k
          const right = picked !== null && k === q.correct
          return (
            <button key={k} className={`choice ${chosen && !right ? 'wrong' : ''} ${right ? 'right' : ''}`} disabled={picked !== null} onClick={() => pick(k)}>
              <span className="choice-key">{String.fromCharCode(65 + k)}</span>
              <pre>{opt}</pre>
              {right && <span className="choice-flag">✓</span>}
              {chosen && !right && <span className="choice-flag">not quite</span>}
            </button>
          )
        })}
      </div>
      {picked !== null && (
        <div className={`quiz-explain ${picked === q.correct ? 'ok' : 'miss'}`}>
          <strong>{picked === q.correct ? 'Correct.' : 'Not this one.'}</strong> {q.explanation}
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn primary small" onClick={next} autoFocus>{i + 1 < total ? 'Next question →' : 'See my score'}</button>
          </div>
        </div>
      )}
    </div>
  )
}
