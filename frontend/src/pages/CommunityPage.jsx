import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import useAuthStore from '../store/useAuthStore'
import { LoadingScreen, EmptyState } from '../components/ui'

const CATEGORIES = [
  { value: '',         label: '전체' },
  { value: 'question', label: '질문' },
  { value: 'tip',      label: '팁 공유' },
]

export default function CommunityPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [posts, setPosts] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [category, setCategory] = useState('')
  const [keyword, setKeyword] = useState('')
  const [inputKeyword, setInputKeyword] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/posts', { params: { category, keyword, page } })
      setPosts(data.data || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
    } catch {
      setPosts([])
    } finally {
      setLoading(false)
    }
  }, [category, keyword, page])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    setKeyword(inputKeyword)
  }

  const handleCategory = (val) => {
    setCategory(val)
    setPage(1)
  }

  const formatDate = (s) => {
    const d = new Date(s)
    const now = new Date()
    const diff = (now - d) / 1000
    if (diff < 60) return '방금 전'
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
    return d.toLocaleDateString('ko-KR')
  }

  return (
    <div className="max-w-3xl px-4 py-8 mx-auto space-y-5">

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">커뮤니티</h1>
          <p className="text-xs text-gray-400 dark:text-[#6b7280] mt-0.5">질문하고 팁을 나눠보세요</p>
        </div>
        {user && (
          <button
            onClick={() => navigate('/community/write')}
            className="px-4 py-2 text-sm font-semibold text-white transition-colors bg-brand-500 hover:bg-brand-600 rounded-xl"
          >
            글쓰기
          </button>
        )}
      </div>

      {/* 카테고리 탭 */}
      <div className="flex gap-1 border-b border-gray-100 dark:border-[#1e2235]">
        {CATEGORIES.map(c => (
          <button key={c.value} onClick={() => handleCategory(c.value)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px
              ${category === c.value
                ? 'border-brand-500 text-brand-500'
                : 'border-transparent text-gray-400 dark:text-[#6b7280] hover:text-gray-700 dark:hover:text-white'
              }`}>
            {c.label}
          </button>
        ))}
      </div>

      {/* 검색 */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={inputKeyword}
          onChange={e => setInputKeyword(e.target.value)}
          placeholder="제목 또는 내용으로 검색..."
          className="flex-1 rounded-xl border border-gray-200 dark:border-[#2a2d3e] bg-white dark:bg-[#13161e]
                     text-gray-800 dark:text-slate-200 text-sm px-4 py-2 outline-none
                     focus:border-brand-400 dark:focus:border-brand-500 transition-colors
                     placeholder:text-gray-300 dark:placeholder:text-[#4a5568]"
        />
        <button type="submit"
          className="px-4 py-2 bg-gray-100 dark:bg-[#1a1d2e] text-gray-600 dark:text-slate-300
                     hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-500
                     text-sm rounded-xl transition-colors border border-gray-200 dark:border-[#2a2d3e]">
          검색
        </button>
      </form>

      {/* 결과 수 */}
      {!loading && (
        <p className="text-xs text-gray-400 dark:text-[#6b7280]">
          총 <span className="font-medium text-gray-700 dark:text-white">{total}</span>개의 게시글
        </p>
      )}

      {/* 목록 */}
      {loading ? <LoadingScreen /> : posts.length === 0 ? (
        <EmptyState
          title="게시글이 없어요"
          description="첫 번째 글을 작성해보세요!"
          action={user ? { label: '글쓰기', onClick: () => navigate('/community/write') } : undefined}
        />
      ) : (
        <div className="space-y-2">
          {posts.map(post => (
            <div key={post.id}
              onClick={() => navigate(`/community/${post.id}`)}
              className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-xl p-4
                         hover:border-brand-400 dark:hover:border-brand-500/60 cursor-pointer transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-md font-medium
                      ${post.category === 'tip'
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                        : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      }`}>
                      {post.category === 'tip' ? '팁' : '질문'}
                    </span>
                    <span className="text-sm font-semibold text-gray-800 truncate dark:text-slate-200">
                      {post.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-[#6b7280]">
                    <span className="flex items-center gap-1">
                      <span className={`w-4 h-4 rounded-full inline-flex items-center justify-center text-[9px] font-bold text-white
                        ${post.role === 'coach' ? 'bg-brand-500' : 'bg-gray-400'}`}>
                        {post.nickname?.[0]?.toUpperCase()}
                      </span>
                      {post.nickname}
                      {post.role === 'coach' && (
                        <span className="bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 px-1 rounded text-[10px]">코치</span>
                      )}
                    </span>
                    <span>{formatDate(post.created_at)}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0 text-xs text-gray-400 dark:text-[#6b7280]">
                  <span>💬 {post.comment_count}</span>
                  <span>👁 {post.view_count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-sm transition-colors
                ${p === page
                  ? 'bg-brand-500 text-white font-medium'
                  : 'bg-gray-100 dark:bg-[#1a1d2e] text-gray-500 dark:text-[#6b7280] hover:bg-brand-50 hover:text-brand-500'
                }`}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
