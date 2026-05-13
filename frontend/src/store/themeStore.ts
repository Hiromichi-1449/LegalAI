import { create } from 'zustand'

interface ThemeStore {
  isDark: boolean
  toggle: () => void
}

function applyTheme(isDark: boolean) {
  document.documentElement.classList.toggle('dark', isDark)
}

// Initialise from localStorage on module load
const saved = localStorage.getItem('legalai-theme') === 'dark'
applyTheme(saved)

export const useThemeStore = create<ThemeStore>((set) => ({
  isDark: saved,
  toggle: () =>
    set((state) => {
      const next = !state.isDark
      localStorage.setItem('legalai-theme', next ? 'dark' : 'light')
      applyTheme(next)
      return { isDark: next }
    }),
}))
