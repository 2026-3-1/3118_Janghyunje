import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useLectureStore from '../store/useLectureStore'
import LectureCard from '../components/LectureCard'
import SearchFilter from '../components/SearchFilter'
import { LoadingScreen, EmptyState } from '../components/ui'

const TABS = [
  { value: 'ranking', label: '인기 강의' },
  { value: 'newest',  label: '신규 강의' },
  { value: 'rating',  label: '평점 높은' },
]

export default function MainPage() {
  const navigate = useNavigate()
  const { lectures, loading, fetchLectures, resetFilter } = useLectureStore()
  const [activeTab, setActiveTab] = useState('ranking')
  const [keyword, setKeyword] = useState('')

  useEffect(() => { fetchLectures() }, [])

  // 탭 + 실시간 키워드 필터링
  const filtered = lectures
    .filter(l => {
      if (!keyword) return true
      return l.title.includes(keyword) || l.coach.nickname.includes(keyword)
    })
    .sort((a, b) => {
      if (activeTab === 'newest') return new Date(b.createdAt) - new Date(a.createdAt)
      if (activeTab === 'rating') return b.rating - a.rating
      return b.enrollCount - a.enrollCount
    })
    .slice(0, 10)

  const handleReset = () => {
    resetFilter()
    setKeyword('')
    setTimeout(() => fetchLectures(), 0)
  }

  // 최근 본 강의 (localStorage)
  const recentIds = JSON.parse(localStorage.getItem('recentLectures') || '[]')
  const recentLectures = lectures.filter(l => recentIds.includes(l.id))

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-10">

      {/* ── 히어로 배너 ── */}
      <section className="bg-gradient-to-r from-brand-500 to-brand-700 rounded-2xl p-7 text-white">
        <div className="text-xs font-semibold bg-white/20 w-fit px-3 py-1 rounded-full mb-3">
          🎮 게임 코칭 매칭 플랫폼
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold mb-2 leading-snug">
          나만을 위한 맞춤형 강의로<br />특별한 학습을 시작하세요
        </h1>
        <p className="text-white/70 text-sm mb-5">
          검증된 코치와 함께 게임 실력을 빠르게 올리세요
        </p>

        {/* 실시간 검색바 */}
        <div className="flex items-center gap-2 bg-white/15 border border-white/30 rounded-xl px-4 py-2.5 max-w-md mb-5 focus-within:bg-white/20 transition-colors">
          <span className="text-white/60 text-sm">🔍</span>
          <input
            type="text"
            placeholder="강의명, 코치명으로 검색..."
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            className="bg-transparent text-white placeholder:text-white/50 text-sm outline-none flex-1"
          />
          {keyword && (
            <button onClick={() => setKeyword('')} className="text-white/60 hover:text-white text-xs transition-colors">
              ✕
            </button>
          )}
        </div>

        {/* 통계 */}
        <div className="flex gap-6 text-sm">
          {[['461', '강의'], ['120+', '코치'], ['12,000+', '수강생']].map(([v, l]) => (
            <div key={l}>
              <span className="font-bold text-base">{v}</span>
              <span className="text-white/60 ml-1">{l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 최근 본 강의 ── */}
      {recentLectures.length > 0 && (
        <section>
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">최근 본 강의</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {recentLectures.slice(0, 5).map(lecture => (
              <LectureCard key={lecture.id} lecture={lecture} />
            ))}
          </div>
        </section>
      )}

      {/* ── 강의 목록 (탭) ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          {/* 탭 */}
          <div className="flex gap-1 bg-gray-100 dark:bg-[#1a1d2e] p-1 rounded-xl">
            {TABS.map(tab => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors
                  ${activeTab === tab.value
                    ? 'bg-white dark:bg-[#0d0f14] text-brand-500 shadow-sm'
                    : 'text-gray-500 dark:text-[#8892a4] hover:text-gray-700 dark:hover:text-white'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => navigate('/lectures')}
            className="text-sm text-brand-500 hover:text-brand-600 transition-colors"
          >
            전체 보기 →
          </button>
        </div>

        {/* 검색 필터 */}
        <div className="mb-4">
          <SearchFilter />
        </div>

        {/* 결과 수 */}
        {!loading && (
          <p className="text-xs text-gray-400 dark:text-[#6b7280] mb-3">
            {keyword
              ? <><span className="text-gray-700 dark:text-white font-medium">"{keyword}"</span> 검색 결과 {filtered.length}개</>
              : <><span className="text-gray-700 dark:text-white font-medium">{filtered.length}</span>개의 강의</>
            }
          </p>
        )}

        {loading ? (
          <LoadingScreen />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={keyword ? `"${keyword}" 검색 결과가 없어요` : '조건에 맞는 강의가 없어요'}
            description="다른 게임이나 티어로 검색해보세요."
            action={{ label: '초기화', onClick: handleReset }}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {filtered.map(lecture => (
              <LectureCard key={lecture.id} lecture={lecture} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
