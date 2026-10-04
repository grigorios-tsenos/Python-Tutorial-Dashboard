import { useMemo } from 'react'
import { dayKey } from '../lib/dates'
import { QUEST_BONUS, QUEST_TARGET } from '../lib/gamification'
import { redoQueue } from '../lib/learning'
import { recommended } from '../lib/progress'
import { go, lessonPath } from '../lib/router'
import { useStore } from '../store/useStore'

/** The daily loop that actually builds skill: recall, redo from memory, then something new. */
export function TodayLoop() {
  const cards = useStore((s) => s.cards)
  const completed = useStore((s) => s.completed)
  const lastLesson = useStore((s) => s.lastLesson)
  const quest = useStore((s) => s.quest)
  const now = Date.now()
  const today = dayKey()
  const due = useMemo(() => Object.values(cards).filter((c) => c.due <= now).length, [cards, now])
  const redo = useMemo(() => redoQueue(completed, now)[0], [completed, now])
  const next = recommended(completed, lastLesson)
  const newToday = quest.date === today ? quest.done : 0

  const startRedo = () => {
    if (!redo) return
    useStore.getState().redoLesson(redo.id)
    go(lessonPath(redo.id))
  }

  return (
    <ol className="loop" aria-label="Today's loop">
      <li className={due === 0 ? 'done' : ''}>
        <span className="loop-n">1</span>
        <div><strong>Recall</strong><div className="loop-sub">{due === 0 ? 'Deck clear' : <a href="#/review">{due} card{due === 1 ? '' : 's'} due →</a>}</div></div>
      </li>
      <li className={redo ? '' : 'done'}>
        <span className="loop-n">2</span>
        <div><strong>Redo from memory</strong><div className="loop-sub">{redo ? <button className="linklike" onClick={startRedo}>{redo.title} →</button> : 'Nothing solved with help lately'}</div></div>
      </li>
      <li className={newToday >= QUEST_TARGET ? 'done' : ''}>
        <span className="loop-n">3</span>
        <div><strong>Learn</strong><div className="loop-sub">{next ? <a href={lessonPath(next.id)}>{next.title} →</a> : 'Every star is lit'}<span className="dim"> · {Math.min(newToday, QUEST_TARGET)}/{QUEST_TARGET} today{newToday >= QUEST_TARGET ? '' : ` for +${QUEST_BONUS} XP`}</span></div></div>
      </li>
    </ol>
  )
}
