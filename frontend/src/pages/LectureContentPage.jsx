import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import useAuthStore from '../store/useAuthStore'
import { LoadingScreen, EmptyState } from '../components/ui'

export default function LectureContentPage() {
  const { lectureId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [lecture, setLecture]     = useState(null)
  const [contents, setContents]   = useState([])
  const [selected, setSelected]   = useState(null)
  const [comments, setComments]   = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading]     = useState(true)
  const [commenting, setCommenting] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get(`/lectures/${lectureId}`),
      api.get(`/lectures/${lectureId}/contents`),
    ]).then(([lRes, cRes]) => {
      setLecture(lRes.data.data)
      const list = cRes.data.data || []
      setContents(list)
      if (list.length > 0) setSelected(list[0])
    }).catch(() => navigate('/lectures'))
      .finally(() => setLoading(false))
  }, [lectureId])

  useEffect(() => {
    if (!selected) return
    api.get(`/contents/${selected.id}/comments`)
      .then(res => setComments(res.data.data || []))
      .catch(() => {})
  }, [selected])

  const handleSelectContent = (c) => {
    setSelected(c)
    setNewComment('')
  }

  const handleComment = async () => {
    if (!user) { alert('로그인 후 댓글을 작성할 수 있습니다.'); return }
    if (!newComment.trim()) return
    setCommenting(true)
    try {
      const res = await api.post(`/contents/${selected.id}/comments`, {
        user_id: user.id,
        comment: newComment.trim(),
      })
      setComments(prev => [...prev, res.data.data])
      setNewComment('')
    } catch (err) {
      alert(err.response?.data?.message || '댓글 작성에 실패했습니다.')
    } finally {
      setCommenting(false)
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return
    try {
      await api.delete(`/comments/${commentId}`)
      setComments(prev => prev.filter(c => c.id !== commentId))
    } catch {}
  }

  if (loading) return <LoadingScreen />

  return (
    <div className="flex h-[calc(100vh-52px-60px)] overflow-hidden">

      {/* 사이드바 — 강의 목록 */}
      <aside className="w-72 shrink-0 bg-white dark:bg-[#13161e] border-r border-gray-100 dark:border-[#1e2235] flex flex-col overflow-hidden">
        <div className="px-4 py-4 border-b border-gray-100 dark:border-[#1e2235]">
          <button onClick={() => navigate(`/lectures/${lectureId}`)}
            className="text-xs text-gray-400 dark:text-[#6b7280] hover:text-brand-500 transition-colors mb-2 flex items-center gap-1">
            ← 강의 상세로
          </button>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2">{lecture?.title}</h2>
          <p className="text-xs text-gray-400 dark:text-[#6b7280] mt-1">{contents.length}개 강의</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {contents.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400 dark:text-[#6b7280]">
              등록된 강의가 없습니다.
            </div>
          ) : (
            contents.map((c, idx) => (
              <button key={c.id} onClick={() => handleSelectContent(c)}
                className={`w-full text-left px-4 py-3.5 border-b border-gray-50 dark:border-[#1e2235] transition-colors
                  ${selected?.id === c.id
                    ? 'bg-brand-50 dark:bg-[#1e2a4a] border-l-2 border-l-brand-500'
                    : 'hover:bg-gray-50 dark:hover:bg-[#1a1d2e]'
                  }`}>
                <div className="flex items-start gap-2.5">
                  <span className={`text-xs font-bold mt-0.5 shrink-0
                    ${selected?.id === c.id ? 'text-brand-500' : 'text-gray-400 dark:text-[#6b7280]'}`}>
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium line-clamp-2 leading-snug
                      ${selected?.id === c.id ? 'text-brand-600 dark:text-brand-400' : 'text-gray-700 dark:text-slate-300'}`}>
                      {c.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium
                        ${c.type === 'video'
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400'
                          : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                        }`}>
                        {c.type === 'video' ? '▶ 영상' : '📄 자료'}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#0d0f14]">
        {!selected ? (
          <div className="flex items-center justify-center h-full">
            <EmptyState title="강의를 선택해주세요" description="왼쪽 목록에서 강의를 클릭하세요." />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">

            {/* 영상 플레이어 */}
            {selected.type === 'video' && (
              <div className="rounded-xl overflow-hidden bg-black aspect-video">
                <iframe
                  src={selected.url}
                  title={selected.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            {/* 자료 링크 */}
            {selected.type === 'material' && (
              <div className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-xl p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-2xl shrink-0">
                  📄
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">{selected.title}</p>
                  <p className="text-xs text-gray-400 dark:text-[#6b7280] mt-0.5 truncate">{selected.url}</p>
                </div>
                <a href={selected.url} target="_blank" rel="noopener noreferrer"
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-lg transition-colors shrink-0">
                  열기
                </a>
              </div>
            )}

            {/* 강의 정보 */}
            <div className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-xl p-5 space-y-2">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">{selected.title}</h1>
              {selected.description && (
                <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {selected.description}
                </p>
              )}
            </div>

            {/* 댓글 섹션 */}
            <div className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-xl p-5 space-y-4">
              <h2 className="text-sm font-bold text-gray-800 dark:text-white">
                댓글 <span className="text-gray-400 dark:text-[#6b7280] font-normal">{comments.length}</span>
              </h2>

              {/* 댓글 입력 */}
              {user ? (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {user.nickname?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 space-y-2">
                    <textarea
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleComment() }}
                      placeholder="강의에 대한 질문이나 후기를 남겨보세요. (Ctrl+Enter로 등록)"
                      rows={3}
                      className="w-full bg-gray-50 dark:bg-[#0d0f14] border border-gray-200 dark:border-[#2a2d3e] rounded-lg px-3 py-2.5
                                 text-sm text-gray-800 dark:text-slate-200 placeholder:text-gray-300 dark:placeholder:text-[#4a5568]
                                 outline-none focus:border-brand-400 resize-none transition-colors"
                    />
                    <div className="flex justify-end">
                      <button onClick={handleComment} disabled={commenting || !newComment.trim()}
                        className="px-4 py-1.5 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white text-sm font-semibold rounded-lg transition-colors">
                        {commenting ? '등록 중...' : '댓글 등록'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-[#0d0f14] rounded-xl px-4 py-3 text-sm text-gray-500 dark:text-[#6b7280] text-center">
                  <button onClick={() => navigate('/login')} className="text-brand-500 hover:underline font-medium">
                    로그인
                  </button>
                  {' '}후 댓글을 작성할 수 있습니다.
                </div>
              )}

              {/* 댓글 목록 */}
              <div className="space-y-3 pt-2">
                {comments.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-[#6b7280] text-center py-4">첫 댓글을 남겨보세요!</p>
                ) : comments.map(c => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-[#2a2d3e] flex items-center justify-center text-xs font-bold text-gray-600 dark:text-slate-300 shrink-0">
                      {c.nickname?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-800 dark:text-white">{c.nickname}</span>
                        <span className="text-xs text-gray-400 dark:text-[#6b7280]">
                          {new Date(c.created_at).toLocaleDateString('ko-KR')}
                        </span>
                        {user?.id === c.user_id && (
                          <button onClick={() => handleDeleteComment(c.id)}
                            className="ml-auto text-xs text-gray-300 dark:text-[#4a5568] hover:text-red-500 transition-colors">
                            삭제
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                        {c.comment}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
