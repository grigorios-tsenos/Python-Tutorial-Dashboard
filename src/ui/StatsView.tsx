import { useEffect, useMemo, useRef, useState } from 'react'
import { LESSONS } from '../content'
import { TRACK_BY_ID } from '../content/tracks'
import { KIND_LABEL } from '../content/types'
import { ACHIEVEMENTS } from '../lib/achievements'
import { accuracy, chapterLadder, compact, deckHealth, formatMinutes, kindBreakdown, minutesInvested, niceMax, recentCompletions, timeAgo, weeklyXp, type WeekBucket } from '../lib/dashboard'
import { addDays, dayKey, parseKey } from '../lib/dates'
import { bestStreak, currentStreak, levelProgress } from '../lib/gamification'
import { trackProgress } from '../lib/progress'
import { lessonPath } from '../lib/router'
import { DASHBOARD_PANELS, type DashboardPanel } from '../store/model'
import { useStore } from '../store/useStore'
import { STAGES } from './Difficulty'

const PANEL_TITLE: Record<DashboardPanel, string> = {
  weekly: 'XP per week',
  chapters: 'Chapter ladders',
  radar: 'Skill radar',
  kinds: 'Lesson types',
  deck: 'Review deck',
  recent: 'Recent completions',
  activity: 'Activity',
  achievements: 'Achievements',
}

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
    <svg viewBox="-48 -4 336 248" className="radar" role="img" aria-label="Skill radar: completion per chapter">
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon key={f} points={values.map((_, i) => pt(i, R * f).join(',')).join(' ')} className="radar-grid" />
      ))}
      {values.map((_, i) => (
        <line key={i} x1={C} y1={C} x2={pt(i, R)[0]} y2={pt(i, R)[1]} className="radar-axis" />
      ))}
      <polygon points={poly} className="radar-shape" />
      {values.map((v, i) => (
        <g key={v.label}>
          <circle cx={pt(i, R * Math.max(0.04, v.pct))[0]} cy={pt(i, R * Math.max(0.04, v.pct))[1]} r="4" fill={v.color} className="radar-dot" />
          <text x={pt(i, R + 17)[0]} y={pt(i, R + 17)[1] + 3} textAnchor="middle" className="radar-label">{v.label}</text>
        </g>
      ))}
    </svg>
  )
}

const monthDay = (key: string) => parseKey(key).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

/** Single-series column chart: XP per week. Thin bars, rounded caps, hairline grid, hover tooltip, table view. */
function WeeklyChart({ weeks }: { weeks: WeekBucket[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const box = useRef<HTMLDivElement>(null)
  const [W, setW] = useState(640)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const H = 210
  const padL = 40
  const padR = 12
  const padT = 22
  const padB = 28
  const max = niceMax(Math.max(...weeks.map((w) => w.xp)))
  const slot = (W - padL - padR) / weeks.length
  const bw = Math.min(24, slot * 0.58)
  const y = (v: number) => padT + (H - padT - padB) * (1 - v / max)
  const base = y(0)
  const peak = weeks.reduce((best, w, i) => (w.xp > weeks[best].xp ? i : best), 0)
  const bar = (x: number, top: number) => {
    const h = base - top
    if (h <= 0) return ''
    const r = Math.min(4, h)
    return `M${x},${base} V${top + r} Q${x},${top} ${x + r},${top} H${x + bw - r} Q${x + bw},${top} ${x + bw},${top + r} V${base} Z`
  }
  const total = weeks.reduce((s, w) => s + w.xp, 0)
  return (
    <div className="wk">
      {total === 0 && <p className="dim empty-note">Finish a lesson and its XP shows up here, week by week.</p>}
      <div className="wk-plot" ref={box}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="wk-chart" role="img" aria-label={`XP earned per week for the last ${weeks.length} weeks`} onMouseLeave={() => setHover(null)}>
          {[0, 0.5, 1].map((f) => (
            <g key={f}>
              <line x1={padL} x2={W - padR} y1={y(max * f)} y2={y(max * f)} className="wk-grid" />
              <text x={padL - 8} y={y(max * f) + 3.5} textAnchor="end" className="wk-tick">{compact(max * f)}</text>
            </g>
          ))}
          {weeks.map((w, i) => {
            const x = padL + slot * i + (slot - bw) / 2
            const top = y(w.xp)
            const last = i === weeks.length - 1
            const labelled = w.xp > 0 && (i === peak || last)
            return (
              <g key={w.start} className={`wk-col ${hover === i ? 'hot' : ''} ${last ? 'now' : ''}`} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0} aria-label={`Week of ${monthDay(w.start)}: ${w.xp} XP from ${w.lessons} lesson${w.lessons === 1 ? '' : 's'}`}>
                <rect x={padL + slot * i} y={padT} width={slot} height={H - padT - padB} className="wk-hit" />
                <path d={bar(x, top)} className="wk-bar" />
                {labelled && <text x={x + bw / 2} y={top - 5} textAnchor="middle" className="wk-val">{w.xp}</text>}
                {(weeks.length - 1 - i) % 2 === 0 && <text x={x + bw / 2} y={H - 8} textAnchor="middle" className="wk-tick">{last ? 'this week' : monthDay(w.start)}</text>}
              </g>
            )
          })}
          <line x1={padL} x2={W - padR} y1={base} y2={base} className="wk-axis" />
        </svg>
        {hover !== null && (
          <div className="wk-tip" style={{ left: `${((padL + slot * hover + slot / 2) / W) * 100}%` }} role="status">
            <strong>{weeks[hover].xp} XP</strong>
            <span className="dim">week of {monthDay(weeks[hover].start)} · {weeks[hover].lessons} lesson{weeks[hover].lessons === 1 ? '' : 's'}</span>
          </div>
        )}
      </div>
      <details className="table-view">
        <summary>Table view</summary>
        <table>
          <thead><tr><th>Week of</th><th>Lessons</th><th>XP</th></tr></thead>
          <tbody>{weeks.map((w) => <tr key={w.start}><td>{monthDay(w.start)}</td><td>{w.lessons}</td><td>{w.xp}</td></tr>)}</tbody>
        </table>
      </details>
    </div>
  )
}

function Kpi({ label, value, sub, delta, children }: { label: string; value: string; sub?: string; delta?: { text: string; dir: 'up' | 'down' | 'flat' }; children?: React.ReactNode }) {
  return (
    <div className="kpi">
      {children}
      <div className="kpi-body">
        <div className="kpi-k">{label}</div>
        <div className="kpi-v">{value}</div>
        {delta && <div className={`kpi-d ${delta.dir}`}>{delta.dir === 'up' ? '▲' : delta.dir === 'down' ? '▼' : '•'} {delta.text}</div>}
        {sub && <div className="kpi-s">{sub}</div>}
      </div>
    </div>
  )
}

const pct = (v: number | null) => (v === null ? '—' : `${Math.round(v * 100)}%`)

export function StatsView() {
  const s = useStore()
  const setSetting = useStore((st) => st.setSetting)
  const [picker, setPicker] = useState(false)
  const today = dayKey()
  const now = Date.now()
  const days = Object.keys(s.activity)
  const lp = levelProgress(s.xp)
  const progress = useMemo(() => trackProgress(s.completed), [s.completed])
  const weeks = useMemo(() => weeklyXp(s.completed, today), [s.completed, today])
  const acc = useMemo(() => accuracy(s.completed), [s.completed])
  const ladder = useMemo(() => chapterLadder(s.completed), [s.completed])
  const kinds = useMemo(() => kindBreakdown(s.completed), [s.completed])
  const deck = useMemo(() => deckHealth(s.cards, now), [s.cards, now])
  const recent = useMemo(() => recentCompletions(s.completed), [s.completed])
  const minutes = minutesInvested(s.completed)
  const total = LESSONS.length
  const done = Object.keys(s.completed).length
  const hidden = new Set(s.settings.dashboardHidden)
  const show = (p: DashboardPanel) => !hidden.has(p)
  const toggle = (p: DashboardPanel) => setSetting('dashboardHidden', show(p) ? [...s.settings.dashboardHidden, p] : s.settings.dashboardHidden.filter((x) => x !== p))

  const thisWeek = weeks[weeks.length - 1]
  const lastWeek = weeks[weeks.length - 2]
  const diff = thisWeek.xp - lastWeek.xp
  const streak = currentStreak(days, today)

  const WEEKS = 26
  const grid = useMemo(() => {
    const end = parseKey(today)
    const start = parseKey(addDays(today, -(WEEKS * 7 - 1) - end.getDay()))
    const cols: { key: string; n: number; future: boolean }[][] = []
    let cur = dayKey(start)
    for (let w = 0; w < WEEKS + 1; w++) {
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
  const deckTotal = Math.max(1, deck.total)

  return (
    <div className="page stats">
      <div className="dash-head">
        <div>
          <h1>Dashboard</h1>
          <p className="dim">Your learning telemetry. Stored on this device only.</p>
        </div>
        <button className={`btn small ${picker ? '' : 'ghost'}`} aria-expanded={picker} aria-controls="panel-picker" onClick={() => setPicker((p) => !p)}>⚙ Customize</button>
      </div>
      {picker && (
        <div id="panel-picker" className="panel-picker" role="group" aria-label="Show or hide panels">
          {DASHBOARD_PANELS.map((p) => (
            <button key={p} className={`pill ${show(p) ? 'on' : ''}`} aria-pressed={show(p)} onClick={() => toggle(p)}>{PANEL_TITLE[p]}</button>
          ))}
          {hidden.size > 0 && <button className="linklike" onClick={() => setSetting('dashboardHidden', [])}>Show all</button>}
        </div>
      )}

      <div className="kpi-grid">
        <Kpi label="Level" value={`${compact(s.xp)} XP`} sub={`${lp.need - lp.into} XP to level ${lp.level + 1}`}>
          <svg viewBox="0 0 100 100" width="84" height="84" aria-hidden>
            <circle cx="50" cy="50" r="44" className="ring-bg" />
            <circle cx="50" cy="50" r="44" className="ring-fg" strokeDasharray={circ} strokeDashoffset={circ * (1 - lp.pct)} transform="rotate(-90 50 50)" />
            <text x="50" y="58" textAnchor="middle" className="ring-text">{lp.level}</text>
          </svg>
        </Kpi>
        <Kpi label="Stars lit" value={`${done} / ${total}`} sub={`${Math.round((done / total) * 100)}% of the sky`} />
        <Kpi label="XP this week" value={compact(thisWeek.xp)} delta={{ text: `${diff >= 0 ? '+' : ''}${diff} vs last week`, dir: diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat' }} sub={`${thisWeek.lessons} lesson${thisWeek.lessons === 1 ? '' : 's'} finished`} />
        <Kpi label="Day streak" value={String(streak)} sub={`best ${bestStreak(days)} day${bestStreak(days) === 1 ? '' : 's'}`} />
        <Kpi label="First-try rate" value={pct(acc.firstTry)} sub={acc.hintFree === null ? 'no lessons finished yet' : `${pct(acc.hintFree)} without hints`} />
        <Kpi label="Time invested" value={formatMinutes(minutes)} sub={`${s.stats.runs} run${s.stats.runs === 1 ? '' : 's'} · ${s.stats.reviews} review${s.stats.reviews === 1 ? '' : 's'}`} />
      </div>

      <div className="dash-grid">
        {show('weekly') && (
          <section className="card span-2" aria-label={PANEL_TITLE.weekly}>
            <h2>{PANEL_TITLE.weekly} <span className="dim">last 12 weeks</span></h2>
            <WeeklyChart weeks={weeks} />
          </section>
        )}

        {show('chapters') && (
          <section className="card span-2" aria-label={PANEL_TITLE.chapters}>
            <h2>{PANEL_TITLE.chapters} <span className="dim">9 steps each, Basics → Boss</span></h2>
            <div className="ladder">
              {ladder.map(({ track: t, steps, next, done: d }) => (
                <div key={t.id} className="ladder-row" style={{ ['--tc' as string]: t.color }}>
                  <span className="ladder-name"><i className="swatch" aria-hidden />{t.glyph} {t.name}</span>
                  <ol className="ladder-cells" aria-label={`${t.name}: ${d} of ${steps.length} steps done`}>
                    {steps.map(({ lesson, done: ok }) => (
                      <li key={lesson.id}>
                        <a href={lessonPath(lesson.id)} className={`ladder-cell ${ok ? 'done' : next?.id === lesson.id ? 'next' : ''}`} title={`${STAGES[lesson.order - 1].label}: ${lesson.title}${ok ? ' ✓' : ''}`} aria-label={`${STAGES[lesson.order - 1].label}: ${lesson.title}${ok ? ', completed' : ''}`} />
                      </li>
                    ))}
                  </ol>
                  <span className="ladder-count">{d}/{steps.length}</span>
                  {next ? <a className="ladder-next" href={lessonPath(next.id)}>Next: {next.title} →</a> : <span className="ladder-next done">Chapter complete ★</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        {show('radar') && (
          <section className="card" aria-label={PANEL_TITLE.radar}>
            <h2>{PANEL_TITLE.radar} <span className="dim">completion per chapter</span></h2>
            <Radar values={progress.map((p) => ({ label: p.track.name, pct: p.pct, color: p.track.color }))} />
          </section>
        )}

        {show('kinds') && (
          <section className="card" aria-label={PANEL_TITLE.kinds}>
            <h2>{PANEL_TITLE.kinds} <span className="dim">done / available</span></h2>
            <div className="hbars">
              {kinds.map((k) => (
                <div key={k.kind} className="hbar-row" title={`${k.label}: ${k.done} of ${k.total}`}>
                  <span className="hbar-k">{k.label}</span>
                  <span className="hbar"><i style={{ width: `${(k.done / k.total) * 100}%` }} /></span>
                  <span className="hbar-v">{k.done}<span className="dim">/{k.total}</span></span>
                </div>
              ))}
            </div>
          </section>
        )}

        {show('deck') && (
          <section className="card" aria-label={PANEL_TITLE.deck}>
            <h2>{PANEL_TITLE.deck} <span className="dim">spaced repetition</span></h2>
            {deck.total === 0 ? (
              <p className="dim empty-note">Finish a lesson and its recall cards join your deck.</p>
            ) : (
              <>
                <div className="deck-stats">
                  <div><div className="kpi-v small">{deck.due}</div><div className="kpi-s">due now</div></div>
                  <div><div className="kpi-v small">{deck.learning}</div><div className="kpi-s">learning</div></div>
                  <div><div className="kpi-v small">{deck.mature}</div><div className="kpi-s">mature</div></div>
                  <div><div className="kpi-v small">{deck.avgEase === null ? '—' : deck.avgEase.toFixed(2)}</div><div className="kpi-s">avg ease</div></div>
                </div>
                <div className="stack" role="img" aria-label={`${deck.fresh} new, ${deck.learning} learning, ${deck.mature} mature of ${deck.total} cards`}>
                  {deck.fresh > 0 && <i className="st-fresh" style={{ flex: deck.fresh / deckTotal }} />}
                  {deck.learning > 0 && <i className="st-learning" style={{ flex: deck.learning / deckTotal }} />}
                  {deck.mature > 0 && <i className="st-mature" style={{ flex: deck.mature / deckTotal }} />}
                </div>
                <div className="stack-legend">
                  <span><i className="st-fresh" /> new {deck.fresh}</span>
                  <span><i className="st-learning" /> learning {deck.learning}</span>
                  <span><i className="st-mature" /> mature {deck.mature}</span>
                </div>
                {deck.hardest.length > 0 && (
                  <div className="hardest">
                    <div className="kpi-k">Most forgotten</div>
                    <ul>{deck.hardest.map((c) => <li key={c.id}><span>{c.q}</span><span className="dim">{c.lapses}×</span></li>)}</ul>
                  </div>
                )}
                {deck.due > 0 && <a className="btn small" href="#/review">Review {deck.due} due →</a>}
              </>
            )}
          </section>
        )}

        {show('recent') && (
          <section className="card" aria-label={PANEL_TITLE.recent}>
            <h2>{PANEL_TITLE.recent}</h2>
            {recent.length === 0 ? (
              <p className="dim empty-note">Nothing finished yet. <a href="#/">Open the map</a> and light a star.</p>
            ) : (
              <table className="recent">
                <thead><tr><th>Lesson</th><th className="hide-sm">Type</th><th className="num">XP</th><th className="num hide-sm">Hints</th><th>When</th></tr></thead>
                <tbody>
                  {recent.map((r) => (
                    <tr key={r.lesson.id} style={{ ['--tc' as string]: TRACK_BY_ID[r.lesson.track].color }}>
                      <td><a href={lessonPath(r.lesson.id)}><i className="swatch" aria-hidden />{r.lesson.title}</a></td>
                      <td className="dim hide-sm">{KIND_LABEL[r.lesson.kind]}</td>
                      <td className="num">{r.xp}</td>
                      <td className="num hide-sm">{r.hints}</td>
                      <td className="dim">{timeAgo(r.at, now)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {show('activity') && (
          <section className="card span-2" aria-label={PANEL_TITLE.activity}>
            <h2>{PANEL_TITLE.activity} <span className="dim">last 6 months</span></h2>
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
        )}

        {show('achievements') && (
          <section className="card span-2" aria-label={PANEL_TITLE.achievements}>
            <h2>{PANEL_TITLE.achievements} <span className="dim">{earned}/{ACHIEVEMENTS.length}</span></h2>
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
        )}
      </div>

      <p className="dim small">Orbit stores everything on this device. Back it up from Settings → Export.</p>
    </div>
  )
}
