import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import useAuthStore from '../store/useAuthStore'
import { GAME_LIST, TIER_LIST } from '../constants/games'
import { LoadingScreen } from '../components/ui'

const POSITION_LIST = [
  { value: '', label: '포지션 선택 (선택사항)' },
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

const EMPTY_CONTENT_FORM = { title: '', description: '', type: 'video', url: '', order_num: '' }

export default function LectureRegisterPage() {
  const navigate = useNavigate()
  const { id: lectureId } = useParams() // 수정 모드면 lectureId 있음
  const isEditMode = !!lectureId
  const { user } = useAuthStore()

  // 강의 기본 정보
  const [form, setForm] = useState({
    title: '', description: '', game: 'lol', price: '',
    original_price: '', target_tier: 'all', position: '', coach_type: 'pro',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(isEditMode) // 수정 모드면 기존 데이터 로딩
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  // 강의 자료
  const [contents, setContents] = useState([])
  const [showContentForm, setShowContentForm] = useState(false)
  const [contentForm, setContentForm] = useState(EMPTY_CONTENT_FORM)
  const [contentFormErrors, setContentFormErrors] = useState({})
  const [contentSaving, setContentSaving] = useState(false)
  const [editingContentId, setEditingContentId] = useState(null) // 수정 중인 자료 id

  const [toast, setToast] = useState('')

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  // 코치 아닌 유저 차단
  if (!user || user.role !== 'coach') {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="text-5xl">🔒</div>
        <p className="text-lg font-bold text-gray-800 dark:text-white">코치만 강의를 등록할 수 있어요</p>
        <button onClick={() => navigate('/')}
          className="px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-lg transition-colors">
          홈으로
        </button>
      </div>
    )
  }

  // 수정 모드: 기존 강의 데이터 불러오기
  useEffect(() => {
    if (!isEditMode) return
    Promise.all([
      api.get(`/lectures/${lectureId}`),
      api.get(`/lectures/${lectureId}/contents`),
    ]).then(([lRes, cRes]) => {
      const l = lRes.data.data
      setForm({
        title:          l.title || '',
        description:    l.description || '',
        game:           l.game || 'lol',
        price:          l.price != null ? String(l.price) : '',
        original_price: l.original_price != null ? String(l.original_price) : '',
        target_tier:    l.target_tier || 'all',
        position:       l.position || '',
        coach_type:     l.coach_type || 'pro',
      })
      setContents(cRes.data.data || [])
    }).catch(() => navigate('/coach/dashboard'))
      .finally(() => setLoading(false))
  }, [lectureId])

  const tierOptions = TIER_LIST[form.game] || TIER_LIST.default

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'game') {
      setForm(prev => ({ ...prev, game: value, target_tier: 'all' }))
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.title.trim())       e.title = '강의 제목을 입력해주세요.'
    if (!form.description.trim()) e.description = '강의 설명을 입력해주세요.'
    if (!form.price)              e.price = '수강료를 입력해주세요.'
    else if (Number(form.price) < 0) e.price = '수강료는 0원 이상이어야 합니다.'
    if (form.original_price && Number(form.original_price) <= Number(form.price))
      e.original_price = '원가는 수강료보다 높아야 합니다.'
    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setSaving(true)
    try {
      const payload = {
        title:          form.title,
        description:    form.description,
        game:           form.game,
        price:          Number(form.price),
        original_price: form.original_price ? Number(form.original_price) : null,
        target_tier:    form.target_tier === 'all' ? null : form.target_tier,
        position:       form.position || null,
        coach_type:     form.coach_type,
      }
      if (isEditMode) {
        await api.put(`/lectures/${lectureId}`, payload)
        showToast('강의가 수정되었습니다.')
      } else {
        await api.post('/lectures', { coach_id: user.id, ...payload })
        setSuccess(true)
      }
    } catch (err) {
      setErrors({ general: err.response?.data?.message || (isEditMode ? '강의 수정에 실패했습니다.' : '강의 등록에 실패했습니다.') })
    } finally {
      setSaving(false)
    }
  }

  // ── 강의 자료 추가/수정 ──
  const validateContent = () => {
    const e = {}
    if (!contentForm.title.trim()) e.title = '제목을 입력해주세요.'
    if (!contentForm.url.trim())   e.url   = 'URL을 입력해주세요.'
    return e
  }

  const handleContentSave = async () => {
    const e = validateContent()
    if (Object.keys(e).length > 0) { setContentFormErrors(e); return }
    setContentSaving(true)
    try {
      const payload = {
        title:       contentForm.title,
        description: contentForm.description,
        type:        contentForm.type,
        url:         contentForm.url,
        order_num:   contentForm.order_num ? Number(contentForm.order_num) : contents.length,
      }
      if (editingContentId) {
        // 수정
        await api.put(`/contents/${editingContentId}`, payload)
        setContents(prev =>
          prev.map(c => c.id === editingContentId ? { ...c, ...payload } : c)
            .sort((a, b) => a.order_num - b.order_num)
        )
        showToast('자료가 수정되었습니다.')
      } else {
        // 추가
        const res = await api.post(`/lectures/${lectureId}/contents`, payload)
        setContents(prev =>
          [...prev, { id: res.data.data.id, ...payload }]
            .sort((a, b) => a.order_num - b.order_num)
        )
        showToast('강의 자료가 추가되었습니다.')
      }
      setContentForm(EMPTY_CONTENT_FORM)
      setShowContentForm(false)
      setEditingContentId(null)
    } catch (err) {
      showToast(err.response?.data?.message || '저장에 실패했습니다.')
    } finally {
      setContentSaving(false)
    }
  }

  const handleContentEdit = (c) => {
    setContentForm({
      title:       c.title || '',
      description: c.description || '',
      type:        c.type || 'video',
      url:         c.url || '',
      order_num:   c.order_num != null ? String(c.order_num) : '',
    })
    setEditingContentId(c.id)
    setContentFormErrors({})
    setShowContentForm(true)
  }

  const handleContentFormCancel = () => {
    setShowContentForm(false)
    setContentForm(EMPTY_CONTENT_FORM)
    setContentFormErrors({})
    setEditingContentId(null)
  }

  const inputCls = (field) =>
    `w-full bg-gray-50 dark:bg-[#0d0f14] border rounded-lg px-3 py-2.5 text-sm text-gray-800 dark:text-slate-200
     placeholder:text-gray-300 dark:placeholder:text-[#4a5568] outline-none transition-colors
     ${errors[field] ? 'border-red-400 dark:border-red-600' : 'border-gray-200 dark:border-[#2a2d3e] focus:border-brand-400'}`

  const contentInputCls = (field) =>
    `w-full bg-gray-50 dark:bg-[#0d0f14] border rounded-lg px-3 py-2.5 text-sm text-gray-800 dark:text-slate-200
     placeholder:text-gray-300 dark:placeholder:text-[#4a5568] outline-none transition-colors
     ${contentFormErrors[field] ? 'border-red-400' : 'border-gray-200 dark:border-[#2a2d3e] focus:border-brand-400'}`

  const selectCls = `w-full bg-gray-50 dark:bg-[#0d0f14] border border-gray-200 dark:border-[#2a2d3e] rounded-lg px-3 py-2.5
    text-sm text-gray-800 dark:text-slate-200 outline-none focus:border-brand-400 transition-colors cursor-pointer`

  if (loading) return <LoadingScreen />

  // 등록 성공 화면 (등록 모드 전용)
  if (success) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-5">
        <div className="text-5xl">🎉</div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">강의가 등록되었습니다!</h2>
        <p className="text-sm text-gray-400 dark:text-[#6b7280]">학생들의 수강 신청을 기다려보세요.</p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => navigate('/lectures')}
            className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-lg transition-colors">
            강의 목록 보기
          </button>
          <button onClick={() => {
            setSuccess(false)
            setForm({ title: '', description: '', game: 'lol', price: '', original_price: '', target_tier: 'all', position: '', coach_type: 'pro' })
          }}
            className="px-5 py-2.5 bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-[#2a2d3e] text-gray-600 dark:text-slate-300 text-sm font-semibold rounded-lg transition-colors hover:border-brand-400">
            강의 추가 등록
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

      {/* 토스트 */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 dark:bg-white text-white dark:text-gray-900
                        text-sm font-medium px-5 py-3 rounded-xl shadow-lg whitespace-nowrap">
          {toast}
        </div>
      )}

      <div>
        {isEditMode && (
          <button onClick={() => navigate('/coach/dashboard')}
            className="text-xs text-gray-400 dark:text-[#6b7280] hover:text-brand-500 transition-colors mb-2 block">
            ← 대시보드로
          </button>
        )}
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? '강의 수정' : '강의 등록'}
        </h1>
        <p className="text-sm text-gray-400 dark:text-[#6b7280] mt-0.5">
          {isEditMode ? '강의 정보와 자료를 수정할 수 있습니다.' : '학생들에게 제공할 강의를 등록해주세요.'}
        </p>
      </div>

      {errors.general && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {errors.general}
        </div>
      )}

      {/* ── 강의 기본 정보 ── */}
      <div className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-2xl p-6 space-y-5">
        <h2 className="text-sm font-bold text-gray-700 dark:text-white">기본 정보</h2>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-600 dark:text-[#8892a4]">강의 제목 *</label>
          <input type="text" name="title" value={form.title} onChange={handleChange}
            placeholder="예) 챌린저 달성까지 정글 로테이션 완벽 정리"
            className={inputCls('title')} />
          {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-600 dark:text-[#8892a4]">강의 설명 *</label>
          <textarea name="description" value={form.description} onChange={handleChange}
            rows={4} placeholder="강의 내용, 대상, 학습 목표 등을 자세히 적어주세요."
            className={`${inputCls('description')} resize-none`} />
          {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 dark:text-[#8892a4]">게임 *</label>
            <select name="game" value={form.game} onChange={handleChange} className={selectCls}>
              {GAME_LIST.filter(g => g.value !== 'all').map(g => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 dark:text-[#8892a4]">대상 티어</label>
            <select name="target_tier" value={form.target_tier} onChange={handleChange} className={selectCls}>
              {tierOptions.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 dark:text-[#8892a4]">포지션</label>
            <select name="position" value={form.position} onChange={handleChange} className={selectCls}>
              {POSITION_LIST.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 dark:text-[#8892a4]">코치 유형 *</label>
            <select name="coach_type" value={form.coach_type} onChange={handleChange} className={selectCls}>
              {COACH_TYPE_LIST.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 dark:text-[#8892a4]">수강료 (원) *</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 bg-brand-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white">G</div>
              <input type="number" name="price" value={form.price} onChange={handleChange}
                placeholder="25000" min={0}
                className={`${inputCls('price')} pl-9`} />
            </div>
            {errors.price && <p className="text-xs text-red-500">{errors.price}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 dark:text-[#8892a4]">원가 (할인 전 가격, 선택)</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-[9px] font-bold text-white">G</div>
              <input type="number" name="original_price" value={form.original_price} onChange={handleChange}
                placeholder="30000" min={0}
                className={`${inputCls('original_price')} pl-9`} />
            </div>
            {errors.original_price && <p className="text-xs text-red-500">{errors.original_price}</p>}
            {form.original_price && form.price && Number(form.original_price) > Number(form.price) && (
              <p className="text-xs text-orange-500 font-medium">
                {Math.round((1 - Number(form.price) / Number(form.original_price)) * 100)}% 할인 적용됩니다.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── 강의 자료 관리 (수정 모드에서만 표시) ── */}
      {isEditMode && (
        <div className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-700 dark:text-white">강의 자료</h2>
            {!showContentForm && (
              <button onClick={() => { setShowContentForm(true); setEditingContentId(null); setContentForm(EMPTY_CONTENT_FORM); setContentFormErrors({}) }}
                className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold rounded-lg transition-colors">
                + 자료 추가
              </button>
            )}
          </div>

          {/* 자료 추가/수정 폼 */}
          {showContentForm && (
            <div className="bg-gray-50 dark:bg-[#0d0f14] border border-brand-200 dark:border-brand-700/50 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-gray-700 dark:text-white">
                {editingContentId ? '자료 수정' : '새 자료 추가'}
              </h3>

              {/* 타입 선택 */}
              <div className="flex gap-2">
                {[
                  { value: 'video',    label: '▶ 영상 (YouTube)' },
                  { value: 'material', label: '📄 자료 (링크)' },
                ].map(t => (
                  <button key={t.value} onClick={() => setContentForm(p => ({ ...p, type: t.value }))}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors
                      ${contentForm.type === t.value
                        ? 'bg-brand-50 dark:bg-[#1e2a4a] border-brand-400 text-brand-600 dark:text-brand-400'
                        : 'bg-white dark:bg-[#13161e] border-gray-200 dark:border-[#2a2d3e] text-gray-500 dark:text-[#8892a4]'
                      }`}>
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 dark:text-[#8892a4]">제목 *</label>
                <input type="text" value={contentForm.title}
                  onChange={e => { setContentForm(p => ({ ...p, title: e.target.value })); setContentFormErrors(p => ({ ...p, title: '' })) }}
                  placeholder="예) 1강. 정글 기초 동선 이해하기"
                  className={contentInputCls('title')} />
                {contentFormErrors.title && <p className="text-xs text-red-500">{contentFormErrors.title}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 dark:text-[#8892a4]">
                  {contentForm.type === 'video' ? 'YouTube URL *' : '자료 URL *'}
                </label>
                <input type="text" value={contentForm.url}
                  onChange={e => { setContentForm(p => ({ ...p, url: e.target.value })); setContentFormErrors(p => ({ ...p, url: '' })) }}
                  placeholder={contentForm.type === 'video' ? 'https://www.youtube.com/watch?v=...' : 'https://docs.google.com/...'}
                  className={contentInputCls('url')} />
                {contentFormErrors.url && <p className="text-xs text-red-500">{contentFormErrors.url}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 dark:text-[#8892a4]">설명 (선택)</label>
                <textarea value={contentForm.description} rows={2}
                  onChange={e => setContentForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="이 자료에 대한 간략한 설명"
                  className={`${contentInputCls('')} resize-none`} />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 dark:text-[#8892a4]">순서 (선택, 숫자)</label>
                <input type="number" value={contentForm.order_num} min={0}
                  onChange={e => setContentForm(p => ({ ...p, order_num: e.target.value }))}
                  placeholder={`기본값: ${contents.length + 1}`}
                  className={contentInputCls('')} />
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={handleContentSave} disabled={contentSaving}
                  className="flex-1 py-2 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white text-xs font-semibold rounded-lg transition-colors">
                  {contentSaving ? '저장 중...' : (editingContentId ? '수정 완료' : '추가')}
                </button>
                <button onClick={handleContentFormCancel}
                  className="px-4 py-2 border border-gray-200 dark:border-[#2a2d3e] text-gray-500 dark:text-[#8892a4] text-xs rounded-lg hover:border-gray-400 transition-colors">
                  취소
                </button>
              </div>
            </div>
          )}

          {/* 자료 목록 */}
          {contents.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400 dark:text-[#6b7280]">
              아직 등록된 강의 자료가 없어요.
            </div>
          ) : (
            <div className="space-y-2">
              {contents.map((c, idx) => (
                <div key={c.id}
                  className="flex items-center gap-3 bg-gray-50 dark:bg-[#0d0f14] border border-gray-100 dark:border-[#2a2d3e] rounded-xl px-4 py-3">
                  <span className="text-xs font-bold text-gray-400 dark:text-[#6b7280] w-5 shrink-0 text-center">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1 min-w-0 space-y-0.5">
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
                  </div>
                  <button onClick={() => handleContentEdit(c)}
                    className="px-3 py-1 text-xs text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors shrink-0 border border-brand-200 dark:border-brand-700/50">
                    수정
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 버튼 */}
      <div className="flex gap-3">
        <button onClick={() => navigate(isEditMode ? '/coach/dashboard' : -1)}
          className="flex-1 py-3 bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-[#2a2d3e] text-gray-600 dark:text-slate-300
                     text-sm font-semibold rounded-xl hover:border-brand-400 transition-colors">
          취소
        </button>
        <button onClick={handleSubmit} disabled={saving}
          className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white text-sm font-semibold rounded-xl transition-colors">
          {saving ? '저장 중...' : (isEditMode ? '수정 완료' : '강의 등록하기')}
        </button>
      </div>
    </div>
  )
}
