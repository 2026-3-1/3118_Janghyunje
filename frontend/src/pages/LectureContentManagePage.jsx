import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import useAuthStore from '../store/useAuthStore'
import { LoadingScreen } from '../components/ui'

export default function LectureContentManagePage() {
  const { lectureId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [lecture, setLecture]   = useState(null)
  const [contents, setContents] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [toast, setToast]       = useState('')

  const emptyForm = { title: '', description: '', type: 'video', url: '', order_num: '' }
  const [form, setForm] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    if (!user || user.role !== 'coach') { navigate('/'); return }
    Promise.all([
      api.get(`/lectures/${lectureId}`),
      api.get(`/lectures/${lectureId}/contents`),
    ]).then(([lRes, cRes]) => {
      setLecture(lRes.data.data)
      setContents(cRes.data.data || [])
    }).catch(() => navigate('/coach/dashboard'))
      .finally(() => setLoading(false))
  }, [lectureId, user])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = '제목을 입력해주세요.'
    if (!form.url.trim())   e.url   = 'URL을 입력해주세요.'
    else if (form.type === 'video' && !form.url.includes('youtube')) {
      // 유튜브 외 URL도 허용
    }
    return e
  }

  const handleSave = async () => {
    const e = validate()
    if (Object.keys(e).length > 0) { setFormErrors(e); return }
    setSaving(true)
    try {
      const payload = {
        title:       form.title,
        description: form.description,
        type:        form.type,
        url:         form.url,
        order_num:   form.order_num ? Number(form.order_num) : contents.length,
      }
      const res = await api.post(`/lectures/${lectureId}/contents`, payload)
      const newContent = { id: res.data.data.id, ...payload }
      setContents(prev => [...prev, newContent].sort((a, b) => a.order_num - b.order_num))
      setForm(emptyForm)
      setShowForm(false)
      showToast('강의 자료가 등록되었습니다.')
    } catch (err) {
      showToast(err.response?.data?.message || '등록에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('이 강의 자료를 삭제하시겠습니까?')) return
    try {
      await api.delete(`/contents/${id}`)
      setContents(prev => prev.filter(c => c.id !== id))
      showToast('삭제되었습니다.')
    } catch {
      showToast('삭제에 실패했습니다.')
    }
  }

  const inputCls = (field) =>
    `w-full bg-gray-50 dark:bg-[#0d0f14] border rounded-lg px-3 py-2.5 text-sm text-gray-800 dark:text-slate-200
     placeholder:text-gray-300 dark:placeholder:text-[#4a5568] outline-none transition-colors
     ${formErrors[field] ? 'border-red-400' : 'border-gray-200 dark:border-[#2a2d3e] focus:border-brand-400'}`

  if (loading) return <LoadingScreen />

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

      {/* 토스트 */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 dark:bg-white text-white dark:text-gray-900
                        text-sm font-medium px-5 py-3 rounded-xl shadow-lg whitespace-nowrap">
          {toast}
        </div>
      )}

      {/* 헤더 */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button onClick={() => navigate('/coach/dashboard')}
            className="text-xs text-gray-400 dark:text-[#6b7280] hover:text-brand-500 transition-colors mb-1">
            ← 수강 관리로
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">강의 자료 관리</h1>
          <p className="text-sm text-gray-400 dark:text-[#6b7280] mt-0.5 line-clamp-1">{lecture?.title}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => navigate(`/lectures/${lectureId}/contents`)}
            className="px-4 py-2 border border-gray-200 dark:border-[#2a2d3e] text-gray-600 dark:text-slate-300 text-sm font-medium rounded-lg hover:border-brand-400 transition-colors">
            수강생 화면 보기
          </button>
          <button onClick={() => { setShowForm(true); setFormErrors({}) }}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-lg transition-colors">
            + 자료 추가
          </button>
        </div>
      </div>

      {/* 자료 추가 폼 */}
      {showForm && (
        <div className="bg-white dark:bg-[#13161e] border border-brand-200 dark:border-brand-700/50 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-800 dark:text-white">새 강의 자료 추가</h2>

          {/* 타입 선택 */}
          <div className="flex gap-2">
            {[
              { value: 'video',    label: '▶ 영상 (YouTube)' },
              { value: 'material', label: '📄 자료 (링크)' },
            ].map(t => (
              <button key={t.value} onClick={() => setForm(p => ({ ...p, type: t.value }))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors
                  ${form.type === t.value
                    ? 'bg-brand-50 dark:bg-[#1e2a4a] border-brand-400 text-brand-600 dark:text-brand-400'
                    : 'bg-gray-50 dark:bg-[#0d0f14] border-gray-200 dark:border-[#2a2d3e] text-gray-500 dark:text-[#8892a4]'
                  }`}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-[#8892a4]">제목 *</label>
            <input type="text" value={form.title}
              onChange={e => { setForm(p => ({ ...p, title: e.target.value })); setFormErrors(p => ({ ...p, title: '' })) }}
              placeholder="예) 1강. 정글 기초 동선 이해하기"
              className={inputCls('title')} />
            {formErrors.title && <p className="text-xs text-red-500">{formErrors.title}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-[#8892a4]">
              {form.type === 'video' ? 'YouTube URL *' : '자료 URL *'}
            </label>
            <input type="text" value={form.url}
              onChange={e => { setForm(p => ({ ...p, url: e.target.value })); setFormErrors(p => ({ ...p, url: '' })) }}
              placeholder={form.type === 'video'
                ? 'https://www.youtube.com/watch?v=...'
                : 'https://docs.google.com/...'}
              className={inputCls('url')} />
            {formErrors.url && <p className="text-xs text-red-500">{formErrors.url}</p>}
            {form.type === 'video' && (
              <p className="text-xs text-gray-400 dark:text-[#6b7280]">YouTube 영상 URL을 붙여넣으면 자동으로 임베드됩니다.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-[#8892a4]">설명 (선택)</label>
            <textarea value={form.description} rows={3}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="이 강의에서 배울 내용을 간략히 설명해주세요."
              className={`${inputCls('')} resize-none`} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-[#8892a4]">순서 (선택, 숫자)</label>
            <input type="number" value={form.order_num} min={0}
              onChange={e => setForm(p => ({ ...p, order_num: e.target.value }))}
              placeholder={`기본값: ${contents.length + 1}`}
              className={inputCls('')} />
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white text-sm font-semibold rounded-lg transition-colors">
              {saving ? '저장 중...' : '저장'}
            </button>
            <button onClick={() => { setShowForm(false); setForm(emptyForm); setFormErrors({}) }}
              className="px-5 py-2.5 border border-gray-200 dark:border-[#2a2d3e] text-gray-500 dark:text-[#8892a4] text-sm rounded-lg hover:border-gray-400 transition-colors">
              취소
            </button>
          </div>
        </div>
      )}

      {/* 자료 목록 */}
      {contents.length === 0 ? (
        <div className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-2xl p-12 text-center space-y-3">
          <div className="text-4xl">🎬</div>
          <p className="text-gray-600 dark:text-slate-300 font-medium">아직 등록된 강의 자료가 없어요</p>
          <p className="text-gray-400 dark:text-[#6b7280] text-sm">위의 '+ 자료 추가' 버튼을 눌러 첫 강의를 등록해보세요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contents.map((c, idx) => (
            <div key={c.id}
              className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-xl p-4 flex items-center gap-4">
              <span className="text-sm font-bold text-gray-400 dark:text-[#6b7280] w-6 shrink-0 text-center">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0
                    ${c.type === 'video'
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400'
                      : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                    }`}>
                    {c.type === 'video' ? '▶ 영상' : '📄 자료'}
                  </span>
                  <p className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate">{c.title}</p>
                </div>
                {c.description && (
                  <p className="text-xs text-gray-400 dark:text-[#6b7280] line-clamp-1">{c.description}</p>
                )}
                <p className="text-xs text-gray-300 dark:text-[#4a5568] truncate">{c.url}</p>
              </div>
              <button onClick={() => handleDelete(c.id)}
                className="px-3 py-1.5 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0">
                삭제
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
