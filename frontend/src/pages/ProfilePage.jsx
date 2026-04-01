import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import useAuthStore from '../store/useAuthStore'
import { GAME_LIST, TIER_LIST } from '../constants/games'

const AVATAR_COLORS = [
  'bg-indigo-500', 'bg-violet-500', 'bg-pink-500', 'bg-rose-500',
  'bg-orange-500', 'bg-amber-500', 'bg-teal-500', 'bg-cyan-500',
  'bg-sky-500', 'bg-green-500',
]

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, setUser } = useAuthStore()
  const savedColor = localStorage.getItem('avatarColor') || AVATAR_COLORS[0]
  const [avatarColor, setAvatarColor] = useState(savedColor)

  // 닉네임
  const [editingNickname, setEditingNickname] = useState(false)
  const [nickname, setNickname] = useState(user?.nickname || '')
  const [nicknameError, setNicknameError] = useState('')
  const [nicknameSaving, setNicknameSaving] = useState(false)

  // 비밀번호
  const [editingPassword, setEditingPassword] = useState(false)
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwError, setPwError] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSaved, setPwSaved] = useState(false)

  // 게임/티어
  const [editingGame, setEditingGame] = useState(false)
  const [gameForm, setGameForm] = useState({ game: user?.game || 'lol', tier: user?.tier || 'gold' })
  const [gameSaving, setGameSaving] = useState(false)
  const [gameSaved, setGameSaved] = useState(false)

  const tierOptions = TIER_LIST[gameForm.game] || TIER_LIST.default

  if (!user) {
    navigate('/login')
    return null
  }

  const handleAvatarColor = (color) => {
    setAvatarColor(color)
    localStorage.setItem('avatarColor', color)
  }

  const handleSaveNickname = async () => {
    if (!nickname.trim()) { setNicknameError('닉네임을 입력해주세요.'); return }
    if (nickname === user.nickname) { setEditingNickname(false); return }
    setNicknameSaving(true); setNicknameError('')
    try {
      await api.put(`/users/${user.id}`, { nickname, game: user.game, tier: user.tier })
      setUser({ ...user, nickname })
      setEditingNickname(false)
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
      setEditingPassword(false)
      setTimeout(() => setPwSaved(false), 3000)
    } catch (err) {
      setPwError(err.response?.data?.message === '이메일 또는 비밀번호가 올바르지 않습니다.'
        ? '현재 비밀번호가 올바르지 않습니다.' : '비밀번호 변경에 실패했습니다.')
    } finally {
      setPwSaving(false)
    }
  }

  const handleSaveGame = async () => {
    setGameSaving(true)
    try {
      await api.put(`/users/${user.id}`, { nickname: user.nickname, game: gameForm.game, tier: gameForm.tier })
      setUser({ ...user, game: gameForm.game, tier: gameForm.tier })
      setGameSaved(true)
      setEditingGame(false)
      setTimeout(() => setGameSaved(false), 2000)
    } catch {
    } finally {
      setGameSaving(false)
    }
  }

  const inputCls = (err) =>
    `w-full bg-gray-50 dark:bg-[#0d0f14] border rounded-lg px-3 py-2.5 text-sm text-gray-800 dark:text-slate-200
     outline-none transition-colors ${err
       ? 'border-red-400 focus:border-red-400'
       : 'border-gray-200 dark:border-[#2a2d3e] focus:border-brand-400'}`

  const Row = ({ label, value, onEdit, children, editing }) => (
    <div className="flex items-start justify-between py-5 border-b border-gray-100 dark:border-[#1e2235] last:border-0">
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-semibold text-gray-700 dark:text-white">{label}</p>
        {!editing && <p className="text-sm text-gray-500 dark:text-[#8892a4]">{value}</p>}
        {editing && children}
      </div>
      {!editing && onEdit && (
        <button onClick={onEdit}
          className="ml-4 px-4 py-1.5 border border-gray-200 dark:border-[#2a2d3e] rounded-lg text-sm text-gray-600 dark:text-slate-300
                     hover:border-brand-400 hover:text-brand-500 transition-colors shrink-0">
          편집
        </button>
      )}
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">프로필</h1>

      {/* 프로필 사진 섹션 */}
      <div className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-2xl p-6">
        <Row label="프로필 사진" value="">
          <div className="flex items-center gap-4 mt-2">
            <div className={`w-20 h-20 rounded-full ${avatarColor} flex items-center justify-center text-3xl font-bold text-white select-none`}>
              {user.nickname?.[0]?.toUpperCase()}
            </div>
            <div className="space-y-2">
              <p className="text-xs text-gray-400 dark:text-[#6b7280]">색상을 선택해 프로필을 꾸며보세요</p>
              <div className="flex gap-2 flex-wrap">
                {AVATAR_COLORS.map(c => (
                  <button key={c} onClick={() => handleAvatarColor(c)}
                    className={`w-8 h-8 rounded-full ${c} hover:scale-110 transition-transform
                      ${avatarColor === c ? 'ring-2 ring-offset-2 ring-brand-500 dark:ring-offset-[#13161e]' : ''}`} />
                ))}
              </div>
            </div>
          </div>
        </Row>

        {/* 닉네임 */}
        <Row
          label="닉네임"
          value={user.nickname}
          onEdit={() => { setEditingNickname(true); setNickname(user.nickname) }}
          editing={editingNickname}
        >
          <div className="mt-2 space-y-2">
            <input type="text" value={nickname}
              onChange={e => { setNickname(e.target.value); setNicknameError('') }}
              className={inputCls(!!nicknameError)} placeholder="닉네임 입력" />
            {nicknameError && <p className="text-xs text-red-500">{nicknameError}</p>}
            <div className="flex gap-2">
              <button onClick={handleSaveNickname} disabled={nicknameSaving}
                className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white text-sm font-semibold rounded-lg transition-colors">
                {nicknameSaving ? '저장 중...' : '저장'}
              </button>
              <button onClick={() => { setEditingNickname(false); setNicknameError('') }}
                className="px-4 py-2 border border-gray-200 dark:border-[#2a2d3e] text-gray-500 dark:text-[#8892a4] text-sm rounded-lg hover:border-gray-400 transition-colors">
                취소
              </button>
            </div>
          </div>
        </Row>

        {/* 이메일 */}
        <Row label="이메일 주소" value={user.email}>
          <p className="text-xs text-gray-400 dark:text-[#4a5568] mt-0.5">이메일은 변경할 수 없습니다.</p>
        </Row>

        {/* 게임 / 티어 */}
        <Row
          label="주 게임 / 티어"
          value={`${GAME_LIST.find(g => g.value === user.game)?.label || user.game || '미설정'} · ${user.tier || '미설정'}`}
          onEdit={() => setEditingGame(true)}
          editing={editingGame}
        >
          <div className="mt-2 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <select value={gameForm.game}
                onChange={e => setGameForm(p => ({ ...p, game: e.target.value, tier: 'gold' }))}
                className="bg-gray-50 dark:bg-[#0d0f14] border border-gray-200 dark:border-[#2a2d3e] rounded-lg px-3 py-2.5 text-sm text-gray-800 dark:text-slate-200 outline-none focus:border-brand-400 cursor-pointer">
                {GAME_LIST.filter(g => g.value !== 'all').map(g => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
              <select value={gameForm.tier}
                onChange={e => setGameForm(p => ({ ...p, tier: e.target.value }))}
                className="bg-gray-50 dark:bg-[#0d0f14] border border-gray-200 dark:border-[#2a2d3e] rounded-lg px-3 py-2.5 text-sm text-gray-800 dark:text-slate-200 outline-none focus:border-brand-400 cursor-pointer">
                {tierOptions.filter(t => t.value !== 'all').map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSaveGame} disabled={gameSaving}
                className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white text-sm font-semibold rounded-lg transition-colors">
                {gameSaving ? '저장 중...' : '저장'}
              </button>
              <button onClick={() => setEditingGame(false)}
                className="px-4 py-2 border border-gray-200 dark:border-[#2a2d3e] text-gray-500 dark:text-[#8892a4] text-sm rounded-lg hover:border-gray-400 transition-colors">
                취소
              </button>
            </div>
          </div>
        </Row>

        {/* 역할 */}
        <Row
          label="역할"
          value={user.role === 'coach' ? '코치 (강의 등록 가능)' : '학생 (강의 수강)'}
        />
      </div>

      {/* 비밀번호 변경 섹션 */}
      <div className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-white">비밀번호</p>
            <p className="text-sm text-gray-500 dark:text-[#8892a4] mt-0.5">
              {pwSaved ? '✓ 비밀번호가 변경되었습니다.' : '보안을 위해 주기적으로 변경해주세요.'}
            </p>
          </div>
          {!editingPassword && (
            <button onClick={() => setEditingPassword(true)}
              className="ml-4 px-4 py-1.5 border border-gray-200 dark:border-[#2a2d3e] rounded-lg text-sm text-gray-600 dark:text-slate-300
                         hover:border-brand-400 hover:text-brand-500 transition-colors shrink-0">
              변경
            </button>
          )}
        </div>

        {editingPassword && (
          <div className="mt-4 space-y-3">
            {pwError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
                {pwError}
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
            <div className="flex gap-2">
              <button onClick={handleSavePassword} disabled={pwSaving}
                className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white text-sm font-semibold rounded-lg transition-colors">
                {pwSaving ? '변경 중...' : '비밀번호 변경'}
              </button>
              <button onClick={() => { setEditingPassword(false); setPwError(''); setPwForm({ current: '', next: '', confirm: '' }) }}
                className="px-4 py-2 border border-gray-200 dark:border-[#2a2d3e] text-gray-500 dark:text-[#8892a4] text-sm rounded-lg hover:border-gray-400 transition-colors">
                취소
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
