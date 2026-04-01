import { TIER_LIST, POSITION_LIST, SORT_LIST, COACH_TYPE_LIST } from '../constants/games'
import useLectureStore from '../store/useLectureStore'

export default function SearchFilter({ showSort = false }) {
  const { filter, setFilter, fetchLectures, resetFilter } = useLectureStore()
  const tierOptions = TIER_LIST[filter.game] || TIER_LIST.default

  const handleGameChange = (e) => {
    setFilter('game', e.target.value)
    setFilter('tier', 'all')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    fetchLectures()
  }

  const handleReset = () => {
    resetFilter()
    setTimeout(() => fetchLectures(), 0)
  }

  const toggleCoachType = (value) => {
    setFilter('coachType', filter.coachType === value ? 'all' : value)
    setTimeout(() => fetchLectures(), 0)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* 검색 + 태그 필터 */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* 검색박스 */}
        <div className="flex items-center gap-2 bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-[#2a2d3e] rounded-lg px-3 py-2 flex-1 min-w-[180px] focus-within:border-brand-400 transition-colors">
          <span className="text-gray-300 dark:text-[#4a5568] text-sm">🔍</span>
          <input
            type="text"
            placeholder="강의 검색..."
            value={filter.keyword}
            onChange={e => setFilter('keyword', e.target.value)}
            className="bg-transparent text-sm text-gray-700 dark:text-slate-200 placeholder:text-gray-300 dark:placeholder:text-[#4a5568] outline-none w-full"
          />
        </div>

        {/* 코치 타입 태그 */}
        {COACH_TYPE_LIST.map(ct => (
          <button
            key={ct.value}
            type="button"
            onClick={() => toggleCoachType(ct.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors
              ${filter.coachType === ct.value ? ct.color : 'bg-white dark:bg-[#1a1d2e] border-gray-200 dark:border-[#2a2d3e] text-gray-500 dark:text-[#8892a4] hover:border-brand-400'}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${ct.dot}`} />
            {ct.label}
          </button>
        ))}
      </div>

      {/* 셀렉트 필터들 */}
      <div className="flex flex-wrap gap-2 items-center">
        <select value={filter.tier} onChange={e => setFilter('tier', e.target.value)}
          className="bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-[#2a2d3e] rounded-lg px-3 py-1.5 text-sm text-gray-600 dark:text-[#8892a4] outline-none focus:border-brand-400 transition-colors cursor-pointer">
          {tierOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>

        <select value={filter.position} onChange={e => setFilter('position', e.target.value)}
          className="bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-[#2a2d3e] rounded-lg px-3 py-1.5 text-sm text-gray-600 dark:text-[#8892a4] outline-none focus:border-brand-400 transition-colors cursor-pointer">
          {POSITION_LIST.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>

        <div className="flex items-center gap-2 flex-1 min-w-[140px]">
          <span className="text-xs text-gray-400 dark:text-[#6b7280] whitespace-nowrap">
            ~{filter.maxPrice.toLocaleString()}원
          </span>
          <input type="range" min={0} max={100000} step={5000}
            value={filter.maxPrice}
            onChange={e => setFilter('maxPrice', Number(e.target.value))}
            className="flex-1 accent-brand-500" />
        </div>

        {showSort && (
          <select value={filter.sort} onChange={e => { setFilter('sort', e.target.value); setTimeout(() => fetchLectures(), 0) }}
            className="bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-[#2a2d3e] rounded-lg px-3 py-1.5 text-sm text-gray-600 dark:text-[#8892a4] outline-none focus:border-brand-400 transition-colors cursor-pointer ml-auto">
            {SORT_LIST.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        )}

        <button type="submit"
          className="px-4 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-lg transition-colors">
          검색
        </button>
        <button type="button" onClick={handleReset}
          className="px-3 py-1.5 bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-[#2a2d3e] text-gray-500 dark:text-[#8892a4] text-sm rounded-lg hover:border-brand-400 transition-colors">
          초기화
        </button>
      </div>
    </form>
  )
}
