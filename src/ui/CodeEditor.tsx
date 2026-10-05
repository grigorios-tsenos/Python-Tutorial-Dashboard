import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { python } from '@codemirror/lang-python'
import { HighlightStyle, bracketMatching, indentOnInput, syntaxHighlighting } from '@codemirror/language'
import { Compartment, EditorState, Prec } from '@codemirror/state'
import { EditorView, drawSelection, highlightActiveLine, highlightActiveLineGutter, keymap, lineNumbers } from '@codemirror/view'
import { tags as t } from '@lezer/highlight'
import { Vim, vim } from '@replit/codemirror-vim'
import { useEffect, useRef } from 'react'

export interface VimActions {
  run: () => void
  quit: () => void
}

let vimActions: VimActions = { run: () => {}, quit: () => {} }

/** Vim ex commands (:w, :wq, :q) call whichever lesson is currently mounted. */
export function setVimActions(a: VimActions) {
  vimActions = a
}

let activeView: EditorView | null = null
/** Focus the lesson's editable editor (page shortcut `i`). False when no editor is mounted, e.g. a Parsons puzzle. */
export function focusEditor(): boolean {
  if (!activeView) return false
  activeView.focus()
  return true
}

let exRegistered = false
function registerEx() {
  if (exRegistered) return
  exRegistered = true
  Vim.defineEx('write', 'w', () => vimActions.run())
  Vim.defineEx('wq', 'wq', () => vimActions.run())
  Vim.defineEx('quit', 'q', () => vimActions.quit())
}

const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.operatorKeyword, t.definitionKeyword, t.moduleKeyword], color: 'var(--syn-keyword)' },
  { tag: [t.string, t.special(t.string)], color: 'var(--syn-string)' },
  { tag: [t.number, t.bool, t.null], color: 'var(--syn-number)' },
  { tag: [t.comment, t.lineComment], color: 'var(--syn-comment)', fontStyle: 'italic' },
  { tag: [t.function(t.variableName), t.function(t.propertyName), t.definition(t.function(t.variableName))], color: 'var(--syn-func)' },
  { tag: [t.className, t.typeName], color: 'var(--syn-class)' },
  { tag: [t.propertyName, t.attributeName], color: 'var(--syn-prop)' },
  { tag: [t.self, t.atom], color: 'var(--syn-keyword)' },
  { tag: t.meta, color: 'var(--syn-class)' },
])

const theme = EditorView.theme({
  '&': { color: 'var(--text)', backgroundColor: 'transparent', fontSize: '13.5px', height: '100%' },
  '.cm-scroller': { fontFamily: 'var(--mono)', lineHeight: '1.65', overflow: 'auto' },
  '.cm-content': { caretColor: 'var(--accent)', padding: '10px 0' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--accent)', borderLeftWidth: '2px' },
  '&.cm-focused .cm-fat-cursor': { background: 'var(--accent) !important', color: 'var(--bg) !important' },
  '.cm-fat-cursor': { background: 'color-mix(in srgb, var(--accent) 45%, transparent) !important' },
  '.cm-gutters': { backgroundColor: 'transparent', color: 'var(--text-faint)', border: 'none' },
  '.cm-activeLine': { backgroundColor: 'color-mix(in srgb, var(--accent) 6%, transparent)' },
  '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--text-dim)' },
  '&.cm-focused': { outline: 'none' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': { backgroundColor: 'color-mix(in srgb, var(--accent) 28%, transparent) !important' },
  '.cm-matchingBracket': { backgroundColor: 'color-mix(in srgb, var(--accent) 25%, transparent)', outline: 'none' },
  '.cm-panels': { backgroundColor: 'transparent', color: 'var(--text-dim)', borderTop: '1px solid var(--line)' },
  '.cm-vim-panel': { fontFamily: 'var(--mono)', fontSize: '12px', padding: '3px 12px', color: 'var(--accent)' },
  '.cm-vim-panel input': { background: 'transparent', color: 'var(--text)', border: 'none', outline: 'none', fontFamily: 'var(--mono)' },
})

interface Props {
  /** changing the key rebuilds the editor (new lesson) */
  docKey: string
  value: string
  onChange?: (v: string) => void
  onRun?: () => void
  readOnly?: boolean
  vimMode?: boolean
}

export function CodeEditor({ docKey, value, onChange, onRun, readOnly, vimMode }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const view = useRef<EditorView | null>(null)
  const vimCompartment = useRef(new Compartment())
  const cb = useRef({ onChange, onRun })
  cb.current = { onChange, onRun }
  const initial = useRef({ value, vimMode })
  initial.current = { value, vimMode }

  useEffect(() => {
    registerEx()
    if (!host.current) return
    const comp = vimCompartment.current
    const v = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: initial.current.value,
        extensions: [
          comp.of(initial.current.vimMode && !readOnly ? vim({ status: true }) : []),
          lineNumbers(),
          highlightActiveLineGutter(),
          history(),
          drawSelection(),
          indentOnInput(),
          bracketMatching(),
          highlightActiveLine(),
          python(),
          syntaxHighlighting(highlight),
          theme,
          EditorState.tabSize.of(4),
          Prec.highest(
            keymap.of([
              {
                key: 'Mod-Enter',
                run: () => {
                  cb.current.onRun?.()
                  return true
                },
              },
            ]),
          ),
          keymap.of([indentWithTab, ...defaultKeymap, ...historyKeymap]),
          EditorState.readOnly.of(!!readOnly),
          EditorView.editable.of(!readOnly),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) cb.current.onChange?.(u.state.doc.toString())
          }),
        ],
      }),
    })
    view.current = v
    if (!readOnly) activeView = v
    return () => {
      if (activeView === v) activeView = null
      v.destroy()
      view.current = null
    }
  }, [docKey, readOnly])

  useEffect(() => {
    view.current?.dispatch({ effects: vimCompartment.current.reconfigure(vimMode && !readOnly ? vim({ status: true }) : []) })
  }, [vimMode, readOnly])

  useEffect(() => {
    const v = view.current
    if (v && v.state.doc.toString() !== value) v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: value } })
  }, [value])

  return <div className="editor" ref={host} data-vim={vimMode ? 'on' : 'off'} />
}
