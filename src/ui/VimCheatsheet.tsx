import { useEffect } from 'react'
import { useUi } from '../store/ui'

const ROWS: [string, string][] = [
  ['i / a', 'insert before / after cursor'],
  ['o / O', 'new line below / above'],
  ['Esc', 'back to normal mode'],
  ['h j k l', 'move left / down / up / right'],
  ['w / b', 'next / previous word'],
  ['0 / $', 'start / end of line'],
  ['gg / G', 'top / bottom of file'],
  ['x', 'delete character'],
  ['dd', 'delete (cut) line'],
  ['yy / p', 'yank (copy) line / paste'],
  ['ciw', 'change inner word'],
  ['u / Ctrl-r', 'undo / redo'],
  ['/text', 'search (n for next)'],
  ['v / V', 'visual select char / line'],
  ['>> / <<', 'indent / outdent line'],
  [':w', 'run your code (Orbit)'],
  [':q', 'back to the map (Orbit)'],
]

export function VimCheatsheet() {
  const open = useUi((s) => s.cheatOpen)
  const close = () => useUi.getState().set({ cheatOpen: false })
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])
  if (!open) return null
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Vim cheat sheet" onClick={close}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Vim cheat sheet</h2>
          <button className="icon-btn" onClick={close} aria-label="Close">✕</button>
        </div>
        <div className="cheat-grid">
          {ROWS.map(([k, d]) => (
            <div key={k} className="cheat-row">
              <kbd>{k}</kbd>
              <span>{d}</span>
            </div>
          ))}
        </div>
        <p className="dim">Vim mode is a full keybinding emulation. Turn it on or off any time in the editor toolbar or Settings.</p>
      </div>
    </div>
  )
}
