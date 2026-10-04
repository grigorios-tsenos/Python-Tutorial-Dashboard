import { python } from '@codemirror/lang-python'
import { highlightCode, tagHighlighter, tags as t } from '@lezer/highlight'
import { marked } from 'marked'
import { useMemo } from 'react'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// the editor's parser, mapped to the .tok-* classes in styles.css
const parser = python().language.parser
const classes = tagHighlighter([
  { tag: [t.keyword, t.controlKeyword, t.operatorKeyword, t.definitionKeyword, t.moduleKeyword, t.self, t.atom], class: 'tok-k' },
  { tag: [t.string, t.special(t.string)], class: 'tok-s' },
  { tag: [t.number, t.bool, t.null], class: 'tok-n' },
  { tag: [t.comment, t.lineComment], class: 'tok-c' },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], class: 'tok-f' },
  { tag: [t.className, t.typeName], class: 'tok-t' },
])

function highlightPython(code: string): string {
  let out = ''
  highlightCode(code, parser.parse(code), classes, (text, cls) => { out += cls ? `<span class="${cls}">${esc(text)}</span>` : esc(text) }, () => { out += '\n' })
  return out
}

marked.setOptions({ gfm: true, breaks: false })
marked.use({
  renderer: {
    code({ text, lang }) {
      const body = !lang || lang === 'python' || lang === 'py' ? highlightPython(text) : esc(text)
      return `<pre><code>${body}</code></pre>\n`
    },
  },
})

/** Lesson content is first-party (bundled), so rendering its Markdown as HTML is safe. */
export function Markdown({ src }: { src: string }) {
  const html = useMemo(() => marked.parse(src, { async: false }) as string, [src])
  return <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
}
