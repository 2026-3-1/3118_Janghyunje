import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import useAuthStore from '../store/useAuthStore'
import { LoadingScreen } from '../components/ui'
import { GAME_LIST, TIER_LIST } from '../constants/games'

const POSITION_LIST = [
  { value: '',        label: '포지션 선택 (선택사항)' },
  { value: 'top',     label: '탑' },
  { value: 'jungle',  label: '정글' },
  { value: 'mid',     label: '미드' },
  { value: 'adc',     label: '원딜' },
  { value: 'support', label: '서포터' },
  { value: 'all',     label: '포지션 무관' },
]

const COACH_TYPE_LIST = [
  { value: 'pro',      label: '프로게이머' },
  { value: 'coach',    label: '프로팀 코치' },
  { value: 'streamer', label: '스트리머' },
]

const CONTENT_EMPTY = { title: '', description: '', type: 'video', url: '', order_num: '' }

export default function LectureEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [toast, setToast]         = useState({ msg: '', type: '' })

  // 강의 기본 정보
  const [form, setForm]           = useState(null)
  const [formErrors, setFormErrors] = useState({})

  // 강의 자료(콘텐츠)
  const [contents, setContents]   = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [contentForm, setContentForm] = useState(CONTENT_EMPTY)
  const [contentErrors, setContentErrors] = useState({})
  const [contentSaving, setContentSaving] = useState(false)

  // 자료 수정 모드
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm]   = useState(CONTENT_EMPTY)
  const [editErrors, setEditErrors] = useState({})
  const [editSaving, setEditSaving] = useState(false)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '', type: '' }), 2500)
  }

  useEffect(() => {
    if (!user || user.role !== 'coach') { navigate('/'); return }
    Promise.all([
      api.get(`/lectures/${id}`),
      api.get(`/lectures/${id}/contents`),
    ]).then(([lRes, cRes]) => {
      const l = lRes.data.data
      setForm({
        title:          l.title || '',
        description:    l.description || '',
        game:           l.game || 'lol',
        price:          String(l.price ?? ''),
        original_price: String(l.original_price ?? ''),
        target_tier:    l.target_tier || 'all',
        position:       l.position || '',
        coach_type:     l.coach_type || 'pro',
        status:         l.status || 'active',
      })
      setContents(cRes.data.data || [])
    }).catch(() => navigate('/coach/dashboard'))
      .finally(() => setLoading(false))
  }, [id, user])

  // ── 강의 기본 정보 저장 ──────────────────────────────────────────────
  const validateForm = () => {
    const e = {}
    if (!form.title.trim())       e.title = '강의 제목을 입력해주세요.'
    if (!form.description.trim()) e.description = '강의 설명을 입력해주세요.'
    if (!form.price)              e.price = '수강료를 입력해주세요.'
    else if (Number(form.price) < 0) e.price = '수강료는 0원 이상이어야 합니다.'
    if (form.original_price && Number(form.original_price) <= Number(form.price))
      e.original_price = '원가는 수강료보다 높아야 합니다.'
    return e
  }

  const handleSaveLecture = async () => {
    const e = validateForm()
    if (Object.keys(e).length > 0) { setFormErrors(e); return }
    setSaving(true)
    try {
      await api.put(`/lectures/${id}`, {
        title:          form.title,
        description:    form.description,
        price:          Number(form.price),
        original_price: form.original_price ? Number(form.original_price) : null,
        target_tier:    form.target_tier === 'all' ? null : form.target_tier,
        position:       form.position || null,
        status:         form.status,
      })
      showToast('강의 정보가 저장되었습니다.')
    } catch (err) {
      showToast(err.response?.data?.message || '저장에 실패했습니다.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }))
    if (name === 'game') setForm(prev => ({ ...prev, game: value, target_tier: 'all' }))
  }

  // ── 강의 자료 추가 ────────────────────────────────────────────────────
  const validateContent = (f) => {
    const e = {}
    if (!f.title.trim()) e.title = '제목을 입력해주세요.'
    if (!f.url.trim())   e.url   = 'URL을 입력해주세요.'
    return e
  }

  const handleAddContent = async () => {
    const e = validateContent(contentForm)
    if (Object.keys(e).length > 0) { setContentErrors(e); return }
    setContentSaving(true)
    try {
      const payload = {
        title:       contentForm.title,
        description: contentForm.description,
        type:        contentForm.type,
        url:         contentForm.url,
        order_num:   contentForm.order_num ? Number(contentForm.order_num) : contents.length,
      }
      const res = await api.post(`/lectures/${id}/contents`, payload)
      setContents(prev => [...prev, { id: res.data.data.id, ...payload }]
        .sort((a, b) => a.order_num - b.order_num))
      setContentForm(CONTENT_EMPTY)
      setShowAddForm(false)
      showToast('강의 자료가 추가되었습니다.')
    } catch (err) {
      showToast(err.response?.data?.message || '추가에 실패했습니다.', 'error')
    } finally {
      setContentSaving(false)
    }
  }

  // ── 강의 자료 수정 ────────────────────────────────────────────────────
  const startEdit = (c) => {
    setEditingId(c.id)
    setEditForm({ title: c.title, description: c.description || '', type: c.type, url: c.url, order_num: String(c.order_num ?? '') })
    setEditErrors({})
  }

  const handleUpdateContent = async (cId) => {
    const e = validateContent(editForm)
    if (Object.keys(e).length > 0) { setEditErrors(e); return }
    setEditSaving(true)
    try {
      const payload = {
        title:       editForm.title,
        description: editForm.description,
        type:        editForm.type,
        url:         editForm.url,
        order_num:   editForm.order_num ? Number(editForm.order_num) : 0,
      }
      await api.put(`/contents/${cId}`, payload)
      setContents(prev => prev.map(c => c.id === cId ? { ...c, ...payload } : c)
        .sort((a, b) => a.order_num - b.order_num))
      setEditingId(null)
      showToast('자료가 수정되었습니다.')
    } catch (err) {
      showToast(err.response?.data?.message || '수정에 실패했습니다.', 'error')
    } finally {
      setEditSaving(false)
    }
  }

  // ── 공통 CSS ─────────────────────────────────────────────────────────
  const inputCls = (err) =>
    `w-full bg-gray-50 dark:bg-[#0d0f14] border rounded-lg px-3 py-2.5 text-sm text-gray-800 dark:text-slate-200
     placeholder:text-gray-300 dark:placeholder:text-[#4a5568] outline-none transition-colors
     ${err ? 'border-red-400 dark:border-red-600' : 'border-gray-200 dark:border-[#2a2d3e] focus:border-brand-400'}`

  const selectCls = `w-full bg-gray-50 dark:bg-[#0d0f14] border border-gray-200 dark:border-[#2a2d3e] rounded-lg px-3 py-2.5
    text-sm text-gray-800 dark:text-slate-200 outline-none focus:border-brand-400 transition-colors cursor-pointer`

  const toastCls = {
    success: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-700 dark:text-green-400',
    error:   'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-600 dark:text-red-400',
  }

  if (loading || !form) return <LoadingScreen />

  const tierOptions = TIER_LIST[form.game] || TIER_LIST.default

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">

      {/* 토스트 */}
      {toast.msg && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium whitespace-nowrap ${toastCls[toast.type]}`}>
          {toast.type === 'success' ? '✓ ' : '⚠️ '}{toast.msg}
        </div>
      )}

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate('/coach/dashboard')}
            className="text-xs text-gray-400 dark:text-[#6b7280] hover:text-brand-500 transition-colors mb-1 flex items-center gap-1">
            ← 대시보드로
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">강의 수정</h1>
        </div>
      </div>

      {/* ── 섹션 1: 기본 정보 ── */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-gray-700 dark:text-white border-b border-gray-100 dark:border-[#1e2235] pb-2">기본 정보</h2>

        <div className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-2xl p-6 space-y-5">

          {/* 강의 제목 */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 dark:text-[#8892a4]">강의 제목 *</label>
            <input type="text" name="title" value={form.title} onChange={handleFormChange}
              placeholder="강의 제목을 입력해주세요." className={inputCls(formErrors.title)} />
            {formErrors.title && <p className="text-xs text-red-500">{formErrors.title}</p>}
          </div>

          {/* 강의 설명 */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 dark:text-[#8892a4]">강의 설명 *</label>
            <textarea name="description" value={form.description} onChange={handleFormChange}
              rows={4} placeholder="강의 내용, 대상, 학습 목표 등을 자세히 적어주세요."
              className={`${inputCls(formErrors.description)} resize-none`} />
            {formErrors.description && <p className="text-xs text-red-500">{formErrors.description}</p>}
          </div>

          {/* 게임 + 대상 티어 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 dark:text-[#8892a4]">게임 *</label>
              <select name="game" value={form.game} onChange={handleFormChange} className={selectCls}>
                {GAME_LIST.filter(g => g.value !== 'all').map(g => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 dark:text-[#8892a4]">대상 티어</label>
              <select name="target_tier" value={form.target_tier} onChange={handleFormChange} className={selectCls}>
                {tierOptions.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 포지션 + 코치 유형 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 dark:text-[#8892a4]">포지션</label>
              <select name="position" value={form.position} onChange={handleFormChange} className={selectCls}>
                {POSITION_LIST.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 dark:text-[#8892a4]">코치 유형 *</label>
              <select name="coach_type" value={form.coach_type} onChange={handleFormChange} className={selectCls}>
                {COACH_TYPE_LIST.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 가격 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 dark:text-[#8892a4]">수강료 (원) *</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 bg-brand-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white">G</div>
                <input type="number" name="price" value={form.price} onChange={handleFormChange}
                  placeholder="25000" min={0} className={`${inputCls(formErrors.price)} pl-9`} />
              </div>
              {formErrors.price && <p className="text-xs text-red-500">{formErrors.price}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 dark:text-[#8892a4]">원가 (선택)</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-[9px] font-bold text-white">G</div>
                <input type="number" name="original_price" value={form.original_price} onChange={handleFormChange}
                  placeholder="30000" min={0} className={`${inputCls(formErrors.original_price)} pl-9`} />
              </div>
              {formErrors.original_price && <p className="text-xs text-red-500">{formErrors.original_price}</p>}
            </div>
          </div>

          {/* 공개 상태 */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 dark:text-[#8892a4]">공개 상태</label>
            <select name="status" value={form.status} onChange={handleFormChange} className={selectCls}>
              <option value="active">모집 중 (공개)</option>
              <option value="inactive">비공개</option>
              <option value="closed">마감</option>
            </select>
          </div>

          <button onClick={handleSaveLecture} disabled={saving}
            className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white text-sm font-semibold rounded-xl transition-colors">
            {saving ? '저장 중...' : '기본 정보 저장'}
          </button>
        </div>
      </div>

      {/* ── 섹션 2: 강의 자료 ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#1e2235] pb-2">
          <h2 className="text-sm font-bold text-gray-700 dark:text-white">강의 자료</h2>
          <button onClick={() => { setShowAddForm(p => !p); setContentErrors({}) }}
            className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold rounded-lg transition-colors">
            {showAddForm ? '취소' : '+ 자료 추가'}
          </button>
        </div>

        {/* 자료 추가 폼 */}
        {showAddForm && (
          <div className="bg-white dark:bg-[#13161e] border border-brand-200 dark:border-brand-700/50 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-800 dark:text-white">새 강의 자료 추가</h3>

            <div className="flex gap-2">
              {[
                { value: 'video',    label: '▶ 영상 (YouTube)' },
                { value: 'material', label: '📄 자료 (링크)' },
              ].map(t => (
                <button key={t.value}
                  onClick={() => setContentForm(p => ({ ...p, type: t.value }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors
                    ${contentForm.type === t.value
                      ? 'bg-brand-50 dark:bg-[#1e2a4a] border-brand-400 text-brand-600 dark:text-brand-400'
                      : 'bg-gray-50 dark:bg-[#0d0f14] border-gray-200 dark:border-[#2a2d3e] text-gray-500 dark:text-[#8892a4]'
                    }`}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-[#8892a4]">제목 *</label>
              <input type="text" value={contentForm.title}
                onChange={e => { setContentForm(p => ({ ...p, title: e.target.value })); setContentErrors(p => ({ ...p, title: '' })) }}
                placeholder="예) 1강. 정글 기초 동선 이해하기"
                className={inputCls(contentErrors.title)} />
              {contentErrors.title && <p className="text-xs text-red-500">{contentErrors.title}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-[#8892a4]">
                {contentForm.type === 'video' ? 'YouTube URL *' : '자료 URL *'}
              </label>
              <input type="text" value={contentForm.url}
                onChange={e => { setContentForm(p => ({ ...p, url: e.target.value })); setContentErrors(p => ({ ...p, url: '' })) }}
                placeholder={contentForm.type === 'video' ? 'https://www.youtube.com/watch?v=...' : 'https://docs.google.com/...'}
                className={inputCls(contentErrors.url)} />
              {contentErrors.url && <p className="text-xs text-red-500">{contentErrors.url}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-[#8892a4]">설명 (선택)</label>
              <textarea value={contentForm.description} rows={2}
                onChange={e => setContentForm(p => ({ ...p, description: e.target.value }))}
                placeholder="이 강의에서 배울 내용을 간략히 설명해주세요."
                className={`${inputCls('')} resize-none`} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-[#8892a4]">순서 (선택)</label>
              <input type="number" value={contentForm.order_num} min={0}
                onChange={e => setContentForm(p => ({ ...p, order_num: e.target.value }))}
                placeholder={`기본값: ${contents.length + 1}`}
                className={inputCls('')} />
            </div>

            <button onClick={handleAddContent} disabled={contentSaving}
              className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white text-sm font-semibold rounded-lg transition-colors">
              {contentSaving ? '추가 중...' : '추가'}
            </button>
          </div>
        )}

        {/* 자료 목록 */}
        {contents.length === 0 ? (
          <div className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-2xl p-10 text-center space-y-2">
            <div className="text-3xl">🎬</div>
            <p className="text-gray-500 dark:text-[#6b7280] text-sm">등록된 강의 자료가 없어요.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {contents.map((c, idx) => (
              <div key={c.id}
                className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-xl p-4 space-y-3">

                {/* 수정 모드 아닐 때: 자료 정보 표시 */}
                {editingId !== c.id ? (
                  <div className="flex items-center gap-4">
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
                    <button onClick={() => startEdit(c)}
                      className="px-3 py-1.5 text-xs text-brand-500 hover:text-white hover:bg-brand-500 border border-brand-200 dark:border-brand-700/50 rounded-lg transition-colors shrink-0">
                      수정
                    </button>
                  </div>
                ) : (
                  /* 수정 모드: 인라인 수정 폼 */
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      {[
                        { value: 'video',    label: '▶ 영상' },
                        { value: 'material', label: '📄 자료' },
                      ].map(t => (
                        <button key={t.value}
                          onClick={() => setEditForm(p => ({ ...p, type: t.value }))}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors
                            ${editForm.type === t.value
                              ? 'bg-brand-50 dark:bg-[#1e2a4a] border-brand-400 text-brand-600 dark:text-brand-400'
                              : 'bg-gray-50 dark:bg-[#0d0f14] border-gray-200 dark:border-[#2a2d3e] text-gray-500'
                            }`}>
                          {t.label}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500 dark:text-[#8892a4]">제목 *</label>
                      <input type="text" value={editForm.title}
                        onChange={e => { setEditForm(p => ({ ...p, title: e.target.value })); setEditErrors(p => ({ ...p, title: '' })) }}
                        className={inputCls(editErrors.title)} />
                      {editErrors.title && <p className="text-xs text-red-500">{editErrors.title}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500 dark:text-[#8892a4]">URL *</label>
                      <input type="text" value={editForm.url}
                        onChange={e => { setEditForm(p => ({ ...p, url: e.target.value })); setEditErrors(p => ({ ...p, url: '' })) }}
                        className={inputCls(editErrors.url)} />
                      {editErrors.url && <p className="text-xs text-red-500">{editErrors.url}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500 dark:text-[#8892a4]">설명 (선택)</label>
                      <textarea value={editForm.description} rows={2}
                        onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                        className={`${inputCls('')} resize-none`} />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500 dark:text-[#8892a4]">순서</label>
                      <input type="number" value={editForm.order_num} min={0}
                        onChange={e => setEditForm(p => ({ ...p, order_num: e.target.value }))}
                        className={inputCls('')} />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button onClick={() => handleUpdateContent(c.id)} disabled={editSaving}
                        className="flex-1 py-2 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white text-sm font-semibold rounded-lg transition-colors">
                        {editSaving ? '저장 중...' : '저장'}
                      </button>
                      <button onClick={() => setEditingId(null)}
                        className="px-4 py-2 border border-gray-200 dark:border-[#2a2d3e] text-gray-500 dark:text-[#8892a4] text-sm rounded-lg hover:border-gray-400 transition-colors">
                        취소
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
