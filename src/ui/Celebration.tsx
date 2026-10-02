import { useEffect, useMemo } from 'react'
import { LESSON_BY_ID, lessonsOf } from '../content'
import { TRACK_BY_ID } from '../content/tracks'
import { go, lessonPath } from '../lib/router'
import { recommended } from '../lib/progress'
import { useStore } from '../store/useStore'
import { useUi } from '../store/ui'

export function Celebration() {
  const c = useUi((s) => s.celebration)
  const completed = useStore((s) => s.completed)
  const close = () => useUi.getState().setCelebration(null)
  const nextLesson = c ? recommended(completed, c.lessonId) : null
  const next = nextLesson?.id
  const lesson = c ? LESSON_BY_ID[c.lessonId] : null
  const color = lesson ? TRACK_BY_ID[lesson.track].color : 'var(--accent)'

  const sparks = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        a: (i / 30) * 360 + (i % 3) * 7,
        d: 90 + ((i * 37) % 80),
        s: 4 + ((i * 13) % 6),
        delay: (i % 5) * 30,
      })),
    [],
  )

  useEffect(() => {
    if (!c) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'Enter' && next) {
        close()
        go(lessonPath(next))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [c, next])

  useEffect(() => {
    if (!c) return
    window.addEventListener('hashchange', close)
    return () => window.removeEventListener('hashchange', close)
  }, [c])

  if (!c || !lesson) return null

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Lesson complete" onClick={close}>
      <div className="celebrate" style={{ ['--tc' as string]: color }} onClick={(e) => e.stopPropagation()}>
        <div className="burst" aria-hidden>
          {sparks.map((s, i) => (
            <span key={i} style={{ ['--a' as string]: `${s.a}deg`, ['--d' as string]: `${s.d}px`, width: s.s, height: s.s, animationDelay: `${s.delay}ms` }} />
          ))}
          <div className="burst-star">{lesson.kind === 'boss' ? '✹' : '✦'}</div>
        </div>
        <h2>{lesson.kind === 'boss' ? 'Boss defeated!' : 'Star lit!'}</h2>
        <p className="celebrate-title">{lesson.title}</p>
        <div className="celebrate-xp">+{c.xp} XP</div>
        {c.hints > 0 && <p className="dim">Hints used: {c.hints} (−{Math.min(c.hints, 3) * 15}% XP). Try a lesson with none for the full reward.</p>}
        {c.questBonus > 0 && <div className="celebrate-line">🎯 Daily quest complete: +{c.questBonus} XP</div>}
        {c.levelUp && <div className="celebrate-line level">⬆ Level {c.levelUp} reached</div>}
        {c.badges.map((b) => (
          <div key={b.id} className="celebrate-line achv-line"><span aria-hidden>{b.icon}</span> Achievement: <strong>{b.name}</strong> <span className="dim">{b.desc}</span></div>
        ))}
        {c.cardsAdded > 0 && <div className="celebrate-line dim">🧠 {c.cardsAdded} flashcard{c.cardsAdded > 1 ? 's' : ''} added to your Review deck</div>}
        {nextLesson && <p className="celebrate-next">Up next · {TRACK_BY_ID[nextLesson.track].name} · difficulty {nextLesson.order}/{lessonsOf(nextLesson.track).length}</p>}
        <div className="celebrate-actions">
          {nextLesson && (
            <button className="btn primary" autoFocus onClick={() => { close(); go(lessonPath(nextLesson.id)) }}>
              Next: {nextLesson.title} →
            </button>
          )}
          <button className="btn" onClick={() => { close(); go('#/') }}>Back to map</button>
          <button className="btn ghost" onClick={close}>Stay</button>
        </div>
      </div>
    </div>
  )
}
