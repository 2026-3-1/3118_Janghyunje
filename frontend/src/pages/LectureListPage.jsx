import { useEffect, useState } from 'react'
import useLectureStore from '../store/useLectureStore'
import LectureCard from '../components/LectureCard'
import SearchFilter from '../components/SearchFilter'
import { LoadingScreen, EmptyState, Pagination } from '../components/ui'
import { SORT_LIST } from '../constants/games'

const PAGE_SIZE = 10

export default function LectureListPage() {
  const { lectures, loading, fetchLectures, filter, setFilter, resetFilter } = useLectureStore()
  const [page, setPage] = useState(1)

  useEffect(() => { fetchLectures() }, [])
  useEffect(() => { setPage(1) }, [lectures.length])

  const totalPages = Math.ceil(lectures.length / PAGE_SIZE)
  const paginated = lectures.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleReset = () => {
    resetFilter()
    setTimeout(() => fetchLectures(), 0)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <SearchFilter showSort />

      {/* 결과 헤더 */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-[#8892a4]">
          <span className="text-gray-900 dark:text-white font-semibold">{lectures.length}</span>개의 강의
        </p>
        <select
          value={filter.sort}
          onChange={e => { setFilter('sort', e.target.value); setTimeout(() => fetchLectures(), 0) }}
          className="bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-[#2a2d3e] rounded-lg px-3 py-1.5 text-sm text-gray-600 dark:text-[#8892a4] outline-none focus:border-brand-400 cursor-pointer"
        >
          {SORT_LIST.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {loading ? (
        <LoadingScreen />
      ) : paginated.length === 0 ? (
        <EmptyState
          title="조건에 맞는 강의가 없어요"
          description="다른 게임이나 티어로 검색해보세요."
          action={{ label: '필터 초기화', onClick: handleReset }}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {paginated.map(lecture => (
              <LectureCard key={lecture.id} lecture={lecture} />
            ))}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
