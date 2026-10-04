import { useEffect, useMemo, useState } from 'react'
import { LESSON_BY_ID } from '../content'
import { TRACK_BY_ID } from '../content/tracks'
import { GRADE_LABEL, previewInterval, type Grade } from '../lib/gamification'
import { redoQueue } from '../lib/learning'
import { go, lessonPath } from '../lib/router'
import { useStore } from '../store/useStore'

/** Lessons solved with help, a day or more ago: pass them again from memory to earn the XP back. */
function RedoQueue() {
  const completed = useStore((s) => s.completed)
  const queue = useMemo(() => redoQueue(completed, Date.now()).slice(0, 3), [completed])
  if (queue.length === 0) return null
  return (
    <section className="redo-queue" aria-label="Redo from memory">
      <h2>Redo from memory <span className="dim">· solved with help a day or more ago</span></h2>
      {queue.map((l) => {
        const h = completed[l.id].hints
        return (
          <div key={l.id} className="redo-row">
            <span><span style={{ color: TRACK_BY_ID[l.track].color }}>{TRACK_BY_ID[l.track].glyph}</span> {l.title} <span className="dim">· {h >= 3 ? 'solution shown' : `${h} hint${h === 1 ? '' : 's'}`}</span></span>
            <button className="btn small" onClick={() => { useStore.getState().redoLesson(l.id); go(lessonPath(l.id)) }}>Redo</button>
          </div>
        )
      })}
    </section>
  )
}

export function ReviewView() {
  const cards = useStore((s) => s.cards)
  const gradeCard = useStore((s) => s.gradeCard)
  const [now] = useState(() => Date.now())
  const [flipped, setFlipped] = useState(false)
  const [reviewed, setReviewed] = useState(0)

  const due = useMemo(
    () => Object.values(cards).filter((c) => c.due <= now).sort((a, b) => a.due - b.due),
    [cards, now],
  )
  // keep a stable queue head: 'Again' cards re-enter 10 min later, so we only ever look at the first due card
  const card = due[0]
  const total = useMemo(() => Object.keys(cards).length, [cards])
  const upcoming = useMemo(() => Object.values(cards).filter((c) => c.due > now).sort((a, b) => a.due - b.due), [cards, now])

  const grade = (g: Grade) => {
    if (!card) return
    gradeCard(card.id, g)
    setFlipped(false)
    setReviewed((n) => n + 1)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!card) return
      const t = e.target as HTMLElement
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        setFlipped((f) => !f)
      } else if (flipped && ['1', '2', '3', '4'].includes(e.key)) grade((Number(e.key) - 1) as Grade)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (total === 0) {
    return (
      <div className="page center">
        <div className="empty-art" aria-hidden>🧠</div>
        <h1>Your Review deck is empty</h1>
        <p className="dim">Finish a lesson and its recall cards land here. Missed predictions too. Spaced repetition shows each card just before you'd forget it.</p>
        <a className="btn primary" href="#/">Find a star</a>
        <RedoQueue />
      </div>
    )
  }

  if (!card) {
    const nextDue = upcoming[0]
    const mins = nextDue ? Math.max(1, Math.round((nextDue.due - now) / 60_000)) : 0
    return (
      <div className="page center">
        <div className="empty-art" aria-hidden>✨</div>
        <h1>All caught up</h1>
        <p className="dim">
          {reviewed > 0 ? `You reviewed ${reviewed} card${reviewed > 1 ? 's' : ''} this session. ` : ''}
          {nextDue ? `Next card is due in ${mins < 60 ? `${mins} min` : mins < 1440 ? `${Math.round(mins / 60)} h` : `${Math.round(mins / 1440)} d`}.` : 'Nothing is scheduled.'}
        </p>
        <a className="btn primary" href="#/">Back to the map</a>
        <RedoQueue />
      </div>
    )
  }

  const lesson = LESSON_BY_ID[card.lessonId]
  const track = TRACK_BY_ID[lesson.track]
  const progressPct = (reviewed / (reviewed + due.length)) * 100

  return (
    <div className="page review">
      <div className="review-head">
        <h1>Review</h1>
        <span className="dim">{due.length} due · {total} in deck</span>
      </div>
      <div className="meter wide"><i style={{ width: `${progressPct}%` }} /></div>
      <RedoQueue />
      <button className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped((f) => !f)} style={{ ['--tc' as string]: track.color }} aria-label={flipped ? 'Answer shown. Click to hide.' : 'Click to reveal the answer'}>
        <span className="fc-from">{track.glyph} {track.name} · {lesson.title}</span>
        <span className="fc-q">{card.q}</span>
        {flipped ? <span className="fc-a">{card.a}</span> : <span className="fc-hint">Think of your answer, then press <kbd>Space</kbd></span>}
      </button>
      {flipped && (
        <div className="grades" role="group" aria-label="How well did you remember?">
          {GRADE_LABEL.map((label, g) => (
            <button key={label} className={`grade grade-${g}`} onClick={() => grade(g as Grade)}>
              <span>{label}</span>
              <small>{previewInterval(card, g as Grade, Date.now())} · <kbd>{g + 1}</kbd></small>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
