import { useMemo } from 'react'
import { LESSONS } from '../content'
import { ACHIEVEMENTS } from '../lib/achievements'
import { addDays, dayKey, parseKey } from '../lib/dates'
import { bestStreak, currentStreak, levelProgress } from '../lib/gamification'
import { trackProgress } from '../lib/progress'
import { useStore } from '../store/useStore'

function Radar({ values }: { values: { label: string; pct: number; color: string }[] }) {
  const R = 92
  const C = 120
  const n = values.length
  const pt = (i: number, r: number) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2
    return [C + Math.cos(a) * r, C + Math.sin(a) * r] as const
  }
  const poly = values.map((v, i) => pt(i, R * Math.max(0.04, v.pct)).join(',')).join(' ')
  return (
    <svg viewBox="-48 -4 336 248" className="radar" role="img" aria-label="Skill radar: completion per track">
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon key={f} points={values.map((_, i) => pt(i, R * f).join(',')).join(' ')} className="radar-grid" />
      ))}
      {values.map((_, i) => (
        <line key={i} x1={C} y1={C} x2={pt(i, R)[0]} y2={pt(i, R)[1]} className="radar-axis" />
      ))}
      <polygon points={poly} className="radar-shape" />
      {values.map((v, i) => (
        <g key={v.label}>
          <circle cx={pt(i, R * Math.max(0.04, v.pct))[0]} cy={pt(i, R * Math.max(0.04, v.pct))[1]} r="3.5" fill={v.color} />
          <text x={pt(i, R + 17)[0]} y={pt(i, R + 17)[1] + 3} textAnchor="middle" className="radar-label">{v.label}</text>
        </g>
      ))}
    </svg>
  )
}

export function StatsView() {
  const s = useStore()
  const today = dayKey()
  const days = Object.keys(s.activity)
  const lp = levelProgress(s.xp)
  const progress = useMemo(() => trackProgress(s.completed), [s.completed])
  const total = LESSONS.length
  const done = Object.keys(s.completed).length

  const weeks = 26
  const grid = useMemo(() => {
    const end = parseKey(today)
    const start = parseKey(addDays(today, -(weeks * 7 - 1) - end.getDay()))
    const cols: { key: string; n: number; future: boolean }[][] = []
    let cur = dayKey(start)
    for (let w = 0; w < weeks + 1; w++) {
      const col = []
      for (let d = 0; d < 7; d++) {
        col.push({ key: cur, n: s.activity[cur] ?? 0, future: cur > today })
        cur = addDays(cur, 1)
      }
      cols.push(col)
    }
    return cols
  }, [s.activity, today])
  const level = (n: number) => (n === 0 ? 0 : n < 2 ? 1 : n < 4 ? 2 : n < 7 ? 3 : 4)
  const earned = ACHIEVEMENTS.filter((a) => s.badges[a.id]).length
  const circ = 2 * Math.PI * 44

  return (
    <div className="page stats">
      <h1>Your orbit</h1>

      <div className="stat-cards">
        <div className="card ring-card">
          <svg viewBox="0 0 100 100" width="104" height="104" aria-hidden>
            <circle cx="50" cy="50" r="44" className="ring-bg" />
            <circle cx="50" cy="50" r="44" className="ring-fg" strokeDasharray={circ} strokeDashoffset={circ * (1 - lp.pct)} transform="rotate(-90 50 50)" />
            <text x="50" y="56" textAnchor="middle" className="ring-text">{lp.level}</text>
          </svg>
          <div>
            <div className="card-k">Level</div>
            <div className="card-v">{s.xp} XP</div>
            <div className="dim">{lp.need - lp.into} XP to level {lp.level + 1}</div>
          </div>
        </div>
        <div className="card"><div className="card-k">Stars lit</div><div className="card-v">{done}<span className="dim">/{total}</span></div><div className="dim">{Math.round((done / total) * 100)}% of the sky</div></div>
        <div className="card"><div className="card-k">Streak</div><div className="card-v">{currentStreak(days, today)} 🔥</div><div className="dim">best: {bestStreak(days)} day{bestStreak(days) === 1 ? '' : 's'}</div></div>
        <div className="card"><div className="card-k">Practice</div><div className="card-v">{s.stats.runs}</div><div className="dim">runs · {s.stats.reviews} card{s.stats.reviews === 1 ? '' : 's'} reviewed</div></div>
      </div>

      <div className="stats-grid">
        <section className="card">
          <h2>Skill radar</h2>
          <Radar values={progress.map((p) => ({ label: p.track.name, pct: p.pct, color: p.track.color }))} />
        </section>
        <section className="card">
          <h2>Tracks</h2>
          {progress.map(({ track: t, done: d, total: tt }) => (
            <div key={t.id} className="track-row" style={{ ['--tc' as string]: t.color }}>
              <span className="track-name">{t.glyph} {t.name}</span>
              <span className="legend-bar"><i style={{ width: `${(d / tt) * 100}%` }} /></span>
              <span className="legend-count">{d}/{tt}</span>
            </div>
          ))}
        </section>
      </div>

      <section className="card">
        <h2>Activity <span className="dim">last 6 months</span></h2>
        <div className="heat" role="img" aria-label="Activity heatmap">
          {grid.map((col, i) => (
            <div key={i} className="heat-col">
              {col.map((c) => (
                <i key={c.key} className={`heat-cell l${c.future ? 'x' : level(c.n)}`} title={`${c.key}: ${c.n} action${c.n === 1 ? '' : 's'}`} />
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Achievements <span className="dim">{earned}/{ACHIEVEMENTS.length}</span></h2>
        <div className="achv-grid">
          {ACHIEVEMENTS.map((a) => {
            const got = s.badges[a.id]
            return (
              <div key={a.id} className={`achv ${got ? 'got' : ''}`}>
                <span className="achv-icon" aria-hidden>{got ? a.icon : '🔒'}</span>
                <div>
                  <strong>{a.name}</strong>
                  <div className="dim">{a.desc}</div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <p className="dim small">Orbit stores everything on this device. Back it up from Settings → Export.</p>
    </div>
  )
}
