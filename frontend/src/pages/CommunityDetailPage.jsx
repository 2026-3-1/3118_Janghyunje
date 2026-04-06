import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import useAuthStore from '../store/useAuthStore'
import { LoadingScreen } from '../components/ui'

export default function CommunityDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState({ msg: '', type: '' })

  const showToast = (msg, type = 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '', type: '' }), 3000)
  }

  const fetchPost = async () => {
    try {
      const { data } = await api.get(`/posts/${id}`)
      setPost(data.data)
    } catch {
      navigate('/community')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPost() }, [id])

  const handleCommentSubmit = async () => {
    if (!commentText.trim()) { showToast('댓글 내용을 입력해주세요.'); return }
    setSubmitting(true)
    try {
      await api.post(`/posts/${id}/comments`, { user_id: user.id, content: commentText.trim() })
      setCommentText('')
      showToast('댓글이 등록되었습니다.', 'success')
      await fetchPost()
    } catch {
      showToast('댓글 등록에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!confirm('댓글을 삭제할까요?')) return
    try {
      await api.delete(`/post-comments/${commentId}`)
      showToast('삭제되었습니다.', 'success')
      await fetchPost()
    } catch {
      showToast('삭제에 실패했습니다.')
    }
  }

  const handleDeletePost = async () => {
    if (!confirm('게시글을 삭제할까요?')) return
    try {
      await api.delete(`/posts/${id}`)
      navigate('/community')
    } catch {
      showToast('삭제에 실패했습니다.')
    }
  }

  const formatDate = (s) => new Date(s).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })

  if (loading) return <LoadingScreen />

  const toastCls = {
    error:   'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-600 dark:text-red-400',
    success: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-600 dark:text-green-400',
  }

  const isAuthor = user?.id === post.user_id

  return (
    <div className="max-w-3xl px-4 py-8 mx-auto space-y-5">

      {/* 토스트 */}
      {toast.msg && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5
                         px-4 py-3 rounded-xl border shadow-lg text-sm font-medium whitespace-nowrap ${toastCls[toast.type] || toastCls.error}`}>
          <span>{toast.type === 'success' ? '✓' : '⚠️'}</span>
          {toast.msg}
        </div>
      )}

      <button onClick={() => navigate('/community')}
        className="text-sm text-gray-400 dark:text-[#8892a4] hover:text-brand-500 transition-colors flex items-center gap-1">
        ← 목록으로
      </button>

      {/* 게시글 본문 */}
      <div className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-xl p-6 space-y-4">
        {/* 카테고리 + 제목 */}
        <div className="space-y-2">
          <span className={`text-xs px-2 py-0.5 rounded-md font-medium
            ${post.category === 'tip'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
              : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
            }`}>
            {post.category === 'tip' ? '팁 공유' : '질문'}
          </span>
          <h1 className="text-lg font-bold leading-snug text-gray-900 dark:text-white">{post.title}</h1>
        </div>

        {/* 작성자 정보 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-[#8892a4]">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white
              ${post.role === 'coach' ? 'bg-brand-500' : 'bg-gray-400'}`}>
              {post.nickname?.[0]?.toUpperCase()}
            </div>
            <span className="font-medium text-gray-700 dark:text-slate-300">{post.nickname}</span>
            {post.role === 'coach' && (
              <span className="text-xs bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 px-1.5 py-0.5 rounded-md">코치</span>
            )}
            <span className="text-gray-300 dark:text-[#4a5568]">·</span>
            <span className="text-xs">{formatDate(post.created_at)}</span>
            <span className="text-gray-300 dark:text-[#4a5568]">·</span>
            <span className="text-xs">조회 {post.view_count}</span>
          </div>
          {isAuthor && (
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/community/edit/${id}`)}
                className="text-xs text-gray-400 transition-colors hover:text-brand-500">
                수정
              </button>
              <button
                onClick={handleDeletePost}
                className="text-xs text-gray-400 transition-colors hover:text-red-500">
                삭제
              </button>
            </div>
          )}
        </div>

        <hr className="border-gray-100 dark:border-[#1e2235]" />

        {/* 본문 */}
        <div className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap dark:text-slate-300">
          {post.content}
        </div>
      </div>

      {/* 댓글 영역 */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-gray-700 dark:text-white">댓글 {post.comments?.length || 0}</h2>

        {/* 댓글 목록 */}
        {(post.comments || []).length === 0 ? (
          <p className="text-center text-gray-400 dark:text-[#6b7280] text-sm py-6">첫 댓글을 남겨보세요!</p>
        ) : (post.comments || []).map(c => (
          <div key={c.id} className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-xl p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white
                  ${c.role === 'coach' ? 'bg-brand-500' : 'bg-gray-400'}`}>
                  {c.nickname?.[0]?.toUpperCase()}
                </div>
                <span className="font-medium text-gray-700 dark:text-slate-300">{c.nickname}</span>
                {c.role === 'coach' && (
                  <span className="text-xs bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 px-1.5 py-0.5 rounded-md">코치</span>
                )}
                <span className="text-xs text-gray-300 dark:text-[#4a5568]">{formatDate(c.created_at)}</span>
              </div>
              {user?.id === c.user_id && (
                <button onClick={() => handleDeleteComment(c.id)}
                  className="text-xs text-gray-300 dark:text-[#4a5568] hover:text-red-500 transition-colors">
                  삭제
                </button>
              )}
            </div>
            <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-wrap dark:text-slate-300 pl-7">{c.content}</p>
          </div>
        ))}

        {/* 댓글 입력 */}
        {user ? (
          <div className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-xl p-4 space-y-3">
            <textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="댓글을 입력하세요..."
              rows={3}
              maxLength={500}
              className="w-full rounded-xl border border-gray-200 dark:border-[#2a2d3e] bg-gray-50 dark:bg-[#0d0f14]
                         text-gray-800 dark:text-slate-200 text-sm px-4 py-3 resize-none outline-none
                         focus:border-brand-400 dark:focus:border-brand-500 transition-colors
                         placeholder:text-gray-300 dark:placeholder:text-[#4a5568]"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-300 dark:text-[#4a5568]">{commentText.length} / 500</span>
              <button onClick={handleCommentSubmit} disabled={submitting}
                className={`px-5 py-2 text-sm font-semibold rounded-xl transition-colors
                  ${submitting
                    ? 'bg-brand-300 text-white cursor-wait'
                    : 'bg-brand-500 hover:bg-brand-600 text-white'
                  }`}>
                {submitting ? '등록 중...' : '댓글 등록'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-xl p-4 text-center text-sm text-gray-400 dark:text-[#6b7280]">
            <button onClick={() => navigate('/login')} className="font-medium text-brand-500 hover:underline">로그인</button>
            {' '}후 댓글을 작성할 수 있습니다.
          </div>
        )}
      </div>
    </div>
  )
}
