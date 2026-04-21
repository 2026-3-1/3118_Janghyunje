import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user:  JSON.parse(localStorage.getItem('user')  || 'null'),
  token: localStorage.getItem('token') || null,

  // P2: token도 함께 저장
  setUser: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user))
    if (token) localStorage.setItem('token', token)
    set({ user, token: token ?? localStorage.getItem('token') })
  },

  logout: () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    set({ user: null, token: null })
  },
}))

export default useAuthStore
