import { useEffect, useMemo, useState } from 'react'

interface Step {
  node: string
  update: unknown
  state: Record<string, unknown>
}
interface Data {
  nodes: string[]
  edges: { from: string; to: string; conditional: boolean }[]
  steps: Step[]
  interrupted: boolean
  waiting: string[]
}

const START = '__start__'
const END = '__end__'
const NODE_W = 112
const NODE_H = 38
const COL = 170
const ROW = 62

function layout(data: Data) {
  const all = [START, ...data.nodes, END]
  const depth: Record<string, number> = { [START]: 0 }
  // BFS depth from START; edges back to already-placed nodes are loops and don't move anything
  const queue = [START]
  while (queue.length) {
    const cur = queue.shift() as string
    for (const e of data.edges) {
      if (e.from === cur && depth[e.to] === undefined && e.to !== END) {
        depth[e.to] = depth[cur] + 1
        queue.push(e.to)
      }
    }
  }
  const maxDepth = Math.max(0, ...Object.values(depth))
  depth[END] = maxDepth + 1
  for (const n of data.nodes) if (depth[n] === undefined) depth[n] = 1
  const layers: Record<number, string[]> = {}
  for (const n of all) (layers[depth[n]] ??= []).push(n)
  const tallest = Math.max(...Object.values(layers).map((l) => l.length))
  const pos: Record<string, { x: number; y: number }> = {}
  for (const [d, names] of Object.entries(layers)) {
    names.forEach((n, i) => {
      pos[n] = { x: 20 + Number(d) * COL + NODE_W / 2, y: 40 + (i + (tallest - names.length) / 2) * ROW + NODE_H / 2 }
    })
  }
  const width = 40 + (maxDepth + 2) * COL
  const height = 70 + tallest * ROW
  return { pos, width, height }
}

function edgePath(a: { x: number; y: number }, b: { x: number; y: number }, back: boolean) {
  if (back) {
    const top = Math.min(a.y, b.y) - 46
    return `M ${a.x} ${a.y - NODE_H / 2} C ${a.x + 10} ${top}, ${b.x - 10} ${top}, ${b.x} ${b.y - NODE_H / 2}`
  }
  const x1 = a.x + NODE_W / 2
  const x2 = b.x - NODE_W / 2
  const mx = (x1 + x2) / 2
  return `M ${x1} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${x2} ${b.y}`
}

const label = (n: string) => (n === START ? 'START' : n === END ? 'END' : n)

export function GraphTrace({ data }: { data: Data }) {
  const { pos, width, height } = useMemo(() => layout(data), [data])
  const total = data.steps.length
  const [i, setI] = useState(total)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    setI(total)
    setPlaying(false)
  }, [data, total])

  useEffect(() => {
    if (!playing) return
    if (i >= total) {
      setPlaying(false)
      return
    }
    const t = setTimeout(() => setI((x) => x + 1), 700)
    return () => clearTimeout(t)
  }, [playing, i, total])

  const visited = new Set(data.steps.slice(0, i).map((s) => s.node))
  const current = i > 0 ? data.steps[i - 1].node : START
  const prev = i > 1 ? data.steps[i - 2].node : START
  const finished = i >= total && !data.interrupted
  const active = finished ? END : current
  const taken = i > 0 ? `${prev}>${current}` : ''
  const step = i > 0 ? data.steps[i - 1] : null

  return (
    <div className="lab">
      <div className="lab-title">Graph Lab <span className="lab-sub">{total} step{total === 1 ? '' : 's'}</span></div>
      <div className="gt-scroll">
        <svg width={width} height={height} className="gt-svg" role="img" aria-label="Graph execution trace">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
            </marker>
          </defs>
          {data.edges.map((e, k) => {
            const a = pos[e.from]
            const b = pos[e.to]
            if (!a || !b) return null
            const back = b.x <= a.x
            const hot = taken === `${e.from}>${e.to}`
            return (
              <path key={k} d={edgePath(a, b, back)} className={`gt-edge ${e.conditional ? 'cond' : ''} ${hot ? 'hot' : ''}`} markerEnd="url(#arrow)" />
            )
          })}
          {[START, ...data.nodes, END].map((n) => {
            const p = pos[n]
            const special = n === START || n === END
            const cls = ['gt-node', special ? 'special' : '', visited.has(n) ? 'visited' : '', active === n ? 'active' : '', data.waiting.includes(n) && i >= total ? 'waiting' : ''].join(' ')
            return (
              <g key={n} className={cls} transform={`translate(${p.x - NODE_W / 2}, ${p.y - NODE_H / 2})`}>
                <rect width={NODE_W} height={NODE_H} rx={special ? NODE_H / 2 : 9} />
                <text x={NODE_W / 2} y={NODE_H / 2 + 4.5} textAnchor="middle">{label(n)}</text>
              </g>
            )
          })}
        </svg>
      </div>
      <div className="gt-controls">
        <button className="btn small" onClick={() => { setPlaying(false); setI(0) }} aria-label="Restart">⏮</button>
        <button className="btn small" onClick={() => { setPlaying(false); setI((x) => Math.max(0, x - 1)) }} aria-label="Previous step">◀</button>
        <button className="btn small primary" onClick={() => { if (i >= total) setI(0); setPlaying((p) => !p) }}>{playing ? 'Pause' : i >= total ? 'Replay' : 'Play'}</button>
        <button className="btn small" onClick={() => { setPlaying(false); setI((x) => Math.min(total, x + 1)) }} aria-label="Next step">▶</button>
        <input type="range" min={0} max={total} value={i} onChange={(e) => { setPlaying(false); setI(Number(e.target.value)) }} aria-label="Step" />
        <span className="dim">{i}/{total}</span>
      </div>
      {data.interrupted && i >= total && <div className="gt-pause">⏸ Paused before <code>{data.waiting.join(', ')}</code>: waiting for a human to resume.</div>}
      {step ? (
        <div className="gt-state">
          <div><strong>{step.node}</strong> returned</div>
          <pre>{JSON.stringify(step.update, null, 2)}</pre>
          <div className="dim">state after this step</div>
          <pre>{JSON.stringify(step.state, null, 2)}</pre>
        </div>
      ) : (
        <div className="dim gt-state">Press Play or ▶ to step through the run.</div>
      )}
    </div>
  )
}
