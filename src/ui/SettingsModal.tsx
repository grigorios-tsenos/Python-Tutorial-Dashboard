import { useEffect, useRef, useState } from 'react'
import { ACCENTS, type MapLabels } from '../store/model'
import { useStore } from '../store/useStore'
import { useUi } from '../store/ui'

export function SettingsModal() {
  const open = useUi((s) => s.settingsOpen)
  const settings = useStore((s) => s.settings)
  const setSetting = useStore((s) => s.setSetting)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [confirmText, setConfirmText] = useState('')
  const file = useRef<HTMLInputElement>(null)
  const close = () => {
    useUi.getState().set({ settingsOpen: false })
    setMsg(null)
    setConfirmText('')
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!open) return null

  const doExport = () => {
    const blob = new Blob([useStore.getState().exportJson()], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `orbit-progress-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    setMsg({ ok: true, text: 'Exported. Keep that file safe: it is your whole progress.' })
  }

  const doImport = async (f: File | undefined) => {
    if (!f) return
    if (f.size > 5_000_000) return setMsg({ ok: false, text: 'That file is too large to be an Orbit export.' })
    const res = useStore.getState().importJson(await f.text())
    setMsg(res.ok ? { ok: true, text: 'Progress imported.' } : { ok: false, text: res.error })
    if (file.current) file.current.value = ''
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Settings" onClick={close}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Settings</h2>
          <button className="icon-btn" onClick={close} aria-label="Close">✕</button>
        </div>

        <div className="setting">
          <div><strong>Vim keybindings</strong><div className="dim">Modal editing in every code editor. <code>:w</code> runs, <code>:q</code> returns to the map.</div></div>
          <button className={`switch ${settings.vim ? 'on' : ''}`} role="switch" aria-checked={settings.vim} onClick={() => setSetting('vim', !settings.vim)}><i /></button>
        </div>
        <div className="setting">
          <div><strong>Light theme</strong><div className="dim">Orbit is built for the dark, but daylight happens.</div></div>
          <button className={`switch ${settings.theme === 'light' ? 'on' : ''}`} role="switch" aria-checked={settings.theme === 'light'} onClick={() => setSetting('theme', settings.theme === 'light' ? 'dark' : 'light')}><i /></button>
        </div>
        <div className="setting">
          <div><strong>Accent colour</strong><div className="dim">Buttons, progress and highlights across the app.</div></div>
          <div className="accent-swatches" role="radiogroup" aria-label="Accent colour">
            {ACCENTS.map((a) => (
              <button key={a} className={`accent-swatch ${settings.accent === a ? 'on' : ''}`} data-accent={a} role="radio" aria-checked={settings.accent === a} aria-label={a} title={a} onClick={() => setSetting('accent', a)} />
            ))}
          </div>
        </div>
        <div className="setting">
          <div><strong>Star titles on the map</strong><div className="dim">Show every title, only the next star, or hover to reveal.</div></div>
          <div className="seg" role="radiogroup" aria-label="Star titles">
            {(['all', 'focus', 'off'] as MapLabels[]).map((m) => (
              <button key={m} className={`pill ${settings.mapLabels === m ? 'on' : ''}`} role="radio" aria-checked={settings.mapLabels === m} onClick={() => setSetting('mapLabels', m)}>{m === 'all' ? 'All' : m === 'focus' ? 'Next' : 'Hover'}</button>
            ))}
          </div>
        </div>
        <div className="setting">
          <div><strong>Reduce motion</strong><div className="dim">Calms the map, twinkling stars and celebrations.</div></div>
          <button className={`switch ${settings.reduceMotion ? 'on' : ''}`} role="switch" aria-checked={settings.reduceMotion} onClick={() => setSetting('reduceMotion', !settings.reduceMotion)}><i /></button>
        </div>
        <div className="setting setting-col">
          <div><strong>Lesson intros</strong><div className="dim">How each lesson's guided intro (warm-up + demo) opens. You can still show or hide it on any lesson, and that choice is remembered per lesson.</div></div>
          <div className="seg" role="radiogroup" aria-label="Lesson intro style">
            {([['full', 'Full guided'], ['quick', 'Start at the demo'], ['code', 'Straight to code']] as const).map(([v, label]) => (
              <button key={v} className={`seg-btn ${settings.introStyle === v ? 'on' : ''}`} role="radio" aria-checked={settings.introStyle === v} onClick={() => setSetting('introStyle', v)}>{label}</button>
            ))}
          </div>
        </div>

        <h3>Your data</h3>
        <p className="dim">Progress lives in this browser (IndexedDB). Export it to back up or move devices.</p>
        <div className="row">
          <button className="btn" onClick={doExport}>Export progress</button>
          <button className="btn" onClick={() => file.current?.click()}>Import…</button>
          <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => void doImport(e.target.files?.[0])} />
        </div>
        {msg && <p className={msg.ok ? 'msg ok' : 'msg bad'} role="status">{msg.text}</p>}

        <h3>Danger zone</h3>
        <div className="row">
          <input className="text-input" placeholder='Type "reset" to enable' value={confirmText} onChange={(e) => setConfirmText(e.target.value)} aria-label="Type reset to confirm" />
          <button className="btn danger" disabled={confirmText.trim().toLowerCase() !== 'reset'} onClick={() => { useStore.getState().resetAll(); setConfirmText(''); setMsg({ ok: true, text: 'All progress erased.' }) }}>Erase all progress</button>
        </div>
      </div>
    </div>
  )
}
