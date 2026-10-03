import { marked } from 'marked'
import { useMemo } from 'react'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const PY =
  /(#[^\n]*)|('''[\s\S]*?'''|"""[\s\S]*?"""|[rbf]{0,2}"(?:\\.|[^"\\\n])*"|[rbf]{0,2}'(?:\\.|[^'\\\n])*')|\b(\d+(?:\.\d+)?(?:e[+-]?\d+)?j?)\b|\b(def|class|return|if|elif|else|for|while|in|not|and|or|is|None|True|False|import|from|as|try|except|finally|raise|with|lambda|yield|async|await|pass|break|continue|global|assert|del)\b|\b([A-Za-z_]\w*)(?=\()/g

/** Tiny Python tokenizer for guide code blocks; themed with the editor's --syn-* colors. */
function highlightPython(code: string): string {
  let out = ''
  let last = 0
  for (const m of code.matchAll(PY)) {
    out += esc(code.slice(last, m.index))
    const [whole, comment, str, num, kw, call] = m
    const cls = comment ? 'tok-c' : str ? 'tok-s' : num ? 'tok-n' : kw ? 'tok-k' : call && /^[A-Z]/.test(call) ? 'tok-t' : 'tok-f'
    out += `<span class="${cls}">${esc(whole)}</span>`
    last = m.index + whole.length
  }
  return out + esc(code.slice(last))
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
