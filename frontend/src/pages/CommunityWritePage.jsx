import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import useAuthStore from '../store/useAuthStore'

const CATEGORIES = [
  { value: 'question', label: '질문' },
  { value: 'tip',      label: '팁 공유' },
]

export default function CommunityWritePage() {
  const navigate = useNavigate()
  const { id } = useParams() // 수정 시 id 존재
  const { user } = useAuthStore()
  const [category, setCategory] = useState('question')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // 수정 모드면 기존 데이터 로드
  useEffect(() => {
    if (!id) return
    api.get(`/posts/${id}`).then(({ data }) => {
      const p = data.data
      setCategory(p.category)
      setTitle(p.title)
      setContent(p.content)
    }).catch(() => navigate('/community'))
  }, [id])

  // 비로그인 접근 차단
  useEffect(() => {
    if (!user) navigate('/login')
  }, [user])

  const handleSubmit = async () => {
    if (!title.trim()) { setError('제목을 입력해주세요.'); return }
    if (!content.trim()) { setError('내용을 입력해주세요.'); return }
    setError('')
    setSubmitting(true)
    try {
      if (id) {
        await api.put(`/posts/${id}`, { title: title.trim(), content: content.trim(), category })
        navigate(`/community/${id}`)
      } else {
        const { data } = await api.post('/posts', { user_id: user.id, category, title: title.trim(), content: content.trim() })
        navigate(`/community/${data.data.id}`)
      }
    } catch {
      setError('저장에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl px-4 py-8 mx-auto space-y-5">
      <button onClick={() => navigate(-1)}
        className="text-sm text-gray-400 dark:text-[#8892a4] hover:text-brand-500 transition-colors flex items-center gap-1">
        ← 뒤로
      </button>

      <h1 className="text-xl font-bold text-gray-900 dark:text-white">
        {id ? '게시글 수정' : '글쓰기'}
      </h1>

      <div className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-xl p-6 space-y-5">

        {/* 카테고리 */}
        <div>
          <label className="block text-xs text-gray-500 dark:text-[#8892a4] mb-2 font-medium">카테고리</label>
          <div className="flex gap-2">
            {CATEGORIES.map(c => (
              <button key={c.value} onClick={() => setCategory(c.value)}
                className={`px-4 py-1.5 rounded-xl text-sm font-medium border transition-colors
                  ${category === c.value
                    ? 'bg-brand-500 text-white border-brand-500'
                    : 'bg-white dark:bg-[#0d0f14] text-gray-500 dark:text-[#8892a4] border-gray-200 dark:border-[#2a2d3e] hover:border-brand-400'
                  }`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* 제목 */}
        <div>
          <label className="block text-xs text-gray-500 dark:text-[#8892a4] mb-2 font-medium">제목</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            maxLength={100}
            className="w-full rounded-xl border border-gray-200 dark:border-[#2a2d3e] bg-gray-50 dark:bg-[#0d0f14]
                       text-gray-800 dark:text-slate-200 text-sm px-4 py-2.5 outline-none
                       focus:border-brand-400 dark:focus:border-brand-500 transition-colors
                       placeholder:text-gray-300 dark:placeholder:text-[#4a5568]"
          />
          <p className="text-right text-xs text-gray-300 dark:text-[#4a5568] mt-1">{title.length} / 100</p>
        </div>

        {/* 내용 */}
        <div>
          <label className="block text-xs text-gray-500 dark:text-[#8892a4] mb-2 font-medium">내용</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="내용을 입력하세요"
            rows={10}
            maxLength={3000}
            className="w-full rounded-xl border border-gray-200 dark:border-[#2a2d3e] bg-gray-50 dark:bg-[#0d0f14]
                       text-gray-800 dark:text-slate-200 text-sm px-4 py-3 resize-none outline-none
                       focus:border-brand-400 dark:focus:border-brand-500 transition-colors
                       placeholder:text-gray-300 dark:placeholder:text-[#4a5568]"
          />
          <p className="text-right text-xs text-gray-300 dark:text-[#4a5568] mt-1">{content.length} / 3000</p>
        </div>

        {error && (
          <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
        )}

        {/* 버튼 */}
        <div className="flex justify-end gap-2">
          <button onClick={() => navigate(-1)}
            className="px-5 py-2.5 text-sm text-gray-500 dark:text-[#8892a4] border border-gray-200 dark:border-[#2a2d3e]
                       rounded-xl hover:bg-gray-50 dark:hover:bg-[#1a1d2e] transition-colors">
            취소
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className={`px-6 py-2.5 text-sm font-semibold rounded-xl transition-colors
              ${submitting
                ? 'bg-brand-300 text-white cursor-wait'
                : 'bg-brand-500 hover:bg-brand-600 text-white'
              }`}>
            {submitting ? '저장 중...' : id ? '수정하기' : '등록하기'}
          </button>
        </div>
      </div>
    </div>
  )
}
