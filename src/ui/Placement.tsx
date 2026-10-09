import { useState } from 'react'
import { COURSE, type CoursePlan } from '../content/course'
import { AREAS, PLACEMENT, planFromPlacement, planHours } from '../content/placement'

/**
 * The curriculum's placement quiz: 5 areas × 2 questions, scored per area after each pair, explanations only at the end.
 * Ends with the plan it implies; the caller saves it.
 */
export function Placement({ onDone, onCancel }: { onDone: (plan: CoursePlan) => void; onCancel: () => void }) {
  const [answers, setAnswers] = useState<number[]>([])
  const i = answers.length
  const q = PLACEMENT[i]
  const areaScores = (upTo: number) => AREAS.map((_, a) => PLACEMENT.slice(0, upTo).reduce((s, qq, k) => s + (qq.area === a && answers[k] === qq.correct ? 1 : 0), 0))

  if (!q) {
    const areas = areaScores(PLACEMENT.length)
    const plan = planFromPlacement(areas, COURSE.phases)
    const entry = COURSE.phases.find((p) => p.n === plan.entry)!
    const todo = COURSE.phases.filter((p) => plan.status[p.dir] !== 'skip')
    const weakest = areas.indexOf(Math.min(...areas))
    return (
      <section className="card placement" aria-label="Placement result">
        <div className="eyebrow">Placement</div>
        <h2>Start at Phase {entry.n}: {entry.title}</h2>
        <table className="placement-areas">
          <tbody>
            {AREAS.map((name, a) => (
              <tr key={name}><td>{name}</td><td className="num">{areas[a]}/2</td></tr>
            ))}
            <tr className="total"><td>Total</td><td className="num">{plan.score}/10</td></tr>
          </tbody>
        </table>
        <p className="dim">
          Your personalized path: ~{planHours(plan, COURSE.phases)} hours across {todo.length} phases. {areas[weakest] < 2 ? `Weakest area: ${AREAS[weakest]}, so give those lessons real time.` : 'No weak area: skip what you know and go build.'}
          {' '}Phases below your entry point are skipped, except the ones your 1/2 scores mark for review.
        </p>
        <details>
          <summary className="dim small">Why each answer</summary>
          <ol className="placement-key">
            {PLACEMENT.map((qq, k) => (
              <li key={k} className={answers[k] === qq.correct ? 'ok' : 'miss'}>
                <span>{qq.question}</span> <strong>{String.fromCharCode(65 + qq.correct)}.</strong> {qq.explanation}
              </li>
            ))}
          </ol>
        </details>
        <div className="row">
          <button className="btn primary" onClick={() => onDone(plan)}>Save this plan</button>
          <button className="btn ghost" onClick={onCancel}>Discard</button>
        </div>
      </section>
    )
  }

  const roundDone = i > 0 && i % 2 === 0
  const lastArea = PLACEMENT[i - 1]?.area
  return (
    <section className="card placement" aria-label="Placement quiz">
      <div className="quiz-head">
        <span className="chip">{AREAS[q.area]}</span>
        <span className="dim small">Question {i + 1} of {PLACEMENT.length}</span>
        {roundDone && <span className="dim small">· {AREAS[lastArea]}: {areaScores(i)[lastArea]}/2</span>}
        <span className="spacer" />
        <button className="btn ghost small" onClick={onCancel}>Cancel</button>
      </div>
      <p className="quiz-q">{q.question}</p>
      <div className="choices quiz-choices" role="group" aria-label="Answers">
        {q.options.map((opt, k) => (
          <button key={k} className="choice" onClick={() => setAnswers([...answers, k])}>
            <span className="choice-key">{String.fromCharCode(65 + k)}</span>
            <pre>{opt}</pre>
          </button>
        ))}
      </div>
    </section>
  )
}
