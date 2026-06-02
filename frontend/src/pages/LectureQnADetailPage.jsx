import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import useAuthStore from '../store/useAuthStore'
import { LoadingScreen } from '../components/ui'
import { notifyQnAReply } from '../utils/notifyService'

export default function LectureQnADetail() {
  const { lectureId, postId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [post, setPost]         = useState(null)
  const [lecture, setLecture]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [isCoach, setIsCoach]   = useState(false)
  const [toast, setToast]       = useState({ msg: '', type: '' })

  const showToast = (msg, type = 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '', type: '' }), 3000)
  }

  const load = async () => {
    try {
      const [lRes, pRes] = await Promise.all([
        api.get(`/lectures/${lectureId}`),
        api.get(`/qna/${postId}`)
      ])
      setLecture(lRes.data.data)
      setPost(pRes.data.data)
      setIsCoach(lRes.data.data.coach_id === user?.id)
    } catch (err) {
      if (err.response?.status === 403) navigate(`/lectures/${lectureId}/qna`)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [postId])

  const handleComment = async () => {
    if (!newComment.trim()) { showToast('내용을 입력해주세요.'); return }
    setSubmitting(true)
    try {
      await api.post(`/qna/${postId}/comments`, { content: newComment.trim() })
      showToast('답변이 등록됐습니다!', 'success')
      setNewComment('')
      load()
      // 코치가 답변 달면 질문자에게 이메일 알림
      if (isCoach) {
        notifyQnAReply(postId)
      }
    } catch (err) { showToast(err.response?.data?.message || '등록에 실패했습니다.') }
    finally { setSubmitting(false) }
  }

  const handleSolve = async (commentId) => {
    try {
      await api.put(`/qna/${postId}/solve/${commentId}`)
      showToast('답변이 채택됐습니다!', 'success')
      load()
    } catch (err) { showToast(err.response?.data?.message || '오류가 발생했습니다.') }
  }

  const handleDeleteComment = async (commentId) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return
    try {
      await api.delete(`/qna-comments/${commentId}`)
      showToast('삭제됐습니다.', 'success')
      load()
    } catch (err) { showToast(err.response?.data?.message || '오류가 발생했습니다.') }
  }

  const handleDeletePost = async () => {
    if (!confirm('질문을 삭제하시겠습니까?')) return
    try {
      await api.delete(`/qna/${postId}`)
      navigate(`/lectures/${lectureId}/qna`)
    } catch (err) { showToast(err.response?.data?.message || '오류가 발생했습니다.') }
  }

  if (loading) return <LoadingScreen />
  if (!post) return null

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
      {toast.msg && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium whitespace-nowrap
          ${toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'}`}>
          {toast.type === 'success' ? '✓ ' : '⚠️ '}{toast.msg}
        </div>
      )}

      <button onClick={() => navigate(`/lectures/${lectureId}/qna`)}
        className="text-xs text-gray-400 hover:text-brand-500 transition-colors">
        ← Q&A 목록으로
      </button>

      <div className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-xl p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {post.is_solved ? (
                <span className="text-xs px-2 py-0.5 rounded-md bg-green-100 dark:bg-green-900/30 text-green-600 font-medium">✓ 해결됨</span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-900/30 text-orange-600 font-medium">미해결</span>
              )}
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium
                ${post.author_role === 'coach' ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600' : 'bg-gray-100 dark:bg-[#2a2d3e] text-gray-500'}`}>
                {post.author_role === 'coach' ? '👑 코치' : '🎮 수강생'}
              </span>
            </div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">{post.title}</h1>
            <p className="text-xs text-gray-400">
              {post.author_nickname} · {new Date(post.created_at).toLocaleDateString('ko-KR')} · 조회 {post.view_count}
            </p>
          </div>
          {(user?.id === post.user_id || isCoach) && (
            <button onClick={handleDeletePost}
              className="text-xs px-3 py-1.5 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0">
              삭제
            </button>
          )}
        </div>
        <div className="border-t border-gray-100 dark:border-[#1e2235] pt-3">
          <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{post.content}</p>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-bold text-gray-700 dark:text-white">
          답변 <span className="text-gray-400 font-normal">{post.comments?.length || 0}개</span>
        </h2>

        {(post.comments || []).map(c => (
          <div key={c.id}
            className={`bg-white dark:bg-[#13161e] border rounded-xl p-4 space-y-2
              ${c.is_answer ? 'border-green-300 dark:border-green-700/50 bg-green-50/30 dark:bg-green-900/10' : 'border-gray-100 dark:border-[#1e2235]'}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {c.is_answer && (
                  <span className="text-xs px-2 py-0.5 rounded-md bg-green-100 dark:bg-green-900/30 text-green-600 font-medium">✓ 채택된 답변</span>
                )}
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium
                  ${c.author_role === 'coach' ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600' : 'bg-gray-100 dark:bg-[#2a2d3e] text-gray-500'}`}>
                  {c.author_role === 'coach' ? '👑 코치' : '🎮 수강생'}
                </span>
                <span className="text-sm font-semibold text-gray-800 dark:text-white">{c.author_nickname}</span>
                <span className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString('ko-KR')}</span>
              </div>
              <div className="flex gap-2">
                {isCoach && !post.is_solved && !c.is_answer && (
                  <button onClick={() => handleSolve(c.id)}
                    className="text-xs px-3 py-1 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 transition-colors">
                    ✓ 채택
                  </button>
                )}
                {user?.id === c.user_id && (
                  <button onClick={() => handleDeleteComment(c.id)}
                    className="text-xs px-2 py-1 text-gray-300 hover:text-red-500 transition-colors">
                    삭제
                  </button>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{c.content}</p>
          </div>
        ))}

        {(post.comments?.length === 0) && (
          <p className="text-center text-gray-400 text-sm py-4">아직 답변이 없습니다. 첫 번째 답변을 달아보세요!</p>
        )}
      </div>

      {user && (
        <div className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-gray-800 dark:text-white">
            {isCoach ? '👑 코치 답변 작성' : '답변 작성'}
          </h3>
          <textarea value={newComment} onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleComment() }}
            placeholder="답변 내용을 입력하세요. (Ctrl+Enter로 등록)" rows={4}
            className="w-full bg-gray-50 dark:bg-[#0d0f14] border border-gray-200 dark:border-[#2a2d3e] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-400 resize-none text-gray-800 dark:text-slate-200 placeholder:text-gray-300" />
          <button onClick={handleComment} disabled={submitting || !newComment.trim()}
            className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white text-sm font-semibold rounded-xl transition-colors">
            {submitting ? '등록 중...' : '답변 등록'}
          </button>
        </div>
      )}
    </div>
  )
}
