interface Data {
  a_shape: number[]
  b_shape: number[]
  out_shape?: number[]
  error?: string
  op?: string
  a?: string[][] | null
  b?: string[][] | null
  out?: string[][] | null
}

function Grid({ cells, label, accent }: { cells?: string[][] | null; label: string; accent?: boolean }) {
  if (!cells) return <div className="bc-grid bc-empty">{label}: too many dimensions to draw</div>
  const clipped = cells.slice(0, 8).map((r) => r.slice(0, 8))
  return (
    <div className={`bc-grid ${accent ? 'bc-out' : ''}`}>
      <div className="bc-label">{label}</div>
      <table>
        <tbody>
          {clipped.map((row, i) => (
            <tr key={i}>
              {row.map((c, j) => (
                <td key={j}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ShapeRow({ name, shape, out }: { name: string; shape: number[]; out: number[] }) {
  const pad = out.length - shape.length
  return (
    <div className="bc-shaperow">
      <span className="bc-name">{name}</span>
      {out.map((o, i) => {
        const missing = i < pad
        const v = missing ? 1 : shape[i - pad]
        const stretched = v === 1 && o > 1
        return (
          <span key={i} className={`bc-chip ${missing ? 'missing' : ''} ${stretched ? 'stretched' : ''}`} title={missing ? 'missing axis, treated as 1' : stretched ? `stretched 1 → ${o}` : 'matches'}>
            {missing ? '·' : v}
          </span>
        )
      })}
    </div>
  )
}

export function BroadcastGrid({ data }: { data: Data }) {
  const out = data.out_shape ?? Array.from({ length: Math.max(data.a_shape.length, data.b_shape.length) }, () => 0)
  return (
    <div className="lab">
      <div className="lab-title">Broadcast Lab</div>
      {data.error ? (
        <div className="bc-error">
          <strong>Shapes {JSON.stringify(data.a_shape)} and {JSON.stringify(data.b_shape)} can't broadcast.</strong>
          <p>NumPy: <code>{data.error}</code></p>
          <p>Aligned from the right, one pair of dimensions differs and neither is 1.</p>
        </div>
      ) : (
        <>
          <div className="bc-shapes" aria-label="shape alignment">
            <ShapeRow name="A" shape={data.a_shape} out={out} />
            <ShapeRow name="B" shape={data.b_shape} out={out} />
            <div className="bc-rule" />
            <div className="bc-shaperow">
              <span className="bc-name">A {data.op ?? '+'} B</span>
              {out.map((o, i) => (
                <span key={i} className="bc-chip result">{o}</span>
              ))}
            </div>
            <p className="bc-legend"><span className="bc-chip stretched">1</span> stretched &nbsp; <span className="bc-chip missing">·</span> missing axis (counts as 1)</p>
          </div>
          <div className="bc-grids">
            <Grid cells={data.a} label={`A ${JSON.stringify(data.a_shape)}`} />
            <span className="bc-op">{data.op ?? '+'}</span>
            <Grid cells={data.b} label={`B ${JSON.stringify(data.b_shape)}`} />
            <span className="bc-op">=</span>
            <Grid cells={data.out} label={`result ${JSON.stringify(data.out_shape)}`} accent />
          </div>
        </>
      )}
    </div>
  )
}
