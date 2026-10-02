import { useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'

/** Slow-twinkling star field behind everything. Static when reduced motion is on. */
export function Backdrop() {
  const ref = useRef<HTMLCanvasElement>(null)
  const reduce = useStore((s) => s.settings.reduceMotion)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf = 0
    let w = 0
    let h = 0
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let color = '#fff'
    const stars = Array.from({ length: 110 }, (_, i) => ({ x: ((i * 9301 + 49297) % 233280) / 233280, y: ((i * 7919 + 1237) % 104729) / 104729, r: 0.4 + ((i * 31) % 10) / 9, p: i * 1.7 }))
    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = color
      for (const s of stars) {
        ctx.globalAlpha = reduce || motion.matches ? 0.35 : 0.25 + 0.4 * (0.5 + 0.5 * Math.sin(t / 1400 + s.p))
        ctx.beginPath()
        ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    const tick = (t: number) => {
      draw(t)
      if (!reduce && !motion.matches && !document.hidden) raf = requestAnimationFrame(tick)
    }
    const refresh = () => {
      cancelAnimationFrame(raf)
      color = getComputedStyle(document.documentElement).getPropertyValue('--star').trim() || '#fff'
      draw(performance.now())
      if (!reduce && !motion.matches && !document.hidden) raf = requestAnimationFrame(tick)
    }
    const theme = new MutationObserver(refresh)
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      refresh()
    }
    resize()
    window.addEventListener('resize', resize)
    motion.addEventListener('change', refresh)
    document.addEventListener('visibilitychange', refresh)
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      motion.removeEventListener('change', refresh)
      document.removeEventListener('visibilitychange', refresh)
      theme.disconnect()
    }
  }, [reduce])

  return <canvas ref={ref} className="backdrop" aria-hidden />
}
