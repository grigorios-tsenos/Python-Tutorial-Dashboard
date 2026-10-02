import { del, get, set } from 'idb-keyval'
import type { StateStorage } from 'zustand/middleware'
import { useUi } from './ui'

const mem = new Map<string, string>()

/** IndexedDB-backed storage; falls back to memory (with a warning banner) if IndexedDB is unavailable. */
export const idbStorage: StateStorage = {
  getItem: async (name) => {
    try {
      return ((await get(name)) as string | undefined) ?? null
    } catch {
      return mem.get(name) ?? null
    }
  },
  setItem: async (name, value) => {
    try {
      await set(name, value)
    } catch {
      mem.set(name, value)
      useUi.getState().set({ storageWarning: true })
    }
  },
  removeItem: async (name) => {
    mem.delete(name)
    try {
      await del(name)
    } catch {
      /* ignore */
    }
  },
}
