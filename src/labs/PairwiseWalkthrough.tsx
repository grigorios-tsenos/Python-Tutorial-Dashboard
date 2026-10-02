import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'

const left = [[0, 0], [3, 4]]
const right = [[0, 0], [0, 4], [3, 0]]
const stages = ['Pick two rows', 'Subtract coordinates', 'Square each difference', 'Sum the coordinates']

export function pairwiseFrame(step: number) {
  const pair = Math.floor(step / 4)
  const i = Math.floor(pair / right.length)
  const j = pair % right.length
  const differences = left[i].map((value, k) => value - right[j][k])
  const squares = differences.map(value => value ** 2)
  return { i, j, stage: step % 4, differences, squares, distance: squares.reduce((a, b) => a + b, 0) }
}

export function PairwiseWalkthrough({ showCode = false }: { showCode?: boolean }) {
  const reduceMotion = useStore(s => s.settings.reduceMotion)
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const { i, j, stage, differences, squares, distance } = pairwiseFrame(step)
  useEffect(() => {
    if (!playing) return
    if (step === 23) { setPlaying(false); return }
    const timer = setTimeout(() => setStep(step + 1), 1800)
    return () => clearTimeout(timer)
  }, [playing, step])
  const move = (next: number) => { setPlaying(false); setStep(next) }
  return (
    <section className={`lab pairwise ${reduceMotion ? 'motion-reduced' : ''}`} aria-label="Animated pairwise distance walkthrough">
      <div className="lab-title">See it happen</div>
      <h2>What’s the point?</h2>
      <p>Imagine these rows are map coordinates. For each left point, compare all three right points to find the closest one. A smaller distance means a closer neighbour.</p>
      <div className="pw-inputs">
        {[left, right].map((rows, side) => <div key={side}>
          <strong>{side === 0 ? 'left (2, 2)' : 'right (3, 2)'}</strong>
          {rows.map((row, index) => <div key={index} className={`pw-row ${index === (side === 0 ? i : j) ? 'selected' : ''}`}>
            <span>{side === 0 ? 'L' : 'R'}{index}</span>{row.map((value, k) => <span className="pw-value" key={k}>{value}</span>)}
          </div>)}
        </div>)}
      </div>
      <p className="wt-example">Teaching example · this demonstrates the calculation and does not execute your editor code.</p>
      <details>
        <summary>How do the array shapes fit together?</summary>
        <p>Adding an axis of length 1 leaves the values unchanged. The left shape becomes (2, 1, 2); the right becomes (1, 3, 2).</p>
        <p>NumPy reuses each left row across three columns, and each right row across two rows. The difference array has shape (2, 3, 2): two left rows × three right rows × two coordinate differences.</p>
        {showCode && <pre><code>{'left[:, None, :]  # (2, 1, 2)\nright[None, :, :] # (1, 3, 2)'}</code></pre>}
      </details>
      <div className="pw-controls">
        <button className="btn small" onClick={() => { if (step === 23) setStep(0); setPlaying(!playing) }}>{playing ? 'Pause' : '▶ Play'}</button>
        <button className="btn small" disabled={step === 0} onClick={() => move(step - 1)}>← Back</button>
        <button className="btn small" disabled={step === 23} onClick={() => move(step + 1)}>Next →</button>
        <button className="btn small" onClick={() => move(0)}>Restart</button>
      </div>
      <div aria-live={playing ? 'off' : 'polite'}>
        <p><strong>{step + 1}/24 · {stages[stage]}</strong> · L{i} with R{j}</p>
        <div className="pw-calculation" key={step}>
          {stage === 0 && <><span className="pw-math">[{left[i].join(', ')}] ↔ [{right[j].join(', ')}]</span><p>Match x with x and y with y.</p></>}
          {stage === 1 && <><span className="pw-math">[{left[i].join(', ')}] − [{right[j].join(', ')}] → [{differences.join(', ')}]</span><p>One difference for each coordinate.</p></>}
          {stage === 2 && <><span className="pw-math">[{differences.map(v => `(${v})²`).join(', ')}] → [{squares.join(', ')}]</span><p>Squaring makes negative differences positive.</p></>}
          {stage === 3 && <><span className="pw-math">{squares.join(' + ')} → {distance} → table row {i}, column {j}</span><p>Combine the two coordinates into one squared distance. The feature axis disappears: (2, 3, 2) → (2, 3).</p></>}
        </div>
      </div>
      <table className="pw-table">
        <caption>Result (2, 3) · click a cell to follow its pair</caption>
        <thead><tr><th scope="col">left / right</th>{right.map((_, col) => <th scope="col" key={col}>R{col}</th>)}</tr></thead>
        <tbody>{left.map((row, r) => <tr key={r}><th scope="row">L{r}</th>{right.map((other, c) => {
          const target = (r * right.length + c) * 4
          const value = row.reduce((sum, v, k) => sum + (v - other[k]) ** 2, 0)
          return <td key={c}><button className={r === i && c === j ? 'selected' : ''} aria-label={`Compare L${r} with R${c}`} aria-pressed={r === i && c === j} onClick={() => move(target)}>{step >= target + 3 ? value : '·'}</button></td>
        })}</tr>)}</tbody>
      </table>
      {step === 23 && <p>L1’s closest neighbour is R1: its squared distance is 9, smaller than 25 and 16. The actual distance is √9 = 3. Taking square roots would keep the same ranking.</p>}
      {showCode ? <details className="wt-code"><summary>Connect this example to code</summary><pre><code>{'differences = left[:, None, :] - right[None, :, :]\nnp.sum(differences ** 2, axis=-1)'}</code></pre></details> : <p className="wt-locked">Implementation code stays hidden until you reveal the solution.</p>}
      {step === 23 && <div className="wt-reflect"><strong>Try explaining it back</strong><p>Why does the final table have six cells rather than twelve?</p><details><summary>Check your reasoning</summary><p>There are two left points and three right points: six pairs. The two coordinate differences in each pair are summed to make one distance.</p></details></div>}
      <p className="dim">This animation visits pairs slowly to explain them. NumPy computes the whole table together; the original arrays stay unchanged.</p>
    </section>
  )
}
