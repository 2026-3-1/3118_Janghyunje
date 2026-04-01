import { create } from 'zustand'

const useThemeStore = create((set) => ({
  dark: localStorage.getItem('theme') === 'dark',

  toggle: () => set((state) => {
    const next = !state.dark
    if (next) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
    return { dark: next }
  }),
}))

export default useThemeStore
