import { useEffect, useState } from 'react'
import { dayKey } from '../lib/dates'
import { currentStreak, levelProgress } from '../lib/gamification'
import type { Route } from '../lib/router'
import { useStore } from '../store/useStore'
import { useUi } from '../store/ui'
import { Sprint } from './Sprint'

export function Topbar({ route }: { route: Route }) {
  const xp = useStore((s) => s.xp)
  const cards = useStore((s) => s.cards)
  const activity = useStore((s) => s.activity)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(t)
  }, [])
  const dueCount = Object.values(cards).filter((c) => c.due <= now).length
  const lp = levelProgress(xp)
  const streak = currentStreak(Object.keys(activity), dayKey())
  const link = (href: string, label: string, active: boolean, badge?: number) => (
    <a href={href} className={`nav-link ${active ? 'active' : ''}`} aria-current={active ? 'page' : undefined}>
      {label}
      {badge ? <span className="nav-badge" aria-label={`${badge} due`}>{badge}</span> : null}
    </a>
  )
  return (
    <header className="topbar">
      <a href="#/" className="logo" aria-label="Orbit home">
        <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden>
          <circle cx="16" cy="16" r="5" className="logo-core" />
          <ellipse cx="16" cy="16" rx="14" ry="6" className="logo-orbit" transform="rotate(-28 16 16)" />
          <circle cx="28" cy="10" r="2.2" className="logo-moon" />
        </svg>
        <span>ORBIT</span>
      </a>
      <nav aria-label="Primary">
        {link('#/', 'Map', route.name === 'map' || route.name === 'lesson')}
        {link('#/course', 'Course', route.name === 'course' || route.name === 'course-lesson')}
        {link('#/review', 'Review', route.name === 'review', dueCount)}
        {link('#/stats', 'Dashboard', route.name === 'stats')}
      </nav>
      <div className="top-right">
        <Sprint />
        {streak > 0 && <span className="chip streak" title={`${streak}-day streak`}>🔥 {streak}</span>}
        <span className="chip level" title={`${lp.into}/${lp.need} XP to level ${lp.level + 1}`}>
          Lv {lp.level}
          <span className="meter mini"><i style={{ width: `${lp.pct * 100}%` }} /></span>
        </span>
        <button className="kbd-btn" onClick={() => useUi.getState().set({ paletteOpen: true })} aria-label="Open command palette">
          <span>Search</span> <kbd>⌘K</kbd>
        </button>
        <button className="icon-btn" onClick={() => useUi.getState().set({ settingsOpen: true })} aria-label="Settings">⚙</button>
      </div>
    </header>
  )
}
