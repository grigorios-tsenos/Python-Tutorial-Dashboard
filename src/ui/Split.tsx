import { useRef, useState } from 'react'

interface Props {
  axis: 'x' | 'y'
  /** fraction of the container taken by the first pane */
  value: number
  min: number
  max: number
  /** element the fraction is measured against */
  container: React.RefObject<HTMLElement | null>
  /** live updates while dragging */
  onChange: (v: number) => void
  /** final value, worth persisting */
  onCommit: (v: number) => void
  onReset: () => void
  label: string
}

/** Drag (or arrow-key) handle between two panes. Double-click or Home resets. */
export function SplitHandle({ axis, value, min, max, container, onChange, onCommit, onReset, label }: Props) {
  const [dragging, setDragging] = useState(false)
  const last = useRef(value)
  const moved = useRef(false)
  const downAt = useRef(0)
  const clamp = (v: number) => Math.min(max, Math.max(min, v))
  const fromPointer = (e: React.PointerEvent) => {
    const r = container.current?.getBoundingClientRect()
    if (!r) return value
    return clamp(axis === 'x' ? (e.clientX - r.left) / r.width : (e.clientY - r.top) / r.height)
  }
  return (
    <div
      role="separator"
      aria-orientation={axis === 'x' ? 'vertical' : 'horizontal'}
      aria-label={label}
      aria-valuenow={Math.round(value * 100)}
      aria-valuemin={Math.round(min * 100)}
      aria-valuemax={Math.round(max * 100)}
      tabIndex={0}
      className={`split split-${axis} ${dragging ? 'dragging' : ''}`}
      title={`${label}. Drag, use arrow keys, or double-click to reset`}
      onPointerDown={(e) => {
        e.preventDefault()
        // pointer capture swallows dblclick in some browsers, so detect two quick presses here
        if (e.timeStamp - downAt.current < 350) {
          downAt.current = 0
          onReset()
          return
        }
        downAt.current = e.timeStamp
        last.current = value
        moved.current = false
        e.currentTarget.setPointerCapture(e.pointerId)
        setDragging(true)
      }}
      onPointerMove={(e) => {
        if (!dragging) return
        moved.current = true
        last.current = fromPointer(e)
        onChange(last.current)
      }}
      onPointerUp={(e) => {
        if (!dragging) return
        e.currentTarget.releasePointerCapture(e.pointerId)
        setDragging(false)
        if (moved.current) onCommit(last.current)
      }}
      onPointerCancel={() => {
        if (!dragging) return
        setDragging(false)
        if (moved.current) onCommit(last.current)
      }}
      onDoubleClick={onReset}
      onKeyDown={(e) => {
        const dec = axis === 'x' ? 'ArrowLeft' : 'ArrowUp'
        const inc = axis === 'x' ? 'ArrowRight' : 'ArrowDown'
        if (e.key === dec || e.key === inc) {
          e.preventDefault()
          const v = clamp(value + (e.shiftKey ? 0.1 : 0.02) * (e.key === inc ? 1 : -1))
          onChange(v)
          onCommit(v)
        } else if (e.key === 'Home') {
          e.preventDefault()
          onReset()
        }
      }}
    />
  )
}
