import { Suspense, lazy, useEffect } from 'react'
import { runner } from './engine/runner'
import { useRoute } from './lib/router'
import { useStore } from './store/useStore'
import { useUi } from './store/ui'
import { Backdrop } from './ui/Backdrop'
import { Celebration } from './ui/Celebration'
import { CommandPalette } from './ui/CommandPalette'
import { MapView } from './ui/MapView'
import { ReviewView } from './ui/ReviewView'
import { SettingsModal } from './ui/SettingsModal'
import { StatsView } from './ui/StatsView'
import { Toasts } from './ui/Toasts'
import { Topbar } from './ui/Topbar'
import { VimCheatsheet } from './ui/VimCheatsheet'

const LessonView = lazy(() => import('./ui/LessonView').then((m) => ({ default: m.LessonView })))

export default function App() {
  const route = useRoute()
  const hydrated = useStore((s) => s.hydrated)
  const theme = useStore((s) => s.settings.theme)
  const reduce = useStore((s) => s.settings.reduceMotion)
  const warn = useUi((s) => s.storageWarning)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.dataset.motion = reduce ? 'reduced' : 'full'
  }, [theme, reduce])

  useEffect(() => {
    runner.boot() // pre-warm Python while the learner reads the map
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        const ui = useUi.getState()
        ui.set({ paletteOpen: !ui.paletteOpen })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!hydrated) {
    return (
      <div className="boot" role="status">
        <span className="spinner big" aria-hidden /> Loading your orbit…
      </div>
    )
  }

  return (
    <>
      <Backdrop />
      <Topbar route={route} />
      {warn && (
        <div className="banner" role="alert">
          Your browser is blocking local storage, so progress won't be saved after you close this tab. Use <strong>Settings → Export</strong> to keep a copy.
        </div>
      )}
      <main id="main" className={`route-${route.name}`}>
        {route.name === 'map' && <MapView />}
        {route.name === 'lesson' && (
          <Suspense fallback={<div className="boot" role="status"><span className="spinner big" aria-hidden /> Opening lesson…</div>}>
            <LessonView id={route.id} />
          </Suspense>
        )}
        {route.name === 'review' && <ReviewView />}
        {route.name === 'stats' && <StatsView />}
      </main>
      <Toasts />
      <Celebration />
      <CommandPalette />
      <SettingsModal />
      <VimCheatsheet />
    </>
  )
}
