import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import useAuthStore from '../store/useAuthStore'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const { setUser } = useAuthStore()

  const [form, setForm]     = useState({ email: '', password: '', adminKey: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!form.email || !form.password || !form.adminKey) {
      setError('모든 항목을 입력해주세요.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/admin/login', form)
      const { token, user } = res.data.data
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      setUser(user)
      navigate('/gcp-admin-2026/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || '로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* 로고 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-xl mb-4">
            <span className="text-white text-2xl font-black">G</span>
          </div>
          <h1 className="text-2xl font-bold text-white">GCP 관리자</h1>
          <p className="text-gray-500 text-sm mt-1">관리자 전용 페이지입니다</p>
        </div>

        {/* 폼 */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400">관리자 접근 키</label>
            <input
              type="password"
              value={form.adminKey}
              onChange={e => setForm(p => ({ ...p, adminKey: e.target.value }))}
              placeholder="관리자 접근 키를 입력하세요"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-red-500 transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400">이메일</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              placeholder="admin@example.com"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-red-500 transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400">비밀번호</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="비밀번호"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-red-500 transition-colors"
            />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-800 rounded-lg px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3.5 bg-red-600 hover:bg-red-700 disabled:bg-red-900 text-white font-bold rounded-xl transition-colors"
          >
            {loading ? '로그인 중...' : '관리자 로그인'}
          </button>
        </div>

        <p className="text-center text-gray-700 text-xs mt-6">
          이 페이지는 관리자 전용입니다. 일반 사용자는 접근할 수 없습니다.
        </p>
      </div>
    </div>
  )
}
