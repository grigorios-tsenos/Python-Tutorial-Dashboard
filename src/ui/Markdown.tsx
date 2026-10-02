import { marked } from 'marked'
import { useMemo } from 'react'

marked.setOptions({ gfm: true, breaks: false })

/** Lesson content is first-party (bundled), so rendering its Markdown as HTML is safe. */
export function Markdown({ src }: { src: string }) {
  const html = useMemo(() => marked.parse(src, { async: false }) as string, [src])
  return <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
}
