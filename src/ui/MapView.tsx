import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LESSONS, lessonsOf } from '../content'
import { MAP_SIZE, TRACKS, TRACK_BY_ID } from '../content/tracks'
import { KIND_LABEL, type Lesson, type Track } from '../content/types'
import { dayKey } from '../lib/dates'
import { QUEST_BONUS, QUEST_TARGET, currentStreak, levelProgress } from '../lib/gamification'
import { recommended, trackProgress } from '../lib/progress'
import { go, lessonPath } from '../lib/router'
import { tipOfTheDay } from '../lib/tips'
import { useStore } from '../store/useStore'
import { Difficulty } from './Difficulty'

const { w: W, h: H } = MAP_SIZE

const STAR_GAP = 74

/** Stars zigzag along a tilted arc: odd stars sit above the line (label above), even stars below (label below). */
function starSpots(t: Track, count: number): { x: number; y: number; up: boolean }[] {
  const rad = (t.tilt * Math.PI) / 180
  const local = Array.from({ length: count }, (_, i) => [(i - (count - 1) / 2) * STAR_GAP, i % 2 ? -46 : 38])
  return local.map(([lx, ly]) => ({ x: t.x + lx * Math.cos(rad) - ly * Math.sin(rad), y: t.y + lx * Math.sin(rad) + ly * Math.cos(rad), up: ly < 0 }))
}

/** Greedy word wrap so neighbouring labels on the same row don't collide. */
function wrapLabel(title: string, max = 22): string[] {
  const lines: string[] = []
  for (const word of title.split(' ')) {
    const last = lines.at(-1)
    if (last !== undefined && (last + ' ' + word).length <= max) lines[lines.length - 1] = last + ' ' + word
    else lines.push(word)
  }
  return lines
}

const SPOTS: Record<string, { x: number; y: number; up: boolean }> = {}
for (const t of TRACKS) {
  const ls = lessonsOf(t.id)
  const spots = starSpots(t, ls.length)
  ls.forEach((l, i) => (SPOTS[l.id] = spots[i]))
}

const DUST = (() => {
  let s = 12345
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)
  return Array.from({ length: 240 }, () => ({ x: rnd() * W, y: rnd() * H, r: 0.5 + rnd() * 1.4, o: 0.15 + rnd() * 0.5, tw: rnd() < 0.25 }))
})()

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

const LABEL_MODE = { all: 'all', focus: 'next', off: 'hover' } as const

function StarLabel({ title, up, offset }: { title: string; up: boolean; offset: number }) {
  const lines = wrapLabel(title)
  const first = up ? -offset - (lines.length - 1) * 14 : offset + 8
  return (
    <text className="star-label" y={first} textAnchor="middle">
      {lines.map((line, i) => <tspan key={i} x={0} dy={i ? 14 : 0}>{line}</tspan>)}
    </text>
  )
}

export function MapView() {
  const completed = useStore((s) => s.completed)
  const lastLesson = useStore((s) => s.lastLesson)
  const xp = useStore((s) => s.xp)
  const quest = useStore((s) => s.quest)
  const activity = useStore((s) => s.activity)
  const reduceMotion = useStore((s) => s.settings.reduceMotion)
  const mapLabels = useStore((s) => s.settings.mapLabels)
  const setSetting = useStore((s) => s.setSetting)

  const today = dayKey()
  const streak = currentStreak(Object.keys(activity), today)
  const lp = levelProgress(xp)
  const next = recommended(completed, lastLesson)
  const progress = useMemo(() => trackProgress(completed), [completed])
  const totalDone = Object.keys(completed).length
  const questDone = quest.date === today ? quest.done : 0

  const wrap = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [cam, setCam] = useState({ x: 0, y: 0, k: 1 })
  const [animating, setAnimating] = useState(false)
  const animationTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [hover, setHover] = useState<string | null>(null)
  const drag = useRef<{ x: number; y: number; cx: number; cy: number; moved: boolean } | null>(null)
  const fitK = size.w && size.h ? Math.min(size.w / W, size.h / H) : 1
  const inited = useRef(false)

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el)
    setSize({ w: el.clientWidth, h: el.clientHeight })
    return () => ro.disconnect()
  }, [])

  const animate = useCallback(
    (to: { x: number; y: number; k: number }) => {
      clearTimeout(animationTimer.current)
      setAnimating(!reduceMotion)
      if (!reduceMotion) {
        animationTimer.current = setTimeout(() => setAnimating(false), 520)
      }
      setCam(to)
    },
    [reduceMotion],
  )

  useEffect(() => () => clearTimeout(animationTimer.current), [])

  const stopAnimation = () => {
    clearTimeout(animationTimer.current)
    setAnimating(false)
  }

  const fit = useCallback(() => {
    const k = Math.min(size.w / W, size.h / H) * 0.98
    animate({ k, x: (size.w - W * k) / 2, y: (size.h - H * k) / 2 })
  }, [size, animate])

  // overlays (hero / legend on the left, stats on the right) cover the edges, so aim a little right of centre
  const aim = useCallback(
    (x: number, y: number, k?: number) => {
      const kk = k ?? clamp(Math.min(size.w / 900, size.h / 640), fitK, 1.15)
      const wide = size.w > 860
      return { k: kk, x: size.w / 2 + (wide ? 70 : 0) - x * kk, y: size.h / 2 + (wide ? 40 : 60) - y * kk }
    },
    [size, fitK],
  )
  const focusPoint = useCallback((x: number, y: number, k?: number) => animate(aim(x, y, k)), [aim, animate])

  // first layout: open on the constellation the learner is working in (NumPy for newcomers)
  useEffect(() => {
    if (!size.w || inited.current) return
    inited.current = true
    const t = TRACK_BY_ID[next?.track ?? TRACKS[0].id]
    setCam(aim(t.x, t.y))
  }, [size, aim, next])

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      clearTimeout(animationTimer.current)
      setAnimating(false)
      const rect = el.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      setCam((c) => {
        const k = clamp(c.k * Math.exp(-e.deltaY * 0.0016), fitK * 0.8, 2.6)
        return { k, x: mx - ((mx - c.x) * k) / c.k, y: my - ((my - c.y) * k) / c.k }
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [fitK])

  const zoomBy = (f: number) => {
    const k = clamp(cam.k * f, fitK * 0.8, 2.6)
    const mx = size.w / 2
    const my = size.h / 2
    animate({ k, x: mx - ((mx - cam.x) * k) / cam.k, y: my - ((my - cam.y) * k) / cam.k })
  }

  const state = (l: Lesson): 'done' | 'next' | 'open' => (completed[l.id] ? 'done' : next?.id === l.id ? 'next' : 'open')
  const hoverLesson = hover ? LESSONS.find((l) => l.id === hover) : null
  const hoverPos = hover ? SPOTS[hover] : null
  const first = totalDone === 0

  return (
    <div className="map-page">
      <div
        ref={wrap}
        className="map"
        onPointerDown={(e) => {
          if ((e.target as Element).closest('.star')) return
          stopAnimation()
          drag.current = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y, moved: false }
          ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
        }}
        onPointerMove={(e) => {
          const d = drag.current
          if (!d) return
          const dx = e.clientX - d.x
          const dy = e.clientY - d.y
          if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true
          setCam((c) => ({ ...c, x: d.cx + dx, y: d.cy + dy }))
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      >
        <svg width={size.w} height={size.h} className={cam.k < 0.7 ? "far" : ""} role="group" aria-label="Constellation map of all lessons">
          <g className={animating ? 'cam animating' : 'cam'} transform={`translate(${cam.x} ${cam.y}) scale(${cam.k})`}>
            {DUST.map((d, i) => (
              <circle key={i} cx={d.x} cy={d.y} r={d.r} className={d.tw ? 'dust tw' : 'dust'} style={{ opacity: d.o, animationDelay: `${(i % 9) * 0.6}s` }} />
            ))}

            {TRACKS.slice(0, -1).map((t, i) => {
              const a = SPOTS[lessonsOf(t.id).at(-1)!.id]
              const b = SPOTS[lessonsOf(TRACKS[i + 1].id)[0].id]
              const lit = progress[i].pct === 1
              return <path key={t.id} d={`M ${a.x} ${a.y} Q ${(a.x + b.x) / 2} ${(a.y + b.y) / 2 + (i % 2 ? -90 : 90)} ${b.x} ${b.y}`} className={`route ${lit ? 'lit' : ''}`} />
            })}

            {TRACKS.map((t, ti) => {
              const ls = lessonsOf(t.id)
              const p = progress[ti]
              return (
                <g key={t.id} style={{ ['--tc' as string]: t.color }} className="constellation">
                  {ls.slice(0, -1).map((l, i) => {
                    const a = SPOTS[l.id]
                    const b = SPOTS[ls[i + 1].id]
                    const lit = !!completed[l.id] && !!completed[ls[i + 1].id]
                    const half = !!completed[l.id]
                    return <line key={l.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={`link ${lit ? 'lit' : half ? 'half' : ''}`} />
                  })}
                  <g className="track-label" transform={`translate(${t.x} ${t.y - 150})`} onClick={() => focusPoint(t.x, t.y)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && focusPoint(t.x, t.y)} aria-label={`Focus ${t.name}`}>
                    <text textAnchor="middle" className="tl-name">{t.glyph} {t.name}</text>
                    <text textAnchor="middle" y="22" className="tl-count">{p.done}/{p.total}{p.pct === 1 ? ' ★' : ''}</text>
                  </g>
                  {ls.map((l) => {
                    const pt = SPOTS[l.id]
                    const st = state(l)
                    const boss = l.kind === 'boss'
                    return (
                      <g
                        key={l.id}
                        className={`star ${st} ${boss ? 'boss' : ''}`}
                        transform={`translate(${pt.x} ${pt.y})`}
                        role="link"
                        tabIndex={0}
                        aria-label={`${l.title}. Difficulty ${l.order}/${ls.length}, ${KIND_LABEL[l.kind]}, ${l.xp} XP${st === 'done' ? ', completed' : st === 'next' ? ', recommended next' : ''}`}
                        onMouseEnter={() => setHover(l.id)}
                        onMouseLeave={() => setHover((h) => (h === l.id ? null : h))}
                        onFocus={() => setHover(l.id)}
                        onBlur={() => setHover((h) => (h === l.id ? null : h))}
                        onClick={() => !drag.current?.moved && go(lessonPath(l.id))}
                        onKeyDown={(e) => e.key === 'Enter' && go(lessonPath(l.id))}
                      >
                        {st === 'next' && <circle className="pulse" r={boss ? 20 : 15} />}
                        <circle className="halo" r={boss ? 26 : 18} />
                        {boss ? (
                          <>
                            <circle className="ring" r={15} />
                            <path className="core" d="M0 -9 L9 0 L0 9 L-9 0 Z" />
                          </>
                        ) : (
                          <circle className="core" r={st === 'done' ? 9 : 7} />
                        )}
                        {st === 'done' && <path className="tick" d="M-4 0 L-1 3 L4 -3" />}
                        {(mapLabels === 'all' || hover === l.id || (mapLabels === 'focus' && st === 'next')) && (
                          <StarLabel title={l.title.replace(/^Boss: /, '')} up={pt.up} offset={boss ? 30 : 22} />
                        )}
                      </g>
                    )
                  })}
                </g>
              )
            })}
          </g>
        </svg>

        {hoverLesson && hoverPos && (
          <div className="tip" style={{ left: cam.x + hoverPos.x * cam.k, top: cam.y + hoverPos.y * cam.k }} role="tooltip">
            <div className="tip-kind">Difficulty {hoverLesson.order}/{lessonsOf(hoverLesson.track).length} · {KIND_LABEL[hoverLesson.kind]} · {hoverLesson.xp} XP</div>
            <strong>{hoverLesson.title}</strong>
            <div className="dim">{hoverLesson.tagline}</div>
          </div>
        )}
      </div>

      <div className="map-hero glass">
        {first ? (
          <>
            <div className="eyebrow">Welcome, pilot</div>
            <h1>Learn AI engineering by doing</h1>
            <p className="dim">Every star is a hands-on lesson with real Python running in your browser. No setup. Light the first one.</p>
          </>
        ) : next ? (
          <>
            <div className="eyebrow">Next star</div>
            <h1>{next.title}</h1>
            <p className="dim">{next.tagline}</p>
          </>
        ) : (
          <>
            <div className="eyebrow">Sky fully lit</div>
            <h1>Every star is lit ✦</h1>
            <p className="dim">Revisit any lesson, or keep your memory sharp in Review.</p>
          </>
        )}
        {next && <a className="btn primary" href={lessonPath(next.id)}>{first ? 'Light your first star' : `Continue: ${next.title}`} →</a>}
        {first && <p className="hero-feats">72 hands-on lessons · 9 steps per chapter · XP, streaks & bosses</p>}
        <div className="hero-tracks" role="list" aria-label="Jump to a chapter">
          {progress.map(({ track: t, done, total }) => (
            <button
              key={t.id}
              role="listitem"
              className={`hero-track ${next && next.track === t.id ? 'active' : ''}`}
              style={{ ['--tc' as string]: t.color }}
              title={`${t.name}: ${t.blurb}`}
              aria-label={`${t.name}, ${done} of ${total} done. Focus on the map`}
              onClick={() => focusPoint(t.x, t.y)}
            >
              <span className="ht-glyph" aria-hidden>{t.glyph}</span>
              <span className="ht-count">{done}/{total}</span>
            </button>
          ))}
        </div>
        {next && <Difficulty lesson={next} />}
        <div className="hero-tip"><span aria-hidden>💡</span> {tipOfTheDay(today)}</div>
      </div>

      <div className="map-stats glass">
        <div className="stat-row">
          <div title={`${lp.into} / ${lp.need} XP to level ${lp.level + 1}`}>
            <div className="stat-num">Lv {lp.level}</div>
            <div className="meter"><i style={{ width: `${lp.pct * 100}%` }} /></div>
            <div className="stat-sub">{xp} XP</div>
          </div>
          <div>
            <div className="stat-num">{streak}<span aria-hidden>🔥</span></div>
            <div className="stat-sub">day streak</div>
          </div>
          <div>
            <div className="stat-num">{totalDone}<span className="dim">/{LESSONS.length}</span></div>
            <div className="stat-sub">stars lit</div>
          </div>
        </div>
        <div className="quest">
          <div className="quest-head">
            <span>🎯 Daily quest</span>
            <span className="dim">+{QUEST_BONUS} XP</span>
          </div>
          <div className="quest-text">Complete {QUEST_TARGET} lessons today</div>
          <div className="meter quest-meter"><i style={{ width: `${Math.min(1, questDone / QUEST_TARGET) * 100}%` }} /></div>
          <div className="stat-sub">{quest.date === today && quest.claimed ? 'Claimed ✓' : `${Math.min(questDone, QUEST_TARGET)}/${QUEST_TARGET}`}</div>
        </div>
      </div>

      <div className="map-legend glass" role="list" aria-label="Tracks">
        {progress.map(({ track: t, done, total }) => (
          <button key={t.id} role="listitem" className="legend-item" style={{ ['--tc' as string]: t.color }} onClick={() => focusPoint(t.x, t.y)} title={t.blurb}>
            <span className="legend-glyph" aria-hidden>{t.glyph}</span>
            <span className="legend-name">{t.name}</span>
            <span className="legend-bar"><i style={{ width: `${(done / total) * 100}%` }} /></span>
            <span className="legend-count">{done}/{total}</span>
          </button>
        ))}
      </div>

      <div className="map-controls glass">
        <button className="icon-btn" onClick={() => zoomBy(1.25)} aria-label="Zoom in">＋</button>
        <button className="icon-btn" onClick={() => zoomBy(0.8)} aria-label="Zoom out">－</button>
        <button className="icon-btn" onClick={fit} aria-label="Show the whole sky" title="Fit">⤢</button>
        {next && <button className="icon-btn" onClick={() => { const p = SPOTS[next.id]; focusPoint(p.x, p.y, 1.3) }} aria-label="Center on next star" title="Next star">◎</button>}
        <button
          className="icon-btn label-mode"
          onClick={() => setSetting('mapLabels', mapLabels === 'all' ? 'focus' : mapLabels === 'focus' ? 'off' : 'all')}
          aria-label={`Star titles: ${LABEL_MODE[mapLabels]}. Click to change`}
          title={`Star titles: ${LABEL_MODE[mapLabels]}`}
        >
          <span aria-hidden>Aa</span>
          <small aria-hidden>{LABEL_MODE[mapLabels]}</small>
        </button>
      </div>
    </div>
  )
}
