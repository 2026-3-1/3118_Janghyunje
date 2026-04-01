import { create } from 'zustand'
import { getLectures } from '../services/lectureService'

const useLectureStore = create((set, get) => ({
  lectures: [],
  loading: false,
  error: null,

  filter: {
    game: 'all',
    tier: 'all',
    maxPrice: 100000,
    keyword: '',
    coachType: 'all',
    position: 'all',
    sort: 'ranking',
  },

  setFilter: (key, value) =>
    set(state => ({ filter: { ...state.filter, [key]: value } })),

  resetFilter: () =>
    set({ filter: { game: 'all', tier: 'all', maxPrice: 100000, keyword: '', coachType: 'all', position: 'all', sort: 'ranking' } }),

  fetchLectures: async () => {
    set({ loading: true, error: null })
    try {
      const data = await getLectures(get().filter)
      set({ lectures: data, loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },
}))

export default useLectureStore
