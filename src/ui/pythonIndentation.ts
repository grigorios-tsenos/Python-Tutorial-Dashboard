import { indentUnit } from '@codemirror/language'
import { EditorState } from '@codemirror/state'

export const pythonIndentation = [EditorState.tabSize.of(4), indentUnit.of('    ')]
