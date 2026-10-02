import { useState } from 'react'

interface RunRow {
  id: string
  name: string
  status: string
  experiment: string
  params: Record<string, string>
  metrics: Record<string, number>
  history: Record<string, [number, number][]>
  tags: Record<string, string>
}
interface Data {
  runs: RunRow[]
  registry: Record<string, { version: string; run_id: string; aliases: string[] }[]>
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(3).replace(/0+$/, '').replace(/\.$/, ''))

function Spark({ points }: { points: [number, number][] }) {
  if (points.length < 2) return null
  const ys = points.map((p) => p[1])
  const lo = Math.min(...ys)
  const hi = Math.max(...ys)
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${(i / (points.length - 1)) * 80},${22 - ((p[1] - lo) / (hi - lo || 1)) * 20}`).join(' ')
  return (
    <svg width="84" height="24" viewBox="-2 -1 86 26" aria-hidden>
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth="1.5" />
    </svg>
  )
}

export function MlflowRuns({ data }: { data: Data }) {
  const [open, setOpen] = useState<string | null>(null)
  const paramKeys = [...new Set(data.runs.flatMap((r) => Object.keys(r.params)))]
  const metricKeys = [...new Set(data.runs.flatMap((r) => Object.keys(r.metrics)))]
  const range = (k: string) => {
    const v = data.runs.map((r) => r.metrics[k]).filter((x) => x !== undefined)
    return { lo: Math.min(...v), hi: Math.max(...v) }
  }
  const best: Record<string, string> = {}
  for (const k of metricKeys) {
    const rows = data.runs.filter((r) => r.metrics[k] !== undefined)
    if (rows.length > 1) best[k] = rows.reduce((a, b) => (b.metrics[k] > a.metrics[k] ? b : a)).id
  }
  const models = Object.entries(data.registry)
  return (
    <div className="lab">
      <div className="lab-title">MLflow Lab <span className="lab-sub">{data.runs.length} run{data.runs.length === 1 ? '' : 's'}</span></div>
      {data.runs.length > 0 && (
        <div className="ml-scroll">
          <table className="ml-table">
            <thead>
              <tr>
                <th>Run</th>
                {paramKeys.map((k) => (
                  <th key={k} className="ml-param">{k}</th>
                ))}
                {metricKeys.map((k) => (
                  <th key={k} className="ml-metric">{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.runs.map((r) => (
                <tr key={r.id} onClick={() => setOpen(open === r.id ? null : r.id)} className={open === r.id ? 'open' : ''}>
                  <td>
                    <span className={`ml-status ${r.status.toLowerCase()}`} title={r.status} />
                    {r.name}
                  </td>
                  {paramKeys.map((k) => (
                    <td key={k} className="ml-param">{r.params[k] ?? '–'}</td>
                  ))}
                  {metricKeys.map((k) => {
                    const v = r.metrics[k]
                    const { lo, hi } = range(k)
                    const pct = v === undefined ? 0 : hi === lo ? 100 : 12 + ((v - lo) / (hi - lo)) * 88
                    return (
                      <td key={k} className="ml-metric">
                        {v === undefined ? '–' : (
                          <>
                            <span className="ml-bar" style={{ width: `${pct}%` }} />
                            <span className="ml-val">{best[k] === r.id && '★ '}{fmt(v)}</span>
                          </>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {open && (
        <div className="ml-detail">
          {Object.entries(data.runs.find((r) => r.id === open)?.history ?? {}).map(([k, pts]) => (
            <div key={k}>
              <code>{k}</code> {pts.length > 1 ? <Spark points={pts} /> : <span className="dim">single value</span>}
            </div>
          ))}
          <div className="dim">run id <code>{open.slice(0, 12)}…</code></div>
        </div>
      )}
      {models.length > 0 && (
        <div className="ml-registry">
          <div className="lab-sub">Model Registry</div>
          {models.map(([name, versions]) => (
            <div key={name} className="ml-model">
              <strong>{name}</strong>
              {versions.map((v) => (
                <span key={v.version} className="ml-version">
                  v{v.version}
                  {v.aliases.map((a) => (
                    <em key={a} className="ml-alias">@{a}</em>
                  ))}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}
      {data.runs.length > 0 && <p className="dim">Click a row for metric history. ★ marks the best value per metric.</p>}
    </div>
  )
}
