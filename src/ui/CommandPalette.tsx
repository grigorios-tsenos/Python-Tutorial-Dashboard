import { useEffect, useMemo, useRef, useState } from 'react'
import { LESSONS } from '../content'
import { COURSE_LESSONS, coursePath } from '../content/course'
import { TRACK_BY_ID } from '../content/tracks'
import { go, lessonPath } from '../lib/router'
import { useStore } from '../store/useStore'
import { useUi } from '../store/ui'

interface Item {
  id: string
  label: string
  hint: string
  keywords?: string
  run: () => void
  icon: string
}

function score(q: string, text: string): number {
  if (!q) return 1
  const t = text.toLowerCase()
  const s = q.toLowerCase()
  const at = t.indexOf(s)
  if (at >= 0) return 100 - at
  let i = 0
  for (const ch of t) if (ch === s[i]) i++
  return i === s.length ? 10 : 0
}

export function CommandPalette() {
  const open = useUi((s) => s.paletteOpen)
  const completed = useStore((s) => s.completed)
  const courseDone = useStore((s) => s.course)
  const settings = useStore((s) => s.settings)
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const close = () => {
    useUi.getState().set({ paletteOpen: false })
    setQ('')
    setSel(0)
  }

  const items = useMemo<Item[]>(() => {
    const st = useStore.getState()
    const actions: Item[] = [
      { id: 'a-map', label: 'Go to the map', hint: 'page', icon: '✦', run: () => go('#/') },
      { id: 'a-course', label: 'Open the Course (AI Engineering from Scratch)', hint: 'page', icon: '📚', run: () => go('#/course') },
      { id: 'a-review', label: 'Open Review', hint: 'page', icon: '🧠', run: () => go('#/review') },
      { id: 'a-stats', label: 'Open Dashboard', hint: 'page', icon: '◔', run: () => go('#/stats') },
      { id: 'a-vim', label: `Turn Vim mode ${settings.vim ? 'off' : 'on'}`, hint: 'setting', icon: '⌨', run: () => st.setSetting('vim', !settings.vim) },
      { id: 'a-theme', label: `Switch to ${settings.theme === 'dark' ? 'light' : 'dark'} theme`, hint: 'setting', icon: '◐', run: () => st.setSetting('theme', settings.theme === 'dark' ? 'light' : 'dark') },
      { id: 'a-settings', label: 'Open settings / export progress', hint: 'setting', icon: '⚙', run: () => useUi.getState().set({ settingsOpen: true }) },
    ]
    const lessons: Item[] = LESSONS.map((l) => ({
      id: l.id,
      label: l.title,
      hint: `${TRACK_BY_ID[l.track].name}${completed[l.id] ? ' · ✓' : ''}`,
      icon: TRACK_BY_ID[l.track].glyph,
      keywords: `${l.id.replace(/-/g, ' ')} ${l.tagline} ${TRACK_BY_ID[l.track].name} ${l.kind}`,
      run: () => go(lessonPath(l.id)),
    }))
    const course: Item[] = COURSE_LESSONS.map((e) => ({
      id: `course-${e.key}`,
      label: e.lesson.title,
      hint: `Course · Phase ${e.phase.n}${courseDone[e.key] ? ' · ✓' : ''}`,
      icon: '📚',
      keywords: `${e.phase.title} ${e.lesson.tagline} ${e.lesson.type}`,
      run: () => go(coursePath(e.key)),
    }))
    return [...actions, ...lessons, ...course]
  }, [completed, courseDone, settings])

  const results = useMemo(
    () =>
      items
        .map((it) => ({ it, s: Math.max(score(q, it.label), score(q, it.hint) * 0.6, score(q, it.keywords ?? '') * 0.7) }))
        .filter((r) => r.s > 0)
        .sort((a, b) => b.s - a.s)
        .slice(0, 9)
        .map((r) => r.it),
    [items, q],
  )

  useEffect(() => setSel(0), [q])

  if (!open) return null
  const choose = (it?: Item) => {
    if (!it) return
    close()
    it.run()
  }

  return (
    <div className="modal-backdrop top" role="dialog" aria-modal="true" aria-label="Command palette" onClick={close}>
      <div className="palette" onClick={(e) => e.stopPropagation()}>
        <input
          ref={input}
          autoFocus
          value={q}
          placeholder="Jump to a lesson or run a command…"
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') close()
            else if (e.key === 'ArrowDown') {
              e.preventDefault()
              setSel((s) => Math.min(results.length - 1, s + 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setSel((s) => Math.max(0, s - 1))
            } else if (e.key === 'Enter') choose(results[sel])
          }}
          aria-label="Search"
        />
        <ul role="listbox">
          {results.map((r, i) => (
            <li key={r.id} role="option" aria-selected={i === sel} className={i === sel ? 'sel' : ''} onMouseEnter={() => setSel(i)} onClick={() => choose(r)}>
              <span className="pal-icon" aria-hidden>{r.icon}</span>
              <span className="pal-label">{r.label}</span>
              <span className="dim">{r.hint}</span>
            </li>
          ))}
          {results.length === 0 && <li className="dim empty">Nothing matches “{q}”.</li>}
        </ul>
        <div className="pal-foot dim"><kbd>↑</kbd><kbd>↓</kbd> navigate · <kbd>↵</kbd> select · <kbd>esc</kbd> close</div>
      </div>
    </div>
  )
}
