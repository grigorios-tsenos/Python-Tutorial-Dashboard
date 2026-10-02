import { create } from 'zustand'
import type { Achievement } from '../lib/achievements'

export interface Toast {
  id: number
  text: string
  kind: 'info' | 'success' | 'badge' | 'error'
  icon?: string
}

export interface Celebration {
  lessonId: string
  xp: number
  levelUp: number | null
  badges: Achievement[]
  questBonus: number
  cardsAdded: number
  hints: number
}

interface UiState {
  toasts: Toast[]
  celebration: Celebration | null
  paletteOpen: boolean
  settingsOpen: boolean
  cheatOpen: boolean
  storageWarning: boolean
  push: (text: string, kind?: Toast['kind'], icon?: string) => void
  dismiss: (id: number) => void
  setCelebration: (c: Celebration | null) => void
  set: (patch: Partial<Pick<UiState, 'paletteOpen' | 'settingsOpen' | 'cheatOpen' | 'storageWarning'>>) => void
}

let nextId = 1

export const useUi = create<UiState>((set, get) => ({
  toasts: [],
  celebration: null,
  paletteOpen: false,
  settingsOpen: false,
  cheatOpen: false,
  storageWarning: false,
  push: (text, kind = 'info', icon) => {
    const id = nextId++
    set({ toasts: [...get().toasts, { id, text, kind, icon }].slice(-4) })
    setTimeout(() => get().dismiss(id), kind === 'badge' ? 5200 : 3600)
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
  setCelebration: (celebration) => set({ celebration }),
  set: (patch) => set(patch),
}))
