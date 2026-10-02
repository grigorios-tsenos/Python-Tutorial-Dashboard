import { useRef, useState } from 'react'

interface Props {
  order: string[]
  onChange: (next: string[]) => void
  disabled?: boolean
}

/** Drag-and-drop (or keyboard / button) reordering of code lines. Indentation is part of each line. */
export function Parsons({ order, onChange, disabled }: Props) {
  const [drag, setDrag] = useState<number | null>(null)
  const [over, setOver] = useState<number | null>(null)
  const refs = useRef<(HTMLLIElement | null)[]>([])

  const move = (from: number, to: number) => {
    if (to < 0 || to >= order.length || from === to) return
    const next = order.slice()
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next)
    requestAnimationFrame(() => refs.current[to]?.focus())
  }

  return (
    <ol className="parsons" aria-label="Code lines. Drag to reorder, or focus a line and press Alt+Up / Alt+Down.">
      {order.map((line, i) => (
        <li
          key={line + i}
          ref={(el) => {
            refs.current[i] = el
          }}
          tabIndex={0}
          draggable={!disabled}
          className={`${drag === i ? 'dragging' : ''} ${over === i && drag !== null && drag !== i ? 'over' : ''}`}
          onDragStart={(e) => {
            setDrag(i)
            e.dataTransfer.effectAllowed = 'move'
            e.dataTransfer.setData('text/plain', String(i))
          }}
          onDragOver={(e) => {
            e.preventDefault()
            setOver(i)
          }}
          onDragEnd={() => {
            setDrag(null)
            setOver(null)
          }}
          onDrop={(e) => {
            e.preventDefault()
            if (drag !== null) move(drag, i)
            setDrag(null)
            setOver(null)
          }}
          onKeyDown={(e) => {
            if (e.altKey && e.key === 'ArrowUp') {
              e.preventDefault()
              move(i, i - 1)
            } else if (e.altKey && e.key === 'ArrowDown') {
              e.preventDefault()
              move(i, i + 1)
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              refs.current[i - 1]?.focus()
            } else if (e.key === 'ArrowDown') {
              e.preventDefault()
              refs.current[i + 1]?.focus()
            }
          }}
        >
          <span className="grip" aria-hidden>⠿</span>
          <code>{line}</code>
          <span className="arrows">
            <button type="button" aria-label="Move line up" disabled={i === 0 || disabled} onClick={() => move(i, i - 1)}>▲</button>
            <button type="button" aria-label="Move line down" disabled={i === order.length - 1 || disabled} onClick={() => move(i, i + 1)}>▼</button>
          </span>
        </li>
      ))}
    </ol>
  )
}

/** Restore a saved arrangement (as joined code) onto the lesson's lines, if it is a permutation of them. */
export function restoreOrder(saved: string | undefined, lines: string[]): string[] | null {
  if (!saved) return null
  const parts = saved.split('\n').filter((l) => l.trim() !== '')
  if (parts.length !== lines.length) return null
  const pool = lines.slice()
  for (const p of parts) {
    const k = pool.indexOf(p)
    if (k < 0) return null
    pool.splice(k, 1)
  }
  return parts
}
