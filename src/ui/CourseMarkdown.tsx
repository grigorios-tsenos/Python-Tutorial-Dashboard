import { Marked } from 'marked'
import { useEffect, useMemo, useRef } from 'react'
import { COURSE, COURSE_BY_KEY, coursePath } from '../content/course'
import { useStore } from '../store/useStore'
import { esc, highlightPython } from './Markdown'

/**
 * Resolve a link written relative to `phases/<key>/docs/en.md`:
 * other lessons become in-app routes, figures point at the vendored copy, anything else goes to the source repo.
 */
export function resolveCourseHref(href: string, key: string): string {
  if (/^([a-z]+:|#)/i.test(href)) return href
  const url = new URL(href, `https://orbit.invalid/phases/${key}/docs/`)
  const m = /^\/phases\/([^/]+)\/([^/]+)\/?(.*)$/.exec(url.pathname)
  if (!m) return `${COURSE.source}/blob/main${url.pathname}`
  const target = `${m[1]}/${m[2]}`
  const rest = m[3]
  if (rest.startsWith('assets/')) return `${import.meta.env.BASE_URL}curriculum/${target}/${rest}`
  if (COURSE_BY_KEY[target] && (rest === '' || rest.startsWith('docs/'))) return coursePath(target) + url.hash
  return `${COURSE.source}/blob/main/phases/${target}/${rest}`
}

let currentKey = ''
const md = new Marked({
  gfm: true,
  breaks: false,
  renderer: {
    code({ text, lang }) {
      if (lang === 'mermaid') return `<pre class="mermaid">${esc(text)}</pre>\n`
      const body = !lang || lang === 'python' || lang === 'py' ? highlightPython(text) : esc(text)
      return `<pre><code>${body}</code></pre>\n`
    },
    link({ href, title, tokens }) {
      const to = resolveCourseHref(href, currentKey)
      const external = /^https?:/.test(to)
      return `<a href="${esc(to)}"${title ? ` title="${esc(title)}"` : ''}${external ? ' target="_blank" rel="noopener"' : ''}>${this.parser.parseInline(tokens)}</a>`
    },
    image({ href, title, text }) {
      return `<img src="${esc(resolveCourseHref(href, currentKey))}" alt="${esc(text)}"${title ? ` title="${esc(title)}"` : ''} loading="lazy">`
    },
  },
})

export function renderCourseMarkdown(src: string, key: string): string {
  currentKey = key
  return md.parse(src, { async: false }) as string
}

/** mermaid is only fetched when a lesson actually contains a diagram (same CDN as the Python runtime) */
const MERMAID_URL = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs'
let mermaidModule: Promise<any> | null = null
const loadMermaid = () => (mermaidModule ??= import(/* @vite-ignore */ MERMAID_URL))

/** Vendored course text (MIT, reviewed at sync time) rendered with lesson-aware links and live diagrams. */
export function CourseMarkdown({ src, lessonKey }: { src: string; lessonKey: string }) {
  const html = useMemo(() => renderCourseMarkdown(src, lessonKey), [src, lessonKey])
  const theme = useStore((s) => s.settings.theme)
  const el = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = el.current
    if (!root) return
    root.innerHTML = html
    const nodes = root.querySelectorAll<HTMLElement>('pre.mermaid')
    if (!nodes.length) return
    let cancelled = false
    loadMermaid()
      .then((m) => {
        if (cancelled) return
        const mermaid = m.default ?? m
        mermaid.initialize({ startOnLoad: false, theme: theme === 'dark' ? 'dark' : 'default', securityLevel: 'strict', fontFamily: 'inherit' })
        return mermaid.run({ nodes: [...nodes], suppressErrors: true })
      })
      .catch(() => {}) // diagrams stay as text when the CDN is unreachable
    return () => {
      cancelled = true
    }
  }, [html, theme])

  return <div className="prose course-article" ref={el} />
}
