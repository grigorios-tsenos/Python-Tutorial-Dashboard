import { useEffect, useRef, useState } from 'react'
import { WALKTHROUGHS, type WalkthroughStep } from '../content/walkthroughs'
import { WARMUPS } from '../content/warmups'
import { LESSON_BY_ID } from '../content'
import { lessonPath } from '../lib/router'
import { useStore } from '../store/useStore'
import { PairwiseWalkthrough } from './PairwiseWalkthrough'

export function layoutWalkthrough(step: WalkthroughStep, width = 660) {
  const stacked = width < 440
  const groupWidth = stacked ? width : width / step.areas.length
  let nextY = 0
  const areas = step.areas.map((area, group) => {
    const height = 54 + Math.max(1, area.rows.length) * 56
    const result = { ...area, x: stacked ? 0 : group * groupWidth, y: stacked ? nextY : 0, width: groupWidth, height }
    nextY += height + 12
    return result
  })
  const cells = areas.flatMap(area => {
    const columns = Math.max(1, ...area.rows.map(row => row.length))
    const cellWidth = (area.width - 24) / columns
    return area.rows.flatMap((row, r) => row.map((cell, c) => ({
      ...cell, x: area.x + 12 + c * cellWidth, y: area.y + 44 + r * 56, width: cellWidth - 6,
    })))
  })
  return { areas, cells, height: Math.max(...areas.map(area => area.y + area.height)) }
}

// note: teaching tiles use at most two lines; add wrapping if future examples need longer labels.
function CellText({ text, width }: { text: string; width: number }) {
  const chars = Math.max(5, Math.floor((width - 12) / 7.4))
  if (text.length <= chars) return <text x={width / 2} y={29} textAnchor="middle">{text}</text>
  const split = text.lastIndexOf(' ', chars)
  const at = split > 0 ? split : chars
  return <text x={width / 2} y={20} textAnchor="middle"><tspan x={width / 2}>{text.slice(0, at)}</tspan><tspan x={width / 2} dy={16}>{text.slice(at).trim()}</tspan></text>
}

/**
 * One guided intro per lesson: a warm-up chapter and a core-demo chapter in a single player,
 * with a chapter bar, one set of controls and a reflection at the end. It collapses to one
 * line once the lesson is completed, when the learner hides it, or when their learning style
 * is "straight to code"; the choice is remembered per lesson.
 */
export function LessonWalkthrough({ lessonId, solutionRevealed }: { lessonId: string; solutionRevealed: boolean }) {
  const completed = useStore(s => !!s.completed[lessonId])
  const pref = useStore(s => s.intro[lessonId])
  const introStyle = useStore(s => s.settings.introStyle)
  const warmup = WARMUPS[lessonId]
  const demo = WALKTHROUGHS[lessonId]
  const pairwise = lessonId === 'np-pairwise'
  if (!warmup && !demo && !pairwise) return null
  const open = pref ? pref === 'open' : !completed && introStyle !== 'code'
  const stepCount = (warmup?.steps.length ?? 0) + (demo?.steps.length ?? 0)
  if (!open) {
    return (
      <section className="lab lesson-intro collapsed" aria-label="Guided intro, collapsed">
        <div className="intro-collapsed-row">
          <span><strong>Guided intro</strong> <span className="dim">· warm-up and demo{stepCount ? ` · ${stepCount} steps` : ''}{completed ? ' · lesson completed' : ''}</span></span>
          <button className="btn small" onClick={() => useStore.getState().setIntroPref(lessonId, 'open')}>Show the intro</button>
        </div>
      </section>
    )
  }
  return <IntroPlayer key={lessonId} lessonId={lessonId} solutionRevealed={solutionRevealed} />
}

function IntroPlayer({ lessonId, solutionRevealed }: { lessonId: string; solutionRevealed: boolean }) {
  const warmup = WARMUPS[lessonId]
  const demo = WALKTHROUGHS[lessonId]
  const pairwise = lessonId === 'np-pairwise'
  const introStyle = useStore(s => s.settings.introStyle)
  const delay = useStore(s => s.settings.demoSpeed)
  const reduceMotion = useStore(s => s.settings.reduceMotion)

  const warmSteps = warmup?.steps ?? []
  const demoSteps = demo?.steps ?? []
  const steps = [...warmSteps, ...demoSteps]
  const demoStart = warmSteps.length
  const hasDemo = demoSteps.length > 0 || pairwise
  const last = steps.length - 1

  const [index, setIndex] = useState(introStyle === 'quick' && demoSteps.length > 0 ? demoStart : 0)
  // np-pairwise's demo is a bespoke animation, shown in place of the generic scene
  const [pairDemo, setPairDemo] = useState(pairwise && introStyle === 'quick')
  const [choices, setChoices] = useState<Record<number, number>>({})
  const [playing, setPlaying] = useState(false)
  const scene = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(660)
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(240, entry.contentRect.width)))
    if (scene.current) observer.observe(scene.current)
    return () => observer.disconnect()
  }, [pairDemo])

  const current = steps[index]
  const inWarmup = !pairDemo && index < demoStart
  const phase = inWarmup ? warmup : demo
  useEffect(() => {
    if (!playing || pairDemo) return
    if (current.check && choices[index] !== current.check.answer) { setPlaying(false); return }
    if (index === last) {
      setPlaying(false)
      if (pairwise) setPairDemo(true)
      return
    }
    const timer = setTimeout(() => setIndex(i => i + 1), delay)
    return () => clearTimeout(timer)
  }, [playing, pairDemo, index, last, delay, current?.check, choices, pairwise])
  const move = (next: number) => { setPlaying(false); setIndex(next) }
  const toChapter = (chapter: 'warmup' | 'demo') => {
    setPlaying(false)
    if (chapter === 'warmup') { setPairDemo(false); setIndex(0) }
    else if (pairwise) setPairDemo(true)
    else setIndex(demoStart)
  }
  const skip = () => useStore.getState().setIntroPref(lessonId, 'collapsed')

  const { areas, cells, height } = pairDemo ? { areas: [], cells: [], height: 0 } : layoutWalkthrough(current, width)
  const phaseIndex = inWarmup ? index : index - demoStart
  const phaseCount = inWarmup ? warmSteps.length : demoSteps.length

  return (
    <section className={`lab lesson-intro ${reduceMotion ? 'motion-reduced' : ''}`} aria-label="Guided intro: warm-up and demo">
      <div className="intro-head">
        <div className="lab-title">Guided intro <span className="lab-sub">worked example · separate from your editor code</span></div>
        <button className="btn small ghost" onClick={skip}>Skip to the exercise ↓</button>
      </div>
      {hasDemo && (
        <div className="intro-chapters" role="tablist" aria-label="Intro chapters">
          <button role="tab" aria-selected={inWarmup} className={`intro-chapter ${inWarmup ? 'active' : ''}`} onClick={() => toChapter('warmup')}>
            Warm-up <span className="dim">· {warmSteps.length} steps</span>
          </button>
          <button role="tab" aria-selected={!inWarmup} className={`intro-chapter ${!inWarmup ? 'active' : ''}`} onClick={() => toChapter('demo')}>
            Core demo <span className="dim">· {pairwise ? 'animated' : `${demoSteps.length} steps`}</span>
          </button>
        </div>
      )}
      {pairDemo ? (
        <PairwiseWalkthrough showCode={solutionRevealed} />
      ) : (
        <>
          <h2>What’s the point?</h2>
          <p>{phase?.purpose}</p>
          {inWarmup && warmup.review.length > 0 && (
            <p className="wt-review">Earlier ideas to revisit: {warmup.review.map((id, i) => <span key={id}>{i > 0 && ' · '}<a href={lessonPath(id)}>{LESSON_BY_ID[id].title}</a></span>)}</p>
          )}
          <div className="wt-controls">
            <button className="btn small primary" onClick={() => { if (index === last && !pairwise) setIndex(0); setPlaying(p => !p) }}>{playing ? 'Pause' : index === last && !pairwise ? 'Replay' : '▶ Play'}</button>
            <button className="btn small" disabled={index === 0} onClick={() => move(index - 1)}>← Back</button>
            <button className="btn small" disabled={index === last && !pairwise} onClick={() => (index === last && pairwise ? toChapter('demo') : move(index + 1))}>Next →</button>
            <button className="btn small" onClick={() => { setChoices({}); move(0) }}>Restart</button>
            <label>Speed <select value={delay} onChange={e => useStore.getState().setSetting('demoSpeed', Number(e.target.value))}><option value={5000}>Slow</option><option value={3000}>Normal</option><option value={1500}>Fast</option></select></label>
          </div>
          <label className="wt-scrubber">{inWarmup ? 'Warm-up' : 'Demo'} step {phaseIndex + 1} of {phaseCount}<input aria-label="Intro step" type="range" min={0} max={last} value={index} onChange={e => move(Number(e.target.value))} /></label>
          <div className="wt-description" aria-live={playing ? 'off' : 'polite'}>
            <h3>{current.title}</h3>
            <p>{current.explanation}</p>
          </div>
          <div className="wt-scene" ref={scene}>
            <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={current.areas.map(area => `${area.label}: ${area.rows.map(row => row.map(cell => cell.text).join(', ')).join('; ') || 'empty'}`).join('. ')}>
              {areas.map((area, group) => <g key={group} className="wt-area"><rect x={area.x + 4} y={area.y + 34} width={area.width - 8} height={area.height - 40} rx={10} /><text x={area.x + area.width / 2} y={area.y + 22} textAnchor="middle">{area.label}</text></g>)}
              {cells.map(cell => <g key={cell.id} data-cell-id={cell.id} className="wt-cell" style={{ transform: `translate(${cell.x}px, ${cell.y}px)` }}>
                <rect width={cell.width} height={48} rx={7} />
                <CellText text={cell.text} width={cell.width} />
              </g>)}
            </svg>
          </div>
          {current.nesting && <div className="wt-nesting"><strong>Brackets group the values</strong><pre>{current.nesting}</pre></div>}
          {current.check && <fieldset className="wt-check"><legend>Pause and predict</legend><p>{current.check.question}</p>
            {current.check.options.map((option, choice) => <button key={choice} className="btn small" aria-pressed={choices[index] === choice} onClick={() => { setPlaying(false); setChoices(previous => ({ ...previous, [index]: choice })) }}>{option}</button>)}
            {choices[index] !== undefined && <p role="status">{choices[index] === current.check.answer ? 'Yes. ' : `Try again. The matching answer is ${current.check.options[current.check.answer]}. `}{current.check.explanation}</p>}
          </fieldset>}
          <details className="wt-transcript"><summary>Read this step as text</summary>{current.areas.map((area, group) => <div key={group}><strong>{area.label}</strong><ul>{area.rows.length ? area.rows.map((row, r) => <li key={r}>{row.map(cell => cell.text).join(' · ')}</li>) : <li>Empty</li>}</ul></div>)}</details>
          {solutionRevealed && current.code ? <details className="wt-code" key={index}><summary>Connect this step to code</summary><pre><code>{current.code}</code></pre></details> : !inWarmup && <p className="wt-locked">Implementation code stays hidden until you reveal the solution.</p>}
          {index === last && pairwise && <button className="btn primary" onClick={() => toChapter('demo')}>Continue to the core demo →</button>}
          {index === last && !pairwise && demo && <div className="wt-reflect"><strong>Try explaining it back</strong><p>{demo.question}</p><details><summary>Check your reasoning</summary><p>{demo.answer}</p></details><button className="btn primary intro-done" onClick={skip}>Done · take me to the exercise ↓</button></div>}
        </>
      )}
    </section>
  )
}
