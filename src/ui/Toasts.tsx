import { useUi } from '../store/ui'

export function Toasts() {
  const toasts = useUi((s) => s.toasts)
  const dismiss = useUi((s) => s.dismiss)
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`} onClick={() => dismiss(t.id)}>
          {t.icon && <span aria-hidden>{t.icon}</span>} {t.text}
        </div>
      ))}
    </div>
  )
}
