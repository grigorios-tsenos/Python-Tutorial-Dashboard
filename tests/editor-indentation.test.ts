import { insertNewlineAndIndent } from '@codemirror/commands'
import { python } from '@codemirror/lang-python'
import { EditorState } from '@codemirror/state'
import { describe, expect, it } from 'vitest'
import { pythonIndentation } from '../src/ui/pythonIndentation'

describe('Python Enter indentation', () => {
  it.each([
    ['if True:', '    '],
    ['def example():', '    '],
    ['if True:\n    if True:', '        '],
    ['if True:\n    print("hello")', '    '],
    ['values = [', '    '],
    ['print("hello")', ''],
  ])('indents after %s', (doc, indentation) => {
    let state = EditorState.create({
      doc,
      selection: { anchor: doc.length },
      extensions: [python(), pythonIndentation],
    })
    insertNewlineAndIndent({ state, dispatch: transaction => { state = transaction.state } })
    expect(state.doc.toString()).toBe(`${doc}\n${indentation}`)
    expect(state.selection.main.head).toBe(state.doc.length)
  })
})
