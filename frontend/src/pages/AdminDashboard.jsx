import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import useAuthStore from '../store/useAuthStore'
import { LoadingScreen } from '../components/ui'

const TABS = [
  { key: 'stats',    label: '📊 대시보드' },
  { key: 'users',    label: '👥 회원 관리' },
  { key: 'lectures', label: '📚 강의 관리' },
  { key: 'reviews',  label: '⭐ 리뷰 관리' },
]

const GAME_LABEL = {
  lol: 'LoL', valorant: '발로란트', overwatch2: '오버워치2',
  battleground: '배그', tft: 'TFT', starcraft2: 'SC2',
}

export default function AdminDashboard() {
  const navigate  = useNavigate()
  const { user }  = useAuthStore()
  const [tab, setTab]         = useState('stats')
  const [loading, setLoading] = useState(true)
  const [stats, setStats]     = useState(null)
  const [users, setUsers]     = useState([])
  const [lectures, setLectures] = useState([])
  const [reviews, setReviews]   = useState([])
  const [keyword, setKeyword]   = useState('')
  const [toast, setToast]       = useState('')

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/'); return }
    loadData(tab)
  }, [tab])

  const loadData = async (t) => {
    setLoading(true)
    try {
      if (t === 'stats') {
        const res = await api.get('/admin/stats')
        setStats(res.data.data)
      } else if (t === 'users') {
        const res = await api.get('/admin/users')
        setUsers(res.data.data)
      } else if (t === 'lectures') {
        const res = await api.get('/admin/lectures')
        setLectures(res.data.data)
      } else if (t === 'reviews') {
        const res = await api.get('/admin/reviews')
        setReviews(res.data.data)
      }
    } catch {}
    finally { setLoading(false) }
  }

  const handleSearch = async () => {
    setLoading(true)
    try {
      if (tab === 'users') {
        const res = await api.get(`/admin/users?keyword=${keyword}`)
        setUsers(res.data.data)
      } else if (tab === 'lectures') {
        const res = await api.get(`/admin/lectures?keyword=${keyword}`)
        setLectures(res.data.data)
      }
    } catch {}
    finally { setLoading(false) }
  }

  const handleDeactivate = async (id, isActive) => {
    if (!confirm(`해당 회원을 ${isActive ? '비활성화' : '활성화'}하시겠습니까?`)) return
    try {
      await api.put(`/admin/users/${id}/${isActive ? 'deactivate' : 'activate'}`)
      showToast(isActive ? '비활성화됐습니다.' : '활성화됐습니다.')
      loadData('users')
    } catch (err) { showToast(err.response?.data?.message || '오류가 발생했습니다.') }
  }

  const handleLectureStatus = async (id, status) => {
    const next = status === 'active' ? 'inactive' : 'active'
    try {
      await api.put(`/admin/lectures/${id}/status`, { status: next })
      showToast(next === 'active' ? '강의가 활성화됐습니다.' : '강의가 비활성화됐습니다.')
      loadData('lectures')
    } catch (err) { showToast(err.response?.data?.message || '오류가 발생했습니다.') }
  }

  const handleDeleteLecture = async (id) => {
    if (!confirm('강의를 삭제하면 복구할 수 없습니다. 삭제하시겠습니까?')) return
    try {
      await api.delete(`/admin/lectures/${id}`)
      showToast('강의가 삭제됐습니다.')
      loadData('lectures')
    } catch (err) { showToast(err.response?.data?.message || '오류가 발생했습니다.') }
  }

  const handleDeleteReview = async (id) => {
    if (!confirm('리뷰를 삭제하시겠습니까?')) return
    try {
      await api.delete(`/admin/reviews/${id}`)
      showToast('리뷰가 삭제됐습니다.')
      loadData('reviews')
    } catch (err) { showToast(err.response?.data?.message || '오류가 발생했습니다.') }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-5">
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">🛡️ 관리자 대시보드</h1>
        <span className="text-xs text-gray-400">{user?.nickname} (관리자)</span>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 bg-gray-100 dark:bg-[#1a1d2e] p-1 rounded-xl">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors
              ${tab === t.key ? 'bg-white dark:bg-[#13161e] text-brand-500 shadow-sm' : 'text-gray-500 dark:text-[#8892a4] hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <LoadingScreen /> : (
        <>
          {/* 대시보드 통계 */}
          {tab === 'stats' && stats && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: '전체 회원', value: stats.users.total, sub: `학생 ${stats.users.students} / 코치 ${stats.users.coaches}`, color: 'text-brand-500' },
                  { label: '전체 강의', value: stats.lectures.total, sub: `활성 ${stats.lectures.active}개`, color: 'text-green-500' },
                  { label: '총 수강', value: stats.enrollments.total, sub: '승인 완료', color: 'text-blue-500' },
                  { label: '평균 별점', value: Number(stats.reviews.avg_rating || 0).toFixed(1) + '점', sub: `리뷰 ${stats.reviews.total}개`, color: 'text-yellow-500' },
                ].map(s => (
                  <div key={s.label} className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-xl p-4 space-y-1">
                    <p className="text-xs text-gray-400">{s.label}</p>
                    <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-gray-400">{s.sub}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-xl p-4">
                  <p className="text-sm font-bold text-gray-700 dark:text-white mb-3">오늘/이번주 가입</p>
                  <p className="text-3xl font-extrabold text-brand-500">{stats.today_signups}<span className="text-sm text-gray-400 font-normal ml-1">명 오늘</span></p>
                  <p className="text-lg font-bold text-gray-700 dark:text-white mt-1">{stats.week_signups}<span className="text-sm text-gray-400 font-normal ml-1">명 이번주</span></p>
                </div>
                <div className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-xl p-4">
                  <p className="text-sm font-bold text-gray-700 dark:text-white mb-3">게임별 강의 수</p>
                  <div className="space-y-1.5">
                    {stats.game_stats.slice(0, 5).map(g => (
                      <div key={g.game} className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-20 shrink-0">{GAME_LABEL[g.game] || g.game}</span>
                        <div className="flex-1 h-2 bg-gray-100 dark:bg-[#2a2d3e] rounded-full overflow-hidden">
                          <div className="h-full bg-brand-500 rounded-full"
                            style={{ width: `${Math.min((g.count / (stats.game_stats[0]?.count || 1)) * 100, 100)}%` }} />
                        </div>
                        <span className="text-xs text-gray-400 w-6 text-right">{g.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 회원 관리 */}
          {tab === 'users' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input value={keyword} onChange={e => setKeyword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="닉네임 또는 이메일 검색"
                  className="flex-1 bg-white dark:bg-[#13161e] border border-gray-200 dark:border-[#2a2d3e] rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-400" />
                <button onClick={handleSearch} className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm rounded-lg">검색</button>
              </div>
              <div className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-[#1a1d2e]">
                    <tr>
                      {['ID', '닉네임', '이메일', '역할', '게임/티어', '수강/강의', '가입일', '상태', '관리'].map(h => (
                        <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-[#8892a4]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-[#1e2235]">
                    {users.map(u => (
                      <tr key={u.id} className={u.is_active ? '' : 'opacity-50'}>
                        <td className="px-3 py-3 text-gray-400 text-xs">{u.id}</td>
                        <td className="px-3 py-3 font-medium text-gray-800 dark:text-white">{u.nickname}</td>
                        <td className="px-3 py-3 text-gray-500 text-xs">{u.email}</td>
                        <td className="px-3 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-md font-medium
                            ${u.role === 'admin' ? 'bg-red-100 text-red-600' : u.role === 'coach' ? 'bg-brand-100 text-brand-600' : 'bg-gray-100 text-gray-600'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-gray-500 text-xs">{u.game} / {u.tier}</td>
                        <td className="px-3 py-3 text-gray-500 text-xs">{u.enroll_count} / {u.lecture_count}</td>
                        <td className="px-3 py-3 text-gray-400 text-xs">{new Date(u.created_at).toLocaleDateString('ko-KR')}</td>
                        <td className="px-3 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-md ${u.is_active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                            {u.is_active ? '활성' : '비활성'}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          {u.role !== 'admin' && (
                            <button onClick={() => handleDeactivate(u.id, u.is_active)}
                              className={`text-xs px-2 py-1 rounded-lg border transition-colors
                                ${u.is_active ? 'border-red-200 text-red-500 hover:bg-red-50' : 'border-green-200 text-green-500 hover:bg-green-50'}`}>
                              {u.is_active ? '비활성화' : '활성화'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && <p className="text-center py-8 text-gray-400 text-sm">회원이 없습니다.</p>}
              </div>
            </div>
          )}

          {/* 강의 관리 */}
          {tab === 'lectures' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input value={keyword} onChange={e => setKeyword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="강의명 또는 코치명 검색"
                  className="flex-1 bg-white dark:bg-[#13161e] border border-gray-200 dark:border-[#2a2d3e] rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-400" />
                <button onClick={handleSearch} className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm rounded-lg">검색</button>
              </div>
              <div className="space-y-2">
                {lectures.map(l => (
                  <div key={l.id} className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-xl p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-md font-medium
                          ${l.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                          {l.status === 'active' ? '활성' : '비활성'}
                        </span>
                        <span className="text-xs text-gray-400">{GAME_LABEL[l.game] || l.game}</span>
                        <span className="text-xs text-gray-400">코치: {l.coach_nickname}</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white line-clamp-1">{l.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        수강 {l.enroll_count}명 · 평점 {Number(l.avg_rating).toFixed(1)} · {Number(l.price).toLocaleString()}원
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => handleLectureStatus(l.id, l.status)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors
                          ${l.status === 'active' ? 'border-orange-200 text-orange-500 hover:bg-orange-50' : 'border-green-200 text-green-500 hover:bg-green-50'}`}>
                        {l.status === 'active' ? '비활성화' : '활성화'}
                      </button>
                      <button onClick={() => handleDeleteLecture(l.id)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
                {lectures.length === 0 && <p className="text-center py-8 text-gray-400 text-sm">강의가 없습니다.</p>}
              </div>
            </div>
          )}

          {/* 리뷰 관리 */}
          {tab === 'reviews' && (
            <div className="space-y-2">
              {reviews.map(r => (
                <div key={r.id} className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-xl p-4 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-700 dark:text-white">{r.student_nickname}</span>
                      <span className="text-xs text-yellow-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                      <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('ko-KR')}</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-1">강의: {r.lecture_title}</p>
                    <p className="text-sm text-gray-600 dark:text-slate-300">{r.comment}</p>
                  </div>
                  <button onClick={() => handleDeleteReview(r.id)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors shrink-0">
                    삭제
                  </button>
                </div>
              ))}
              {reviews.length === 0 && <p className="text-center py-8 text-gray-400 text-sm">리뷰가 없습니다.</p>}
            </div>
          )}
        </>
      )}
    </div>
  )
}
