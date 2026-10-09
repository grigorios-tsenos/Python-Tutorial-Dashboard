import { useEffect, useState } from 'react'
import { COURSE_BY_KEY, coursePath, fetchCourseQuiz, phaseGrade, pickSpread, type CoursePhase, type QuizQuestion } from '../content/course'
import { useStore } from '../store/useStore'
import { Quiz } from './Quiz'

const N = 8

/** The curriculum's check-understanding: 8 questions spread across a phase's lessons; misses point back at the lessons to re-read. */
export function PhaseCheck({ phase, onClose }: { phase: CoursePhase; onClose: () => void }) {
  const best = useStore((s) => s.coursePhaseCheck[phase.dir])
  const [attempt, setAttempt] = useState(0)
  const [pool, setPool] = useState<{ q: QuizQuestion; key: string }[] | null>(null)
  const [result, setResult] = useState<{ score: number; missed: number[] } | null>(null)

  useEffect(() => {
    let live = true
    setPool(null)
    setResult(null)
    const withQuiz = phase.lessons.filter((l) => l.quiz).map((l) => `${phase.dir}/${l.dir}`)
    Promise.all(pickSpread(withQuiz, N, attempt).map((key) => fetchCourseQuiz(key).then((qs) => (qs.filter((q) => q.stage === 'post').length ? qs.filter((q) => q.stage === 'post') : qs).map((q) => ({ q, key })))))
      .then((lists) => live && setPool(pickSpread(lists.flat(), N, attempt)))
      .catch(() => live && setPool([]))
    return () => {
      live = false
    }
  }, [phase.dir, attempt])

  if (!pool) return <section className="card phase-check"><span className="spinner" aria-hidden /> Picking {N} questions from Phase {phase.n}…</section>
  if (!pool.length) {
    return (
      <section className="card phase-check">
        <p className="dim">Phase {phase.n} has no quizzes to draw from.</p>
        <button className="btn ghost small" onClick={onClose}>Close</button>
      </section>
    )
  }

  const finish = (score: number, total: number, missed: number[]) => {
    setResult({ score, missed })
    useStore.getState().setPhaseCheck(phase.dir, score, total)
  }

  return (
    <section className="card phase-check" aria-label="Phase check">
      <div className="quiz-head">
        <span className="eyebrow" style={{ margin: 0 }}>Phase check · {pool.length} questions</span>
        {best && <span className="dim small">best {best.score}/{best.total}</span>}
        <span className="spacer" />
        <button className="btn ghost small" onClick={onClose}>Close</button>
      </div>
      {result ? (
        <div className="phase-result">
          <div className="quiz-score">{result.score} / {pool.length} · {phaseGrade(result.score, pool.length).label}</div>
          <p>{phaseGrade(result.score, pool.length).advice}</p>
          {result.missed.length > 0 && (
            <ul className="phase-missed">
              {[...new Set(result.missed.map((i) => pool[i].key))].map((key) => (
                <li key={key}><a href={coursePath(key)}>Review: {COURSE_BY_KEY[key].lesson.title}</a></li>
              ))}
            </ul>
          )}
          <div className="row">
            <button className="btn primary small" onClick={() => setAttempt((a) => a + 1)}>Retake with other questions</button>
          </div>
        </div>
      ) : (
        <Quiz key={attempt} questions={pool.map((p) => p.q)} tags={pool.map((p) => COURSE_BY_KEY[p.key].lesson.title)} onFinish={finish} />
      )}
    </section>
  )
}
