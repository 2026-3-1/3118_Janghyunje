import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import useAuthStore from '../store/useAuthStore'
import { LoadingScreen, EmptyState } from '../components/ui'

export default function LectureQnAPage() {
  const { lectureId } = useParams()
  const navigate      = useNavigate()
  const { user }      = useAuthStore()

  const [posts, setPosts]     = useState([])
  const [lecture, setLecture] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all') // all | unsolved | solved
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState({ title: '', content: '' })
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast]           = useState({ msg: '', type: '' })

  const showToast = (msg, type = 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '', type: '' }), 3000)
  }

  const load = async () => {
    try {
      const params = filter !== 'all' ? `?solved=${filter === 'solved' ? 1 : 0}` : ''
      const [lRes, qRes] = await Promise.all([
        api.get(`/lectures/${lectureId}`),
        api.get(`/lectures/${lectureId}/qna${params}`)
      ])
      setLecture(lRes.data.data)
      setPosts(qRes.data.data || [])
    } catch (err) {
      if (err.response?.status === 403) {
        showToast('수강 중인 강의의 Q&A만 볼 수 있습니다.')
        navigate(`/lectures/${lectureId}`)
      }
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [lectureId, filter])

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.content.trim()) { showToast('제목과 내용을 입력해주세요.'); return }
    setSubmitting(true)
    try {
      await api.post(`/lectures/${lectureId}/qna`, form)
      showToast('질문이 등록됐습니다!', 'success')
      setForm({ title: '', content: '' })
      setShowForm(false)
      load()
    } catch (err) { showToast(err.response?.data?.message || '등록에 실패했습니다.') }
    finally { setSubmitting(false) }
  }

  if (loading) return <LoadingScreen />

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
      {toast.msg && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium whitespace-nowrap
          ${toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'}`}>
          {toast.type === 'success' ? '✓ ' : '⚠️ '}{toast.msg}
        </div>
      )}

      {/* 헤더 */}
      <div>
        <button onClick={() => navigate(`/lectures/${lectureId}/contents`)}
          className="text-xs text-gray-400 hover:text-brand-500 transition-colors mb-2 block">
          ← 강의로 돌아가기
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">💬 Q&A 게시판</h1>
            <p className="text-sm text-gray-400 dark:text-[#6b7280] mt-0.5 line-clamp-1">{lecture?.title}</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-xl transition-colors">
            + 질문하기
          </button>
        </div>
      </div>

      {/* 질문 작성 폼 */}
      {showForm && (
        <div className="bg-white dark:bg-[#13161e] border border-brand-200 dark:border-brand-700/50 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-gray-800 dark:text-white">새 질문 작성</h3>
          <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            placeholder="질문 제목을 입력하세요"
            className="w-full bg-gray-50 dark:bg-[#0d0f14] border border-gray-200 dark:border-[#2a2d3e] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-400 text-gray-800 dark:text-slate-200 placeholder:text-gray-300" />
          <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
            placeholder="질문 내용을 자세히 작성해주세요." rows={5}
            className="w-full bg-gray-50 dark:bg-[#0d0f14] border border-gray-200 dark:border-[#2a2d3e] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-400 resize-none text-gray-800 dark:text-slate-200 placeholder:text-gray-300" />
          <div className="flex gap-2">
            <button onClick={handleSubmit} disabled={submitting}
              className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white text-sm font-semibold rounded-xl transition-colors">
              {submitting ? '등록 중...' : '질문 등록'}
            </button>
            <button onClick={() => { setShowForm(false); setForm({ title: '', content: '' }) }}
              className="px-4 py-2.5 border border-gray-200 dark:border-[#2a2d3e] text-gray-500 text-sm rounded-xl hover:border-gray-400 transition-colors">
              취소
            </button>
          </div>
        </div>
      )}

      {/* 필터 탭 */}
      <div className="flex gap-2">
        {[
          { key: 'all',      label: '전체' },
          { key: 'unsolved', label: '미해결' },
          { key: 'solved',   label: '해결됨' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${filter === f.key ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-[#1a1d2e] text-gray-500 hover:text-gray-700 dark:hover:text-white'}`}>
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400 self-center">총 {posts.length}개</span>
      </div>

      {/* Q&A 목록 */}
      {posts.length === 0 ? (
        <EmptyState title="아직 질문이 없어요" description="첫 번째 질문을 남겨보세요!" />
      ) : (
        <div className="space-y-2">
          {posts.map(p => (
            <div key={p.id} onClick={() => navigate(`/lectures/${lectureId}/qna/${p.id}`)}
              className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-xl p-4 cursor-pointer hover:border-brand-400 dark:hover:border-brand-500/60 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {p.is_solved ? (
                      <span className="text-xs px-2 py-0.5 rounded-md bg-green-100 dark:bg-green-900/30 text-green-600 font-medium">✓ 해결됨</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-900/30 text-orange-600 font-medium">미해결</span>
                    )}
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium
                      ${p.author_role === 'coach' ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600' : 'bg-gray-100 dark:bg-[#2a2d3e] text-gray-500'}`}>
                      {p.author_role === 'coach' ? '👑 코치' : '🎮 수강생'}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white line-clamp-1">{p.title}</p>
                  <p className="text-xs text-gray-400 dark:text-[#6b7280]">
                    {p.author_nickname} · {new Date(p.created_at).toLocaleDateString('ko-KR')} · 조회 {p.view_count}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-400">💬 {p.comment_count}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
