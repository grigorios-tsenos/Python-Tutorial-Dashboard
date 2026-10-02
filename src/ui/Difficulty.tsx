import { lessonsOf } from '../content'
import { TRACK_BY_ID } from '../content/tracks'
import type { Lesson } from '../content/types'
import { lessonPath } from '../lib/router'
import { useStore } from '../store/useStore'

const STAGES = [
  { label: 'Guided', detail: 'Follow an example and complete a focused task.' },
  { label: 'Practice', detail: 'Apply the idea yourself and check what happens.' },
  { label: 'Challenge', detail: 'Reason through behavior and combine what you have learned.' },
  { label: 'Advanced', detail: 'Build a reusable solution for unfamiliar inputs.' },
  { label: 'Expert', detail: 'Handle boundaries and connect ideas with less scaffolding.' },
  { label: 'Boss', detail: 'Build a complete workflow that also handles edge cases.' },
]

export function Difficulty({ lesson }: { lesson: Lesson }) {
  const completed = useStore((s) => s.completed)
  const lessons = lessonsOf(lesson.track)
  const stage = STAGES[lesson.order - 1]

  return (
    <nav className="difficulty" aria-label={`${TRACK_BY_ID[lesson.track].name} difficulty progression`}>
      <div className="difficulty-heading"><span>Difficulty {lesson.order}/{lessons.length}</span><strong>{stage.label}</strong></div>
      <ol className="difficulty-path">
        {lessons.map((l) => (
          <li key={l.id}>
            <a className={`difficulty-step ${completed[l.id] ? 'done' : ''}`} href={lessonPath(l.id)} aria-current={l.id === lesson.id ? 'step' : undefined} aria-label={`${STAGES[l.order - 1].label}: ${l.title}${completed[l.id] ? ', completed' : ''}`}>
              <span className="difficulty-number" aria-hidden>{completed[l.id] ? '✓' : `0${l.order}`}</span>
              <span>{STAGES[l.order - 1].label}</span>
            </a>
          </li>
        ))}
      </ol>
      <p className="difficulty-detail">{stage.detail}</p>
    </nav>
  )
}
