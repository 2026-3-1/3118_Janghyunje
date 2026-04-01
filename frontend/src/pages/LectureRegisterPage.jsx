import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import useAuthStore from '../store/useAuthStore'
import { GAME_LIST, TIER_LIST } from '../constants/games'

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

export default function LectureRegisterPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [form, setForm] = useState({
    title: '',
    description: '',
    game: 'lol',
    price: '',
    original_price: '',
    target_tier: 'all',
    position: '',
    coach_type: 'pro',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

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

  const tierOptions = TIER_LIST[form.game] || TIER_LIST.default

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
    // 게임 바뀌면 티어 초기화
    if (name === 'game') setForm(prev => ({ ...prev, game: value, target_tier: 'all' }))
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
    setLoading(true)
    try {
      await api.post('/lectures', {
        coach_id:       user.id,
        title:          form.title,
        description:    form.description,
        game:           form.game,
        price:          Number(form.price),
        original_price: form.original_price ? Number(form.original_price) : null,
        target_tier:    form.target_tier === 'all' ? null : form.target_tier,
        position:       form.position || null,
        coach_type:     form.coach_type,
      })
      setSuccess(true)
    } catch (err) {
      setErrors({ general: err.response?.data?.message || '강의 등록에 실패했습니다.' })
    } finally {
      setLoading(false)
    }
  }

  const inputCls = (field) =>
    `w-full bg-gray-50 dark:bg-[#0d0f14] border rounded-lg px-3 py-2.5 text-sm text-gray-800 dark:text-slate-200
     placeholder:text-gray-300 dark:placeholder:text-[#4a5568] outline-none transition-colors
     ${errors[field]
       ? 'border-red-400 dark:border-red-600 focus:border-red-400'
       : 'border-gray-200 dark:border-[#2a2d3e] focus:border-brand-400'}`

  const selectCls = `w-full bg-gray-50 dark:bg-[#0d0f14] border border-gray-200 dark:border-[#2a2d3e] rounded-lg px-3 py-2.5
    text-sm text-gray-800 dark:text-slate-200 outline-none focus:border-brand-400 transition-colors cursor-pointer`

  // 등록 성공 화면
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
          <button onClick={() => { setSuccess(false); setForm({ title: '', description: '', game: 'lol', price: '', original_price: '', target_tier: 'all', position: '', coach_type: 'pro' }) }}
            className="px-5 py-2.5 bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-[#2a2d3e] text-gray-600 dark:text-slate-300 text-sm font-semibold rounded-lg transition-colors hover:border-brand-400">
            강의 추가 등록
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">강의 등록</h1>
        <p className="text-sm text-gray-400 dark:text-[#6b7280] mt-0.5">학생들에게 제공할 강의를 등록해주세요.</p>
      </div>

      {errors.general && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {errors.general}
        </div>
      )}

      <div className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-2xl p-6 space-y-5">

        {/* 강의 제목 */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-600 dark:text-[#8892a4]">강의 제목 *</label>
          <input type="text" name="title" value={form.title} onChange={handleChange}
            placeholder="예) 챌린저 달성까지 정글 로테이션 완벽 정리"
            className={inputCls('title')} />
          {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
        </div>

        {/* 강의 설명 */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-600 dark:text-[#8892a4]">강의 설명 *</label>
          <textarea name="description" value={form.description} onChange={handleChange}
            rows={4} placeholder="강의 내용, 대상, 학습 목표 등을 자세히 적어주세요."
            className={`${inputCls('description')} resize-none`} />
          {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
        </div>

        {/* 게임 + 대상 티어 */}
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

        {/* 포지션 + 코치 유형 */}
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

        {/* 가격 */}
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

        {/* 미리보기 */}
        {form.title && form.price && (
          <div className="border border-gray-100 dark:border-[#2a2d3e] rounded-xl p-4 space-y-2 bg-gray-50 dark:bg-[#0d0f14]">
            <p className="text-xs font-semibold text-gray-500 dark:text-[#6b7280] mb-2">미리보기</p>
            <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 line-clamp-2">{form.title}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-md bg-brand-50 dark:bg-[#1e2a4a] text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-700/50">
                {GAME_LIST.find(g => g.value === form.game)?.label}
              </span>
              {form.target_tier !== 'all' && (
                <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 dark:bg-[#1a1d2e] text-gray-500 dark:text-[#8892a4] border border-gray-200 dark:border-[#2a2d3e]">
                  대상 {tierOptions.find(t => t.value === form.target_tier)?.label}
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <div className="w-4 h-4 bg-brand-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white">G</div>
              <span className="text-base font-bold text-gray-900 dark:text-white">{Number(form.price).toLocaleString()}</span>
              {form.original_price && Number(form.original_price) > Number(form.price) && (
                <>
                  <span className="text-xs text-gray-300 dark:text-[#4a5568] line-through">{Number(form.original_price).toLocaleString()}</span>
                  <span className="text-xs font-semibold text-orange-500">
                    {Math.round((1 - Number(form.price) / Number(form.original_price)) * 100)}%
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 버튼 */}
      <div className="flex gap-3">
        <button onClick={() => navigate(-1)}
          className="flex-1 py-3 bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-[#2a2d3e] text-gray-600 dark:text-slate-300
                     text-sm font-semibold rounded-xl hover:border-brand-400 transition-colors">
          취소
        </button>
        <button onClick={handleSubmit} disabled={loading}
          className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white text-sm font-semibold rounded-xl transition-colors">
          {loading ? '등록 중...' : '강의 등록하기'}
        </button>
      </div>
    </div>
  )
}
