import { useMemo, useSyncExternalStore } from 'react'

export type Route =
  | { name: 'map' }
  | { name: 'lesson'; id: string }
  | { name: 'review' }
  | { name: 'stats' }
  | { name: 'course'; phase?: string; path?: string }
  | { name: 'course-lesson'; key: string }

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#/, '')
  const parts = path.split('/').filter(Boolean)
  if (parts[0] === 'lesson' && parts[1]) return { name: 'lesson', id: decodeURIComponent(parts[1]) }
  if (parts[0] === 'course') {
    if (parts[1] === 'path' && parts[2]) return { name: 'course', path: decodeURIComponent(parts[2]) }
    if (parts[1] && parts[2]) return { name: 'course-lesson', key: `${decodeURIComponent(parts[1])}/${decodeURIComponent(parts[2])}` }
    return { name: 'course', phase: parts[1] ? decodeURIComponent(parts[1]) : undefined }
  }
  if (parts[0] === 'review') return { name: 'review' }
  if (parts[0] === 'stats') return { name: 'stats' }
  return { name: 'map' }
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash, () => '')
  return useMemo(() => parseHash(hash), [hash])
}

export const go = (path: string) => {
  window.location.hash = path
}
export const lessonPath = (id: string) => `#/lesson/${encodeURIComponent(id)}`
