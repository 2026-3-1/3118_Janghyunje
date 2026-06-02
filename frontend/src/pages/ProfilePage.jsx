import { useState, useEffect } from 'react'
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

  const [editingNickname, setEditingNickname] = useState(false)
  const [nickname, setNickname] = useState(user?.nickname || '')
  const [nicknameError, setNicknameError] = useState('')
  const [nicknameSaving, setNicknameSaving] = useState(false)

  const [editingPassword, setEditingPassword] = useState(false)
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwError, setPwError] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSaved, setPwSaved] = useState(false)

  const [editingGame, setEditingGame] = useState(false)
  const [gameForm, setGameForm] = useState({ game: user?.game || 'lol', tier: user?.tier || 'gold' })
  const [gameSaving, setGameSaving] = useState(false)

  // 알림 이메일
  const [notifEmail, setNotifEmail] = useState('')
  const [notifSaving, setNotifSaving] = useState(false)
  const [notifSaved, setNotifSaved] = useState(false)
  const [notifError, setNotifError] = useState('')
  const [editingNotif, setEditingNotif] = useState(false)

  // 디스코드 Webhook
  const [discordWebhook, setDiscordWebhook] = useState('')
  const [discordSaving, setDiscordSaving] = useState(false)
  const [discordSaved, setDiscordSaved] = useState(false)
  const [discordError, setDiscordError] = useState('')
  const [editingDiscord, setEditingDiscord] = useState(false)

  const tierOptions = TIER_LIST[gameForm.game] || TIER_LIST.default

  useEffect(() => {
    if (!user) return
    api.get(`/users/${user.id}`)
      .then(res => {
        const data = res.data.data || res.data
        setNotifEmail(data.notification_email || '')
        setDiscordWebhook(data.discord_webhook_url || '')
      })
      .catch(() => {})
  }, [user?.id])

  if (!user) { navigate('/login'); return null }

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
    } finally { setNicknameSaving(false) }
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
      setPwSaved(true); setEditingPassword(false)
      setTimeout(() => setPwSaved(false), 3000)
    } catch (err) {
      setPwError(err.response?.data?.message === '이메일 또는 비밀번호가 올바르지 않습니다.'
        ? '현재 비밀번호가 올바르지 않습니다.' : '비밀번호 변경에 실패했습니다.')
    } finally { setPwSaving(false) }
  }

  const handleSaveGame = async () => {
    setGameSaving(true)
    try {
      await api.put(`/users/${user.id}`, { nickname: user.nickname, game: gameForm.game, tier: gameForm.tier })
      setUser({ ...user, game: gameForm.game, tier: gameForm.tier })
      setEditingGame(false)
    } catch {} finally { setGameSaving(false) }
  }

  const handleSaveNotif = async () => {
    if (notifEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notifEmail)) {
      setNotifError('올바른 이메일 형식을 입력해주세요.'); return
    }
    setNotifSaving(true); setNotifError('')
    try {
      await api.put(`/users/${user.id}`, {
        nickname: user.nickname, game: user.game, tier: user.tier,
        notification_email: notifEmail.trim() || null,
        discord_webhook_url: discordWebhook.trim() || null,
      })
      setNotifSaved(true); setEditingNotif(false)
      setTimeout(() => setNotifSaved(false), 3000)
    } catch (err) {
      setNotifError(err.response?.data?.message || '저장에 실패했습니다.')
    } finally { setNotifSaving(false) }
  }

  const handleSaveDiscord = async () => {
    if (discordWebhook && !discordWebhook.startsWith('https://discord.com/api/webhooks/')) {
      setDiscordError('올바른 디스코드 Webhook URL을 입력해주세요.'); return
    }
    setDiscordSaving(true); setDiscordError('')
    try {
      await api.put(`/users/${user.id}`, {
        nickname: user.nickname, game: user.game, tier: user.tier,
        notification_email: notifEmail.trim() || null,
        discord_webhook_url: discordWebhook.trim() || null,
      })
      setDiscordSaved(true); setEditingDiscord(false)
      setTimeout(() => setDiscordSaved(false), 3000)
    } catch (err) {
      setDiscordError(err.response?.data?.message || '저장에 실패했습니다.')
    } finally { setDiscordSaving(false) }
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

      {/* 기본 정보 */}
      <div className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-2xl p-6">
        <Row label="프로필 사진" value="">
          <div className="flex items-center gap-4 mt-2">
            <div className={`w-20 h-20 rounded-full ${avatarColor} flex items-center justify-center text-3xl font-bold text-white select-none`}>
              {user.nickname?.[0]?.toUpperCase()}
            </div>
            <div className="space-y-2">
              <p className="text-xs text-gray-400">색상을 선택해 프로필을 꾸며보세요</p>
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

        <Row label="닉네임" value={user.nickname}
          onEdit={() => { setEditingNickname(true); setNickname(user.nickname) }}
          editing={editingNickname}>
          <div className="mt-2 space-y-2">
            <input type="text" value={nickname} onChange={e => { setNickname(e.target.value); setNicknameError('') }} className={inputCls(!!nicknameError)} placeholder="닉네임 입력" />
            {nicknameError && <p className="text-xs text-red-500">{nicknameError}</p>}
            <div className="flex gap-2">
              <button onClick={handleSaveNickname} disabled={nicknameSaving} className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white text-sm font-semibold rounded-lg transition-colors">{nicknameSaving ? '저장 중...' : '저장'}</button>
              <button onClick={() => { setEditingNickname(false); setNicknameError('') }} className="px-4 py-2 border border-gray-200 dark:border-[#2a2d3e] text-gray-500 text-sm rounded-lg hover:border-gray-400 transition-colors">취소</button>
            </div>
          </div>
        </Row>

        <Row label="이메일 주소" value={user.email}>
          <p className="text-xs text-gray-400 mt-0.5">이메일은 변경할 수 없습니다.</p>
        </Row>

        <Row label="주 게임 / 티어"
          value={`${GAME_LIST.find(g => g.value === user.game)?.label || user.game || '미설정'} · ${user.tier || '미설정'}`}
          onEdit={() => setEditingGame(true)} editing={editingGame}>
          <div className="mt-2 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <select value={gameForm.game} onChange={e => setGameForm(p => ({ ...p, game: e.target.value, tier: 'gold' }))} className="bg-gray-50 dark:bg-[#0d0f14] border border-gray-200 dark:border-[#2a2d3e] rounded-lg px-3 py-2.5 text-sm text-gray-800 dark:text-slate-200 outline-none focus:border-brand-400 cursor-pointer">
                {GAME_LIST.filter(g => g.value !== 'all').map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
              <select value={gameForm.tier} onChange={e => setGameForm(p => ({ ...p, tier: e.target.value }))} className="bg-gray-50 dark:bg-[#0d0f14] border border-gray-200 dark:border-[#2a2d3e] rounded-lg px-3 py-2.5 text-sm text-gray-800 dark:text-slate-200 outline-none focus:border-brand-400 cursor-pointer">
                {tierOptions.filter(t => t.value !== 'all').map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSaveGame} disabled={gameSaving} className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white text-sm font-semibold rounded-lg transition-colors">{gameSaving ? '저장 중...' : '저장'}</button>
              <button onClick={() => setEditingGame(false)} className="px-4 py-2 border border-gray-200 dark:border-[#2a2d3e] text-gray-500 text-sm rounded-lg hover:border-gray-400 transition-colors">취소</button>
            </div>
          </div>
        </Row>

        <Row label="역할" value={user.role === 'coach' ? '코치 (강의 등록 가능)' : '학생 (강의 수강)'} />
      </div>

      {/* 비밀번호 변경 */}
      <div className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-white">비밀번호</p>
            <p className="text-sm text-gray-500 dark:text-[#8892a4] mt-0.5">{pwSaved ? '✓ 비밀번호가 변경되었습니다.' : '보안을 위해 주기적으로 변경해주세요.'}</p>
          </div>
          {!editingPassword && <button onClick={() => setEditingPassword(true)} className="ml-4 px-4 py-1.5 border border-gray-200 dark:border-[#2a2d3e] rounded-lg text-sm text-gray-600 dark:text-slate-300 hover:border-brand-400 hover:text-brand-500 transition-colors shrink-0">변경</button>}
        </div>
        {editingPassword && (
          <div className="mt-4 space-y-3">
            {pwError && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2.5 text-sm text-red-600 dark:text-red-400">{pwError}</div>}
            {[['현재 비밀번호', 'current'], ['새 비밀번호', 'next'], ['새 비밀번호 확인', 'confirm']].map(([label, key]) => (
              <div key={key} className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 dark:text-[#8892a4]">{label}</label>
                <input type="password" value={pwForm[key]} onChange={e => { setPwForm(p => ({ ...p, [key]: e.target.value })); setPwError('') }} placeholder={label} className={inputCls(!!pwError)} />
              </div>
            ))}
            <div className="flex gap-2">
              <button onClick={handleSavePassword} disabled={pwSaving} className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white text-sm font-semibold rounded-lg transition-colors">{pwSaving ? '변경 중...' : '비밀번호 변경'}</button>
              <button onClick={() => { setEditingPassword(false); setPwError(''); setPwForm({ current: '', next: '', confirm: '' }) }} className="px-4 py-2 border border-gray-200 dark:border-[#2a2d3e] text-gray-500 text-sm rounded-lg hover:border-gray-400 transition-colors">취소</button>
            </div>
          </div>
        )}
      </div>

      {/* 알림 설정 */}
      <div className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-2xl p-6 space-y-5">
        <div>
          <h2 className="text-sm font-bold text-gray-700 dark:text-white">🔔 알림 설정</h2>
          <p className="text-xs text-gray-400 mt-1">아래 이벤트 발생 시 설정한 채널로 알림을 받아요.</p>
        </div>

        <div className="bg-gray-50 dark:bg-[#0d0f14] rounded-xl p-4 space-y-1.5 text-xs text-gray-500 dark:text-[#8892a4]">
          <p>📚 팔로우한 코치의 새 강의 등록</p>
          <p>💬 Q&A에 코치 답변이 달렸을 때</p>
          <p>📊 성장 분석 리포트가 작성됐을 때</p>
        </div>

        {/* 이메일 알림 */}
        <div className="border-t border-gray-100 dark:border-[#1e2235] pt-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-700 dark:text-white">📧 이메일 알림</p>
              <p className="text-sm text-gray-500 dark:text-[#8892a4] mt-0.5">
                {notifSaved ? '✓ 저장됐습니다.' : notifEmail || '설정 안 됨'}
              </p>
            </div>
            {!editingNotif && (
              <button onClick={() => setEditingNotif(true)} className="ml-4 px-4 py-1.5 border border-gray-200 dark:border-[#2a2d3e] rounded-lg text-sm text-gray-600 dark:text-slate-300 hover:border-brand-400 hover:text-brand-500 transition-colors shrink-0">편집</button>
            )}
          </div>
          {editingNotif && (
            <div className="mt-3 space-y-3">
              <input type="email" value={notifEmail} onChange={e => { setNotifEmail(e.target.value); setNotifError('') }} placeholder="알림받을이메일@example.com" className={inputCls(!!notifError)} />
              {notifError && <p className="text-xs text-red-500">{notifError}</p>}
              <p className="text-xs text-gray-400">비워두면 이메일 알림을 받지 않습니다.</p>
              <div className="flex gap-2">
                <button onClick={handleSaveNotif} disabled={notifSaving} className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white text-sm font-semibold rounded-lg transition-colors">{notifSaving ? '저장 중...' : '저장'}</button>
                <button onClick={() => { setEditingNotif(false); setNotifError('') }} className="px-4 py-2 border border-gray-200 dark:border-[#2a2d3e] text-gray-500 text-sm rounded-lg hover:border-gray-400 transition-colors">취소</button>
              </div>
            </div>
          )}
        </div>

        {/* 디스코드 Webhook 알림 */}
        <div className="border-t border-gray-100 dark:border-[#1e2235] pt-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-700 dark:text-white">
                <span className="mr-1">🎮</span> 디스코드 알림
              </p>
              <p className="text-sm text-gray-500 dark:text-[#8892a4] mt-0.5">
                {discordSaved ? '✓ 저장됐습니다.' : discordWebhook ? '✓ Webhook 설정됨' : '설정 안 됨'}
              </p>
            </div>
            {!editingDiscord && (
              <button onClick={() => setEditingDiscord(true)} className="ml-4 px-4 py-1.5 border border-gray-200 dark:border-[#2a2d3e] rounded-lg text-sm text-gray-600 dark:text-slate-300 hover:border-brand-400 hover:text-brand-500 transition-colors shrink-0">편집</button>
            )}
          </div>
          {editingDiscord && (
            <div className="mt-3 space-y-3">
              <input type="text" value={discordWebhook} onChange={e => { setDiscordWebhook(e.target.value); setDiscordError('') }}
                placeholder="https://discord.com/api/webhooks/..."
                className={inputCls(!!discordError)} />
              {discordError && <p className="text-xs text-red-500">{discordError}</p>}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 space-y-1 text-xs text-blue-600 dark:text-blue-400">
                <p className="font-semibold">📖 디스코드 Webhook URL 발급 방법</p>
                <p>1. 디스코드 서버 → 채널 편집 → 연동 탭</p>
                <p>2. 웹후크 → 새 웹후크 → URL 복사</p>
                <p>3. 복사한 URL을 위에 붙여넣기</p>
              </div>
              <p className="text-xs text-gray-400">비워두면 디스코드 알림을 받지 않습니다.</p>
              <div className="flex gap-2">
                <button onClick={handleSaveDiscord} disabled={discordSaving} className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white text-sm font-semibold rounded-lg transition-colors">{discordSaving ? '저장 중...' : '저장'}</button>
                <button onClick={() => { setEditingDiscord(false); setDiscordError('') }} className="px-4 py-2 border border-gray-200 dark:border-[#2a2d3e] text-gray-500 text-sm rounded-lg hover:border-gray-400 transition-colors">취소</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
