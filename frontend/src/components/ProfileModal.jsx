import { useState } from 'react'
import api from '../services/api'
import useAuthStore from '../store/useAuthStore'

const AVATAR_COLORS = [
  'bg-indigo-500', 'bg-violet-500', 'bg-pink-500', 'bg-rose-500',
  'bg-orange-500', 'bg-amber-500', 'bg-teal-500', 'bg-cyan-500',
  'bg-sky-500', 'bg-green-500',
]

const TABS = [
  { key: 'profile',  label: '프로필' },
  { key: 'password', label: '비밀번호' },
]

export default function ProfileModal({ onClose }) {
  const { user, setUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState('profile')

  const savedColor = localStorage.getItem('avatarColor') || AVATAR_COLORS[0]
  const [avatarColor, setAvatarColor] = useState(savedColor)
  const [nickname, setNickname] = useState(user?.nickname || '')
  const [nicknameError, setNicknameError] = useState('')
  const [nicknameSaving, setNicknameSaving] = useState(false)
  const [nicknameSaved, setNicknameSaved] = useState(false)

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwError, setPwError] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSaved, setPwSaved] = useState(false)

  const handleAvatarColor = (color) => {
    setAvatarColor(color)
    localStorage.setItem('avatarColor', color)
  }

  const handleSaveNickname = async () => {
    if (!nickname.trim()) { setNicknameError('닉네임을 입력해주세요.'); return }
    if (nickname === user.nickname) { setNicknameError('현재 닉네임과 동일합니다.'); return }
    setNicknameSaving(true); setNicknameError('')
    try {
      await api.put(`/users/${user.id}`, { nickname, game: user.game, tier: user.tier })
      setUser({ ...user, nickname })
      setNicknameSaved(true)
      setTimeout(() => setNicknameSaved(false), 2000)
    } catch (err) {
      setNicknameError(err.response?.data?.message || '닉네임 변경에 실패했습니다.')
    } finally {
      setNicknameSaving(false)
    }
  }

  const handleSavePassword = async () => {
    setPwError('')
    if (!pwForm.current) { setPwError('현재 비밀번호를 입력해주세요.'); return }
    if (!pwForm.next || pwForm.next.length < 4) { setPwError('새 비밀번호는 4자 이상이어야 합니다.'); return }
    if (pwForm.next !== pwForm.confirm) { setPwError('새 비밀번호가 일치하지 않습니다.'); return }
    setPwSaving(true)
    try {
      await api.post('/login', { email: user.email, password: pwForm.current })
      await api.put(`/users/${user.id}`, { nickname: user.nickname, game: user.game, tier: user.tier, password: pwForm.next })
      setPwForm({ current: '', next: '', confirm: '' })
      setPwSaved(true)
      setTimeout(() => setPwSaved(false), 2000)
    } catch (err) {
      setPwError(err.response?.data?.message === '이메일 또는 비밀번호가 올바르지 않습니다.'
        ? '현재 비밀번호가 올바르지 않습니다.' : '비밀번호 변경에 실패했습니다.')
    } finally {
      setPwSaving(false)
    }
  }

  const inputCls = (err) =>
    `w-full bg-gray-50 dark:bg-[#0d0f14] border rounded-lg px-3 py-2.5 text-sm text-gray-800 dark:text-slate-200
     outline-none transition-colors ${err
       ? 'border-red-400 focus:border-red-400'
       : 'border-gray-200 dark:border-[#2a2d3e] focus:border-brand-400'}`

  return (
    // 배경 오버레이
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>

      <div className="bg-white dark:bg-[#13161e] rounded-2xl border border-gray-100 dark:border-[#1e2235] w-full max-w-md shadow-2xl">

        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 dark:border-[#1e2235]">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">프로필 설정</h2>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2a2d3e] transition-colors text-sm">
            ✕
          </button>
        </div>

        {/* 아바타 + 이름 */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50 dark:border-[#1e2235]">
          <div className={`w-12 h-12 rounded-full ${avatarColor} flex items-center justify-center text-lg font-bold text-white select-none shrink-0`}>
            {user?.nickname?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.nickname}</p>
            <p className="text-xs text-gray-400 dark:text-[#6b7280]">{user?.email}</p>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex gap-1 mx-5 mt-4 bg-gray-100 dark:bg-[#0d0f14] p-1 rounded-xl">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${activeTab === tab.key
                  ? 'bg-white dark:bg-[#1a1d2e] text-brand-500 shadow-sm'
                  : 'text-gray-500 dark:text-[#8892a4] hover:text-gray-700 dark:hover:text-white'
                }`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="px-5 py-4 space-y-4">

          {/* 프로필 탭 */}
          {activeTab === 'profile' && (
            <>
              {/* 닉네임 */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 dark:text-[#8892a4]">닉네임</label>
                <div className="flex gap-2">
                  <input type="text" value={nickname}
                    onChange={e => { setNickname(e.target.value); setNicknameError('') }}
                    className={inputCls(!!nicknameError)} placeholder="닉네임 입력" />
                  <button onClick={handleSaveNickname} disabled={nicknameSaving}
                    className={`px-4 py-2 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap
                      ${nicknameSaved ? 'bg-green-500' : 'bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300'}`}>
                    {nicknameSaved ? '✓ 저장됨' : nicknameSaving ? '...' : '저장'}
                  </button>
                </div>
                {nicknameError && <p className="text-xs text-red-500">{nicknameError}</p>}
              </div>

              {/* 프로필 색상 */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-500 dark:text-[#8892a4]">프로필 색상</label>
                <div className="flex gap-2 flex-wrap">
                  {AVATAR_COLORS.map(c => (
                    <button key={c} onClick={() => handleAvatarColor(c)}
                      className={`w-8 h-8 rounded-full ${c} hover:scale-110 transition-transform
                        ${avatarColor === c ? 'ring-2 ring-offset-2 ring-brand-500' : ''}`} />
                  ))}
                </div>
                {/* 미리보기 */}
                <div className="flex items-center gap-2 mt-1 p-3 bg-gray-50 dark:bg-[#0d0f14] rounded-xl">
                  <div className={`w-9 h-9 rounded-full ${avatarColor} flex items-center justify-center text-sm font-bold text-white select-none`}>
                    {user?.nickname?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-slate-300">{user?.nickname}</p>
                    <p className="text-xs text-gray-400 dark:text-[#6b7280]">미리보기</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 비밀번호 탭 */}
          {activeTab === 'password' && (
            <>
              {pwError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
                  {pwError}
                </div>
              )}
              {pwSaved && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-2.5 text-sm text-green-600 dark:text-green-400">
                  ✓ 비밀번호가 변경되었습니다.
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 dark:text-[#8892a4]">현재 비밀번호</label>
                <input type="password" value={pwForm.current}
                  onChange={e => { setPwForm(p => ({ ...p, current: e.target.value })); setPwError('') }}
                  placeholder="현재 비밀번호" className={inputCls(!!pwError)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 dark:text-[#8892a4]">새 비밀번호</label>
                <input type="password" value={pwForm.next}
                  onChange={e => { setPwForm(p => ({ ...p, next: e.target.value })); setPwError('') }}
                  placeholder="4자 이상" className={inputCls(!!pwError)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 dark:text-[#8892a4]">새 비밀번호 확인</label>
                <input type="password" value={pwForm.confirm}
                  onChange={e => { setPwForm(p => ({ ...p, confirm: e.target.value })); setPwError('') }}
                  placeholder="새 비밀번호 재입력" className={inputCls(!!pwError)} />
              </div>
              <button onClick={handleSavePassword} disabled={pwSaving}
                className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white text-sm font-semibold rounded-lg transition-colors">
                {pwSaving ? '변경 중...' : '비밀번호 변경'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
