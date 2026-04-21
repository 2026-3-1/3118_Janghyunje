import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import useAuthStore from '../store/useAuthStore'
import { LoadingScreen, EmptyState } from '../components/ui'

export default function LectureContentPage() {
  const { lectureId } = useParams()
  const navigate      = useNavigate()
  const { user }      = useAuthStore()

  const [lecture, setLecture]     = useState(null)
  const [contents, setContents]   = useState([])
  const [selected, setSelected]   = useState(null)
  const [comments, setComments]   = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading]     = useState(true)
  const [commenting, setCommenting] = useState(false)

  // 진도율
  const [progressMap, setProgressMap]   = useState({})  // { contentId: { watched_sec, completed } }
  const [lectureProgress, setLectureProgress] = useState(null)  // { percent, can_review }
  const saveTimer = useRef(null)

  // 유튜브 iframe에서 postMessage로 진도 받기
  const iframeRef = useRef(null)

  const loadProgress = useCallback(async () => {
    try {
      const res = await api.get(`/progress/${lectureId}`)
      const data = res.data.data
      setLectureProgress(data)
      const map = {}
      data.items.forEach(item => { map[item.content_id] = item })
      setProgressMap(map)
    } catch {}
  }, [lectureId])

  useEffect(() => {
    Promise.all([
      api.get(`/lectures/${lectureId}`),
      api.get(`/lectures/${lectureId}/contents`),
    ]).then(async ([lRes, cRes]) => {
      setLecture(lRes.data.data)
      const list = cRes.data.data || []
      setContents(list)

      await loadProgress()

      // 이어보기: 마지막으로 보던 콘텐츠 복원 (미완료 중 첫 번째)
      const saved = localStorage.getItem(`last_content_${lectureId}`)
      const savedContent = saved ? list.find(c => c.id === Number(saved)) : null
      setSelected(savedContent || list[0] || null)
    }).catch(() => navigate('/lectures'))
      .finally(() => setLoading(false))
  }, [lectureId])

  useEffect(() => {
    if (!selected) return
    api.get(`/contents/${selected.id}/comments`)
      .then(res => setComments(res.data.data || []))
      .catch(() => {})
    // 마지막 시청 콘텐츠 저장
    localStorage.setItem(`last_content_${lectureId}`, selected.id)
  }, [selected])

  // YouTube 진도 저장 (postMessage 기반)
  useEffect(() => {
    const handler = (e) => {
      if (!e.data || typeof e.data !== 'string') return
      try {
        const msg = JSON.parse(e.data)
        if (msg.event === 'infoDelivery' && msg.info && selected) {
          const { currentTime, duration } = msg.info
          if (!currentTime || !duration) return

          clearTimeout(saveTimer.current)
          saveTimer.current = setTimeout(() => {
            api.post('/progress', {
              content_id:   selected.id,
              lecture_id:   Number(lectureId),
              watched_sec:  Math.floor(currentTime),
              duration_sec: Math.floor(duration),
            }).then(res => {
              if (res.data.data?.completed) loadProgress()
            }).catch(() => {})
          }, 5000)  // 5초마다 저장
        }
      } catch {}
    }
    window.addEventListener('message', handler)
    return () => { window.removeEventListener('message', handler); clearTimeout(saveTimer.current) }
  }, [selected, lectureId])

  const handleSelectContent = (c) => {
    setSelected(c)
    setNewComment('')
  }

  const handleComment = async () => {
    if (!newComment.trim()) return
    setCommenting(true)
    try {
      const res = await api.post(`/contents/${selected.id}/comments`, { comment: newComment.trim() })
      setComments(prev => [...prev, res.data.data])
      setNewComment('')
    } catch (err) {
      alert(err.response?.data?.message || '댓글 작성에 실패했습니다.')
    } finally { setCommenting(false) }
  }

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return
    try {
      await api.delete(`/comments/${commentId}`)
      setComments(prev => prev.filter(c => c.id !== commentId))
    } catch {}
  }

  // YouTube embed URL에 JS API 활성화 파라미터 추가
  const getEmbedUrl = (url) => {
    if (!url) return url
    const sep = url.includes('?') ? '&' : '?'
    return `${url}${sep}enablejsapi=1&origin=${window.location.origin}`
  }

  if (loading) return <LoadingScreen />

  const currentProgress = selected ? progressMap[selected.id] : null

  return (
    <div className="flex h-[calc(100vh-52px-60px)] overflow-hidden">

      {/* 사이드바 */}
      <aside className="w-72 shrink-0 bg-white dark:bg-[#13161e] border-r border-gray-100 dark:border-[#1e2235] flex flex-col overflow-hidden">
        <div className="px-4 py-4 border-b border-gray-100 dark:border-[#1e2235]">
          <button onClick={() => navigate(`/lectures/${lectureId}`)}
            className="text-xs text-gray-400 dark:text-[#6b7280] hover:text-brand-500 transition-colors mb-2 flex items-center gap-1">
            ← 강의 상세로
          </button>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2">{lecture?.title}</h2>
          {/* 전체 진도율 */}
          {lectureProgress && (
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs text-gray-400 dark:text-[#6b7280]">
                <span>전체 진도</span>
                <span>{lectureProgress.done}/{lectureProgress.total} ({lectureProgress.percent}%)</span>
              </div>
              <div className="h-1.5 bg-gray-100 dark:bg-[#1a1d2e] rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full transition-all"
                  style={{ width: `${lectureProgress.percent}%` }} />
              </div>
              {lectureProgress.can_review && (
                <p className="text-[10px] text-green-500">✓ 리뷰 작성 가능</p>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {contents.map((c, idx) => {
            const prog = progressMap[c.id]
            const isDone = prog?.completed === 1
            return (
              <button key={c.id} onClick={() => handleSelectContent(c)}
                className={`w-full text-left px-4 py-3.5 border-b border-gray-50 dark:border-[#1e2235] transition-colors
                  ${selected?.id === c.id
                    ? 'bg-brand-50 dark:bg-[#1e2a4a] border-l-2 border-l-brand-500'
                    : 'hover:bg-gray-50 dark:hover:bg-[#1a1d2e]'}`}>
                <div className="flex items-start gap-2.5">
                  {/* 완료 여부 */}
                  <span className={`text-xs font-bold mt-0.5 shrink-0 w-5 text-center
                    ${isDone ? 'text-green-500' : selected?.id === c.id ? 'text-brand-500' : 'text-gray-400 dark:text-[#6b7280]'}`}>
                    {isDone ? '✓' : String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium line-clamp-2 leading-snug
                      ${selected?.id === c.id ? 'text-brand-600 dark:text-brand-400' : 'text-gray-700 dark:text-slate-300'}`}>
                      {c.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium
                        ${c.type === 'video'
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-500'
                          : 'bg-green-50 dark:bg-green-900/20 text-green-600'}`}>
                        {c.type === 'video' ? '▶ 영상' : '📄 자료'}
                      </span>
                      {/* 진도바 */}
                      {prog && prog.duration_sec > 0 && !isDone && (
                        <div className="flex-1 h-1 bg-gray-100 dark:bg-[#2a2d3e] rounded-full overflow-hidden">
                          <div className="h-full bg-brand-400 rounded-full"
                            style={{ width: `${Math.min((prog.watched_sec / prog.duration_sec) * 100, 100)}%` }} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </aside>

      {/* 메인 */}
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
                  ref={iframeRef}
                  src={getEmbedUrl(selected.url)}
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
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-2xl shrink-0">📄</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">{selected.title}</p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{selected.url}</p>
                </div>
                <a href={selected.url} target="_blank" rel="noopener noreferrer"
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-lg transition-colors shrink-0">
                  열기
                </a>
              </div>
            )}

            {/* 콘텐츠 정보 */}
            <div className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">{selected.title}</h1>
                {currentProgress?.completed === 1 && (
                  <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg font-medium">✓ 완료</span>
                )}
              </div>
              {selected.description && (
                <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">{selected.description}</p>
              )}
            </div>

            {/* 댓글 */}
            <div className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-xl p-5 space-y-4">
              <h2 className="text-sm font-bold text-gray-800 dark:text-white">
                댓글 <span className="text-gray-400 font-normal">{comments.length}</span>
              </h2>
              {user ? (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {user.nickname?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 space-y-2">
                    <textarea
                      value={newComment} onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleComment() }}
                      placeholder="질문이나 후기를 남겨보세요. (Ctrl+Enter로 등록)" rows={3}
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
                <div className="text-sm text-gray-400 text-center py-3">
                  <button onClick={() => navigate('/login')} className="text-brand-500 hover:underline">로그인</button> 후 댓글을 작성할 수 있습니다.
                </div>
              )}
              <div className="space-y-3 pt-2">
                {comments.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">첫 댓글을 남겨보세요!</p>
                ) : comments.map(c => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-[#2a2d3e] flex items-center justify-center text-xs font-bold text-gray-600 dark:text-slate-300 shrink-0">
                      {c.nickname?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-800 dark:text-white">{c.nickname}</span>
                        <span className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString('ko-KR')}</span>
                        {user?.id === c.user_id && (
                          <button onClick={() => handleDeleteComment(c.id)}
                            className="ml-auto text-xs text-gray-300 hover:text-red-500 transition-colors">삭제</button>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">{c.comment}</p>
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
