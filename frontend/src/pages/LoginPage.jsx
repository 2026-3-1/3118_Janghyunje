import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../services/lectureService'
import useAuthStore from '../store/useAuthStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setUser } = useAuthStore()

  const savedEmail = localStorage.getItem('savedEmail') || ''
  const [form, setForm] = useState({ email: savedEmail, password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [rememberEmail, setRememberEmail] = useState(!!savedEmail)

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async () => {
    if (!form.email || !form.password) {
      setError('이메일과 비밀번호를 입력해주세요.')
      return
    }
    setLoading(true)
    try {
      const res = await login(form)
      if (rememberEmail) localStorage.setItem('savedEmail', form.email)
      else localStorage.removeItem('savedEmail')
      setError('')
      // P2: token과 user를 함께 저장
      setUser(res.data.user, res.data.token)
      navigate('/')
    } catch (err) {
      setForm(prev => ({ ...prev, password: '' }))
      setError(err.response?.data?.message || '로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className="min-h-[calc(100vh-52px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">

        <div className="text-center space-y-1">
          <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white font-bold text-lg mx-auto mb-3">G</div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">로그인</h1>
          <p className="text-sm text-gray-400 dark:text-[#6b7280]">Game Coaching Platform</p>
        </div>

        <div className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-2xl p-6 space-y-4">

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2.5 text-sm text-red-600 dark:text-red-400 flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 ml-2 text-xs">✕</button>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600 dark:text-[#8892a4]">이메일</label>
            <input
              type="email" name="email" value={form.email}
              onChange={handleChange} onKeyDown={handleKeyDown}
              placeholder="email@example.com"
              className="w-full bg-gray-50 dark:bg-[#0d0f14] border border-gray-200 dark:border-[#2a2d3e] rounded-lg px-3 py-2.5 text-sm
                         text-gray-800 dark:text-slate-200 placeholder:text-gray-300 dark:placeholder:text-[#4a5568]
                         outline-none focus:border-brand-400 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600 dark:text-[#8892a4]">비밀번호</label>
            <input
              type="password" name="password" value={form.password}
              onChange={handleChange} onKeyDown={handleKeyDown}
              placeholder="비밀번호 입력"
              className="w-full bg-gray-50 dark:bg-[#0d0f14] border border-gray-200 dark:border-[#2a2d3e] rounded-lg px-3 py-2.5 text-sm
                         text-gray-800 dark:text-slate-200 placeholder:text-gray-300 dark:placeholder:text-[#4a5568]
                         outline-none focus:border-brand-400 transition-colors"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox" checked={rememberEmail}
              onChange={e => {
                setRememberEmail(e.target.checked)
                if (!e.target.checked) localStorage.removeItem('savedEmail')
              }}
              className="w-4 h-4 accent-brand-500 cursor-pointer"
            />
            <span className="text-xs text-gray-500 dark:text-[#8892a4]">아이디 저장</span>
          </label>

          <button
            onClick={handleSubmit} disabled={loading}
            className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white font-semibold text-sm rounded-lg transition-colors"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </div>

        <p className="text-center text-sm text-gray-400 dark:text-[#6b7280]">
          계정이 없으신가요?{' '}
          <Link to="/register" className="text-brand-500 hover:text-brand-600 font-medium transition-colors">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  )
}
