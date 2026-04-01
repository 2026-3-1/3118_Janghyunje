import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signup, login } from '../services/lectureService'
import useAuthStore from '../store/useAuthStore'
import { GAME_LIST, TIER_LIST } from '../constants/games'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setUser } = useAuthStore()
  const [form, setForm] = useState({
    email: '', password: '', passwordConfirm: '',
    nickname: '', role: 'student', game: 'lol', tier: 'gold',
  })
  // 필드별 에러 상태
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const tierOptions = TIER_LIST[form.game] || TIER_LIST.default

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    // 해당 필드 에러 지우기
    if (errors[e.target.name]) setErrors(prev => ({ ...prev, [e.target.name]: '' }))
  }

  const validate = () => {
    const newErrors = {}
    if (!form.email)           newErrors.email = '이메일을 입력해주세요.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                               newErrors.email = '올바른 이메일 형식이 아닙니다.'
    if (!form.nickname)        newErrors.nickname = '닉네임을 입력해주세요.'
    if (!form.password)        newErrors.password = '비밀번호를 입력해주세요.'
    else if (form.password.length < 4)
                               newErrors.password = '비밀번호는 4자 이상이어야 합니다.'
    if (!form.passwordConfirm) newErrors.passwordConfirm = '비밀번호 확인을 입력해주세요.'
    else if (form.password !== form.passwordConfirm)
                               newErrors.passwordConfirm = '비밀번호가 일치하지 않습니다.'
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setLoading(true)
    try {
      await signup({
        email: form.email, password: form.password,
        nickname: form.nickname, role: form.role,
        game: form.game, tier: form.tier,
      })
      // 회원가입 성공 후 자동 로그인
      const res = await login({ email: form.email, password: form.password })
      setUser(res.data)
      navigate('/')
    } catch (err) {
      const code = err.response?.data?.code
      const message = err.response?.data?.message || '회원가입에 실패했습니다.'
      if (code === 'EMAIL_DUPLICATE') {
        setErrors({ email: message })
      } else if (code === 'NICKNAME_DUPLICATE') {
        setErrors({ nickname: message })
      } else {
        setErrors({ general: message })
      }
    } finally {
      setLoading(false)
    }
  }

  const inputCls = (field) =>
    `w-full bg-gray-50 dark:bg-[#0d0f14] border rounded-lg px-3 py-2.5 text-sm text-gray-800 dark:text-slate-200
     placeholder:text-gray-300 dark:placeholder:text-[#4a5568] outline-none transition-colors
     ${errors[field]
       ? 'border-red-400 dark:border-red-600 focus:border-red-400'
       : 'border-gray-200 dark:border-[#2a2d3e] focus:border-brand-400'
     }`

  return (
    <div className="min-h-[calc(100vh-52px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">

        <div className="text-center space-y-1">
          <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white font-bold text-lg mx-auto mb-3">G</div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">회원가입</h1>
          <p className="text-sm text-gray-400 dark:text-[#6b7280]">Game Coaching Platform</p>
        </div>

        <div className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-2xl p-6 space-y-4">

          {/* 일반 에러 */}
          {errors.general && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
              {errors.general}
            </div>
          )}

          {/* 역할 선택 */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600 dark:text-[#8892a4]">역할</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'student', label: '🎮 학생', desc: '강의 수강' },
                { value: 'coach',   label: '🏆 코치', desc: '강의 등록' },
              ].map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => setForm(prev => ({ ...prev, role: opt.value }))}
                  className={`p-3 rounded-xl border text-left transition-all
                    ${form.role === opt.value
                      ? 'border-brand-400 bg-brand-50 dark:bg-[#1e2a4a]'
                      : 'border-gray-200 dark:border-[#2a2d3e] hover:border-brand-300'
                    }`}>
                  <div className="text-sm font-semibold text-gray-800 dark:text-white">{opt.label}</div>
                  <div className="text-xs text-gray-400 dark:text-[#6b7280]">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 이메일 */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600 dark:text-[#8892a4]">이메일 *</label>
            <input type="email" name="email" value={form.email} onChange={handleChange}
              placeholder="email@example.com" className={inputCls('email')} />
            {errors.email && <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">{errors.email}</p>}
          </div>

          {/* 닉네임 */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600 dark:text-[#8892a4]">닉네임 *</label>
            <input type="text" name="nickname" value={form.nickname} onChange={handleChange}
              placeholder="게임 닉네임" className={inputCls('nickname')} />
            {errors.nickname && <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">{errors.nickname}</p>}
          </div>

          {/* 비밀번호 */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600 dark:text-[#8892a4]">비밀번호 *</label>
            <input type="password" name="password" value={form.password} onChange={handleChange}
              placeholder="4자 이상" className={inputCls('password')} />
            {errors.password && <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">{errors.password}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600 dark:text-[#8892a4]">비밀번호 확인 *</label>
            <input type="password" name="passwordConfirm" value={form.passwordConfirm} onChange={handleChange}
              placeholder="비밀번호 재입력" className={inputCls('passwordConfirm')} />
            {errors.passwordConfirm && <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">{errors.passwordConfirm}</p>}
          </div>

          {/* 게임 + 티어 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600 dark:text-[#8892a4]">주 게임</label>
              <select name="game" value={form.game}
                onChange={e => { handleChange(e); setForm(prev => ({ ...prev, game: e.target.value, tier: 'gold' })) }}
                className="w-full bg-gray-50 dark:bg-[#0d0f14] border border-gray-200 dark:border-[#2a2d3e] rounded-lg px-3 py-2.5 text-sm text-gray-800 dark:text-slate-200 outline-none focus:border-brand-400 cursor-pointer">
                {GAME_LIST.filter(g => g.value !== 'all').map(g => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600 dark:text-[#8892a4]">현재 티어</label>
              <select name="tier" value={form.tier} onChange={handleChange}
                className="w-full bg-gray-50 dark:bg-[#0d0f14] border border-gray-200 dark:border-[#2a2d3e] rounded-lg px-3 py-2.5 text-sm text-gray-800 dark:text-slate-200 outline-none focus:border-brand-400 cursor-pointer">
                {tierOptions.filter(t => t.value !== 'all').map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <button onClick={handleSubmit} disabled={loading}
            className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white font-semibold text-sm rounded-lg transition-colors">
            {loading ? '처리 중...' : '회원가입'}
          </button>
        </div>

        <p className="text-center text-sm text-gray-400 dark:text-[#6b7280]">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="text-brand-500 hover:text-brand-600 font-medium transition-colors">로그인</Link>
        </p>
      </div>
    </div>
  )
}
