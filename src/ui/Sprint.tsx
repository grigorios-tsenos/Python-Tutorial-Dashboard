import { useEffect, useState } from 'react'
import { mmss } from '../lib/learning'
import { useStore } from '../store/useStore'
import { useUi } from '../store/ui'

/**
 * Focus sprint: one tap starts a short, visible countdown; when it ends you are told to step away.
 * A fixed, finite block of work is easier to start than an open-ended one.
 */
export function Sprint() {
  const end = useUi((s) => s.sprintEnd)
  const minutes = useStore((s) => s.settings.sprint)
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!end) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [end])
  useEffect(() => {
    if (end && now >= end) {
      const ui = useUi.getState()
      ui.set({ sprintEnd: null })
      ui.push('Sprint done. Stand up, water, eyes off the screen for 3 minutes. The lesson will wait.', 'success', '⏱')
    }
  }, [end, now])
  if (!end) {
    return (
      <button className="chip sprint" onClick={() => useUi.getState().set({ sprintEnd: Date.now() + minutes * 60_000 })} title="Start a focus sprint (length in Settings)">
        ⏱ Focus {minutes}m
      </button>
    )
  }
  const left = Math.max(0, end - now)
  const pct = 1 - left / (minutes * 60_000)
  return (
    <button className="chip sprint on" onClick={() => useUi.getState().set({ sprintEnd: null })} title="Stop the sprint" aria-label={`Focus sprint, ${mmss(left / 1000)} left. Click to stop`}>
      <span className="ring" style={{ ['--p' as string]: `${pct * 360}deg` }} aria-hidden />
      {mmss(left / 1000)}
    </button>
  )
}
