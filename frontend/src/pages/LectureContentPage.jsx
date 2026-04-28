import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import useAuthStore from '../store/useAuthStore'
import { LoadingScreen, EmptyState } from '../components/ui'

// YouTube IFrame API 로드 (전역 1회)
function loadYouTubeAPI() {
  if (window.YT && window.YT.Player) return Promise.resolve()
  return new Promise((resolve) => {
    if (document.getElementById('yt-iframe-api')) {
      const prev = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => { prev?.(); resolve() }
      return
    }
    window.onYouTubeIframeAPIReady = resolve
    const tag = document.createElement('script')
    tag.id  = 'yt-iframe-api'
    tag.src = 'https://www.youtube.com/iframe_api'
    document.body.appendChild(tag)
  })
}

function extractVideoId(url) {
  if (!url) return null
  const embedMatch = url.match(/youtube\.com\/embed\/([^?&]+)/)
  if (embedMatch) return embedMatch[1]
  const watchMatch = url.match(/[?&]v=([^?&]+)/)
  if (watchMatch) return watchMatch[1]
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/)
  if (shortMatch) return shortMatch[1]
  return null
}

// 다음 강의 이동 모달
function NextContentModal({ nextContent, onNext, onClose }) {
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); onNext(); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
      <div className="bg-white dark:bg-[#13161e] rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">강의 완료! 🎉</h3>
          <button onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors text-lg">✕</button>
        </div>

        <div className="bg-brand-50 dark:bg-[#1e2a4a] rounded-xl p-4 space-y-1">
          <p className="text-xs text-gray-400 dark:text-[#6b7280]">다음 강의</p>
          <p className="text-sm font-semibold text-gray-800 dark:text-white line-clamp-2">{nextContent.title}</p>
        </div>

        {/* 카운트다운 원형 */}
        <div className="flex items-center justify-center py-2">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28"
                fill="none" stroke="currentColor"
                className="text-gray-100 dark:text-[#2a2d3e]" strokeWidth="4" />
              <circle cx="32" cy="32" r="28"
                fill="none" stroke="currentColor"
                className="text-brand-500 transition-all duration-1000"
                strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - countdown / 10)}`}
                strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-lg font-extrabold text-brand-500">
              {countdown}
            </span>
          </div>
        </div>
        <p className="text-xs text-center text-gray-400 dark:text-[#6b7280]">
          {countdown}초 후 자동으로 다음 강의로 이동합니다
        </p>

        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 bg-gray-100 dark:bg-[#1a1d2e] text-gray-600 dark:text-slate-300 font-semibold text-sm rounded-xl hover:bg-gray-200 transition-colors">
            머무르기
          </button>
          <button onClick={onNext}
            className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm rounded-xl transition-colors">
            다음 강의 →
          </button>
        </div>
      </div>
    </div>
  )
}

export default function LectureContentPage() {
  const { lectureId } = useParams()
  const navigate      = useNavigate()
  const { user }      = useAuthStore()

  const [lecture, setLecture]       = useState(null)
  const [contents, setContents]     = useState([])
  const [selected, setSelected]     = useState(null)
  const [comments, setComments]     = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading]       = useState(true)
  const [commenting, setCommenting] = useState(false)

  const [progressMap, setProgressMap]         = useState({})
  const [lectureProgress, setLectureProgress] = useState(null)

  // 다음 강의 모달
  const [nextModal, setNextModal] = useState(null)  // nextContent 객체
  const completedNotifiedRef = useRef(new Set())    // 이미 모달 띄운 content id

  const playerRef     = useRef(null)
  const playerDivRef  = useRef(null)
  const saveTimerRef  = useRef(null)
  const selectedRef   = useRef(null)
  const contentsRef   = useRef([])
  selectedRef.current = selected
  contentsRef.current = contents

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

  const saveProgress = useCallback(async (contentId, watchedSec, durationSec) => {
    if (!contentId || !durationSec) return
    try {
      const res = await api.post('/progress', {
        content_id:   contentId,
        lecture_id:   Number(lectureId),
        watched_sec:  Math.floor(watchedSec),
        duration_sec: Math.floor(durationSec),
      })
      await loadProgress()

      // 완료 처리됐고 아직 모달 안 띄웠으면 → 다음 강의 모달
      if (res.data.data?.completed === 1 && !completedNotifiedRef.current.has(contentId)) {
        completedNotifiedRef.current.add(contentId)
        const currentList = contentsRef.current
        const currentIdx  = currentList.findIndex(c => c.id === contentId)
        const next        = currentList[currentIdx + 1]
        if (next) setNextModal(next)
      }
    } catch {}
  }, [lectureId, loadProgress])

  const createPlayer = useCallback(async (videoId, startSeconds = 0) => {
    await loadYouTubeAPI()
    if (playerRef.current) {
      try { playerRef.current.destroy() } catch {}
      playerRef.current = null
    }
    if (!playerDivRef.current || !videoId) return

    playerRef.current = new window.YT.Player(playerDivRef.current, {
      videoId,
      playerVars: { autoplay: 0, start: Math.floor(startSeconds), rel: 0, modestbranding: 1 },
      events: {
        onStateChange: (event) => {
          if (event.data === window.YT.PlayerState.PLAYING) {
            clearInterval(saveTimerRef.current)
            saveTimerRef.current = setInterval(() => {
              const player  = playerRef.current
              const content = selectedRef.current
              if (!player || !content) return
              try {
                const cur = player.getCurrentTime()
                const dur = player.getDuration()
                if (dur > 0) saveProgress(content.id, cur, dur)
              } catch {}
            }, 5000)
          } else {
            clearInterval(saveTimerRef.current)
            const player  = playerRef.current
            const content = selectedRef.current
            if (player && content) {
              try {
                const cur = player.getCurrentTime()
                const dur = player.getDuration()
                if (dur > 0) saveProgress(content.id, cur, dur)
              } catch {}
            }
          }
        },
      },
    })
  }, [saveProgress])

  useEffect(() => {
    Promise.all([
      api.get(`/lectures/${lectureId}`),
      api.get(`/lectures/${lectureId}/contents`),
    ]).then(async ([lRes, cRes]) => {
      setLecture(lRes.data.data)
      const list = cRes.data.data || []
      setContents(list)
      await loadProgress()
      const savedId      = localStorage.getItem(`last_content_${lectureId}`)
      const savedContent = savedId ? list.find(c => c.id === Number(savedId)) : null
      setSelected(savedContent || list[0] || null)
    }).catch(() => navigate('/lectures'))
      .finally(() => setLoading(false))
  }, [lectureId])

  useEffect(() => {
    if (!selected) return
    localStorage.setItem(`last_content_${lectureId}`, selected.id)
    api.get(`/contents/${selected.id}/comments`)
      .then(res => setComments(res.data.data || []))
      .catch(() => {})

    if (selected.type === 'video') {
      const videoId = extractVideoId(selected.url)
      if (videoId) {
        const prog    = progressMap[selected.id]
        const startAt = (prog && prog.duration_sec > 0 && !prog.completed)
          ? Math.max(0, prog.watched_sec - 2)
          : 0
        setTimeout(() => createPlayer(videoId, startAt), 100)
      }
    }
    return () => { clearInterval(saveTimerRef.current) }
  }, [selected?.id])

  useEffect(() => {
    return () => {
      clearInterval(saveTimerRef.current)
      if (playerRef.current) {
        try { playerRef.current.destroy() } catch {}
      }
    }
  }, [])

  const handleSelectContent = (c) => {
    setNextModal(null)
    setSelected(c)
    setNewComment('')
  }

  const handleNextContent = () => {
    setNextModal(null)
    if (nextModal) handleSelectContent(nextModal)
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

  if (loading) return <LoadingScreen />

  const currentProgress = selected ? progressMap[selected.id] : null

  return (
    <div className="flex h-[calc(100vh-52px-60px)] overflow-hidden">

      {/* 다음 강의 모달 */}
      {nextModal && (
        <NextContentModal
          nextContent={nextModal}
          onNext={handleNextContent}
          onClose={() => setNextModal(null)}
        />
      )}

      {/* 사이드바 */}
      <aside className="w-72 shrink-0 bg-white dark:bg-[#13161e] border-r border-gray-100 dark:border-[#1e2235] flex flex-col overflow-hidden">
        <div className="px-4 py-4 border-b border-gray-100 dark:border-[#1e2235]">
          <button onClick={() => navigate(`/lectures/${lectureId}`)}
            className="text-xs text-gray-400 dark:text-[#6b7280] hover:text-brand-500 transition-colors mb-2 flex items-center gap-1">
            ← 강의 상세로
          </button>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2">{lecture?.title}</h2>
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
                <p className="text-[10px] text-green-500">✓ 리뷰 작성 가능 (60% 이상)</p>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {contents.map((c, idx) => {
            const prog       = progressMap[c.id]
            const isDone     = prog?.completed === 1
            const watchedPct = (prog && prog.duration_sec > 0)
              ? Math.min((prog.watched_sec / prog.duration_sec) * 100, 100)
              : 0

            return (
              <button key={c.id} onClick={() => handleSelectContent(c)}
                className={`w-full text-left px-4 py-3.5 border-b border-gray-50 dark:border-[#1e2235] transition-colors
                  ${selected?.id === c.id
                    ? 'bg-brand-50 dark:bg-[#1e2a4a] border-l-2 border-l-brand-500'
                    : 'hover:bg-gray-50 dark:hover:bg-[#1a1d2e]'}`}>
                <div className="flex items-start gap-2.5">
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
                      {!isDone && watchedPct > 0 && (
                        <div className="flex-1 h-1 bg-gray-100 dark:bg-[#2a2d3e] rounded-full overflow-hidden">
                          <div className="h-full bg-brand-400 rounded-full"
                            style={{ width: `${watchedPct}%` }} />
                        </div>
                      )}
                    </div>
                    {!isDone && prog?.watched_sec > 5 && (
                      <p className="text-[10px] text-brand-400 mt-0.5">
                        ▶ {Math.floor(prog.watched_sec / 60)}:{String(Math.floor(prog.watched_sec % 60)).padStart(2, '0')} 이어보기
                      </p>
                    )}
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

            {selected.type === 'video' && (
              <div className="rounded-xl overflow-hidden bg-black aspect-video">
                <div ref={playerDivRef} className="w-full h-full" />
              </div>
            )}

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
                    <textarea value={newComment} onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleComment() }}
                      placeholder="질문이나 후기를 남겨보세요. (Ctrl+Enter)" rows={3}
                      className="w-full bg-gray-50 dark:bg-[#0d0f14] border border-gray-200 dark:border-[#2a2d3e] rounded-lg px-3 py-2.5
                                 text-sm text-gray-800 dark:text-slate-200 placeholder:text-gray-300 dark:placeholder:text-[#4a5568]
                                 outline-none focus:border-brand-400 resize-none transition-colors" />
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
