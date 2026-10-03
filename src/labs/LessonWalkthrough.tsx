import { useEffect, useRef, useState } from 'react'
import { WALKTHROUGHS, type Walkthrough, type WalkthroughStep } from '../content/walkthroughs'
import { WARMUPS, type Warmup } from '../content/warmups'
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

export function LessonWalkthrough({ lessonId, solutionRevealed }: { lessonId: string; solutionRevealed: boolean }) {
  const data = WALKTHROUGHS[lessonId]
  return <>
    {WARMUPS[lessonId] && <WarmupView data={WARMUPS[lessonId]} />}
    {lessonId === 'np-pairwise' ? <PairwiseWalkthrough showCode={solutionRevealed} /> : data ? <WalkthroughPlayer data={data} showCode={solutionRevealed} /> : null}
  </>
}

function WarmupView({ data }: { data: Warmup }) {
  const [open, setOpen] = useState(true)
  return <details className="lesson-warmup" open={open} onToggle={e => setOpen(e.currentTarget.open)}>
    <summary>Start smaller · connect the basics first</summary>
    {data.review.length > 0 && <p className="wt-review">Earlier ideas to revisit: {data.review.map((id, i) => <span key={id}>{i > 0 && ' · '}<a href={lessonPath(id)}>{LESSON_BY_ID[id].title}</a></span>)}</p>}
    <WalkthroughPlayer data={data} showCode={false} onContinue={() => setOpen(false)} />
  </details>
}

function WalkthroughPlayer({ data, showCode, onContinue }: { data: Walkthrough; showCode: boolean; onContinue?: () => void }) {
  const [index, setIndex] = useState(0)
  const [choices, setChoices] = useState<Record<number, number>>({})
  const [playing, setPlaying] = useState(false)
  const [delay, setDelay] = useState(3000)
  const reduceMotion = useStore(s => s.settings.reduceMotion)
  const scene = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(660)
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(240, entry.contentRect.width)))
    if (scene.current) observer.observe(scene.current)
    return () => observer.disconnect()
  }, [])
  const last = data.steps.length - 1
  const current = data.steps[index]
  const { areas, cells, height } = layoutWalkthrough(current, width)
  useEffect(() => {
    if (!playing) return
    if (current.check && choices[index] !== current.check.answer) { setPlaying(false); return }
    if (index === last) { setPlaying(false); return }
    const timer = setTimeout(() => setIndex(i => i + 1), delay)
    return () => clearTimeout(timer)
  }, [playing, index, last, delay, current.check, choices])
  const move = (next: number) => { setPlaying(false); setIndex(next) }
  return (
    <section className={`lab ${onContinue ? 'foundation-player' : 'walkthrough'} ${reduceMotion ? 'motion-reduced' : ''}`} aria-label={onContinue ? 'Prerequisite warm-up' : 'Visual lesson walkthrough'}>
      <div className="lab-title">{onContinue ? 'One connection at a time' : 'See it happen'}</div>
      <h2>{onContinue ? 'Connect the dots' : 'What’s the point?'}</h2>
      <p>{data.purpose}</p>
      <p className="wt-example">Small teaching example · follow the same tiles as they move or change. This demonstrates the concept; it does not execute your editor code.</p>
      <div className="wt-controls">
        <button className="btn small primary" onClick={() => { if (index === last) setIndex(0); setPlaying(p => !p) }}>{playing ? 'Pause' : index === last ? 'Replay' : '▶ Play'}</button>
        <button className="btn small" disabled={index === 0} onClick={() => move(index - 1)}>← Back</button>
        <button className="btn small" disabled={index === last} onClick={() => move(index + 1)}>Next →</button>
        <button className="btn small" onClick={() => { setChoices({}); move(0) }}>Restart</button>
        <label>Speed <select value={delay} onChange={e => setDelay(Number(e.target.value))}><option value={5000}>Slow</option><option value={3000}>Normal</option><option value={1500}>Fast</option></select></label>
      </div>
      <label className="wt-scrubber">Step {index + 1} of {data.steps.length}<input aria-label="Walkthrough step" type="range" min={0} max={last} value={index} onChange={e => move(Number(e.target.value))} /></label>
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
      {showCode && current.code ? <details className="wt-code" key={index}><summary>Connect this step to code</summary><pre><code>{current.code}</code></pre></details> : !onContinue && <p className="wt-locked">Implementation code stays hidden until you reveal the solution.</p>}
      {index === last && !onContinue && <div className="wt-reflect"><strong>Try explaining it back</strong><p>{data.question}</p><details><summary>Check your reasoning</summary><p>{data.answer}</p></details></div>}
      {index === last && onContinue && <button className="btn primary" onClick={onContinue}>Continue to the full example →</button>}
    </section>
  )
}
