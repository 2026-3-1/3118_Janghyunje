import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import useAuthStore from '../store/useAuthStore'

const GAME_LABEL = {
  lol: 'LoL', valorant: '발로란트', overwatch2: '오버워치2',
  battleground: '배그', tft: 'TFT', starcraft2: 'SC2',
}

const TABS = [
  { key: 'stats',    icon: '📊', label: '대시보드' },
  { key: 'users',    icon: '👥', label: '회원 관리' },
  { key: 'lectures', icon: '📚', label: '강의 관리' },
  { key: 'reviews',  icon: '⭐', label: '리뷰 관리' },
  { key: 'refunds',  icon: '💰', label: '환불 내역' },
]

function StatCard({ label, value, sub, color = 'red' }) {
  const colors = {
    red:    'border-red-800 bg-red-950/30',
    blue:   'border-blue-800 bg-blue-950/30',
    green:  'border-green-800 bg-green-950/30',
    yellow: 'border-yellow-800 bg-yellow-950/30',
  }
  return (
    <div className={`border rounded-xl p-5 ${colors[color]}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-3xl font-bold text-white">{value ?? '-'}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

export default function AdminDashboard() {
  const navigate  = useNavigate()
  const { user, setUser } = useAuthStore()

  const [tab, setTab]         = useState('stats')
  const [loading, setLoading] = useState(true)
  const [stats, setStats]     = useState(null)
  const [users, setUsers]     = useState([])
  const [lectures, setLectures] = useState([])
  const [reviews, setReviews]   = useState([])
  const [refunds, setRefunds]   = useState([])
  const [keyword, setKeyword]   = useState('')
  const [toast, setToast]       = useState('')

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/gcp-admin-2026', { replace: true })
      return
    }
    fetchStats()
  }, [user])

  useEffect(() => {
    if (!user || user.role !== 'admin') return
    if (tab === 'users')    fetchUsers()
    if (tab === 'lectures') fetchLectures()
    if (tab === 'reviews')  fetchReviews()
    if (tab === 'refunds')  fetchRefunds()
  }, [tab])

  const fetchStats    = async () => { try { setLoading(true); const r = await api.get('/admin/stats');    setStats(r.data.data)    } catch {} finally { setLoading(false) } }
  const fetchUsers    = async () => { try { const r = await api.get('/admin/users');    setUsers(r.data.data)    } catch {} }
  const fetchLectures = async () => { try { const r = await api.get('/admin/lectures'); setLectures(r.data.data) } catch {} }
  const fetchReviews  = async () => { try { const r = await api.get('/admin/reviews');  setReviews(r.data.data)  } catch {} }
  const fetchRefunds  = async () => { try { const r = await api.get('/admin/refunds');  setRefunds(r.data.data)  } catch {} }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    navigate('/gcp-admin-2026', { replace: true })
  }

  const handleDeactivate = async (id) => {
    try { await api.put(`/admin/users/${id}/deactivate`); showToast('비활성화됐습니다.'); fetchUsers() } catch { showToast('오류가 발생했습니다.') }
  }
  const handleActivate = async (id) => {
    try { await api.put(`/admin/users/${id}/activate`); showToast('활성화됐습니다.'); fetchUsers() } catch { showToast('오류가 발생했습니다.') }
  }
  const handleDeleteReview = async (id) => {
    if (!confirm('리뷰를 삭제하시겠습니까?')) return
    try { await api.delete(`/admin/reviews/${id}`); showToast('삭제됐습니다.'); fetchReviews() } catch { showToast('오류가 발생했습니다.') }
  }
  const handleLectureStatus = async (id, status) => {
    try { await api.put(`/admin/lectures/${id}/status`, { status }); showToast('상태가 변경됐습니다.'); fetchLectures() } catch { showToast('오류가 발생했습니다.') }
  }

  const filtered = {
    users:    users.filter(u => u.nickname?.includes(keyword) || u.email?.includes(keyword)),
    lectures: lectures.filter(l => l.title?.includes(keyword) || l.coach_nickname?.includes(keyword)),
    reviews:  reviews.filter(r => r.comment?.includes(keyword) || r.lecture_title?.includes(keyword)),
    refunds:  refunds.filter(r => r.lecture_title?.includes(keyword) || r.student_nickname?.includes(keyword)),
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-800 border border-gray-700 text-white text-sm px-4 py-3 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {/* 사이드바 */}
      <aside className="w-60 bg-gray-900 border-r border-gray-800 flex flex-col min-h-screen fixed left-0 top-0">
        {/* 로고 */}
        <div className="px-6 py-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-600 rounded-lg flex items-center justify-center text-white font-black text-lg">G</div>
            <div>
              <p className="text-white font-bold text-sm">GCP 관리자</p>
              <p className="text-gray-500 text-xs">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* 메뉴 */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left
                ${tab === t.key ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>

        {/* 로그아웃 */}
        <div className="px-3 py-4 border-t border-gray-800">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-gray-800 hover:text-white transition-colors">
            <span>🚪</span> 로그아웃
          </button>
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="ml-60 flex-1 p-8">

        {/* 검색 바 (stats 제외) */}
        {tab !== 'stats' && (
          <div className="mb-6 flex items-center gap-3">
            <h1 className="text-xl font-bold text-white shrink-0">
              {TABS.find(t => t.key === tab)?.icon} {TABS.find(t => t.key === tab)?.label}
            </h1>
            <input value={keyword} onChange={e => setKeyword(e.target.value)}
              placeholder="검색..."
              className="ml-auto bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-red-500 w-64 transition-colors" />
          </div>
        )}

        {/* ── 대시보드 ── */}
        {tab === 'stats' && (
          <div className="space-y-6">
            <h1 className="text-xl font-bold text-white">📊 대시보드</h1>
            {loading ? (
              <div className="text-gray-500 text-sm">로딩 중...</div>
            ) : stats ? (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label="전체 회원"  value={stats.totalUsers}    sub={`코치 ${stats.coaches} / 학생 ${stats.students}`} color="blue" />
                  <StatCard label="전체 강의"  value={stats.totalLectures} sub={`활성 ${stats.activeLectures}개`}                color="green" />
                  <StatCard label="전체 수강"  value={stats.totalApplications} sub="승인 완료 건수"                              color="yellow" />
                  <StatCard label="전체 리뷰"  value={stats.totalReviews}  sub={`평균 ${Number(stats.avgRating||0).toFixed(1)}점`} color="red" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <StatCard label="이번 주 신규 가입" value={stats.newUsersThisWeek}    sub="7일 이내" color="blue" />
                  <StatCard label="이번 주 신규 강의" value={stats.newLecturesThisWeek} sub="7일 이내" color="green" />
                </div>
              </>
            ) : <p className="text-gray-500">데이터를 불러올 수 없습니다.</p>}
          </div>
        )}

        {/* ── 회원 관리 ── */}
        {tab === 'users' && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 text-xs">
                  <th className="text-left px-4 py-3">닉네임</th>
                  <th className="text-left px-4 py-3">이메일</th>
                  <th className="text-left px-4 py-3">역할</th>
                  <th className="text-left px-4 py-3">게임</th>
                  <th className="text-left px-4 py-3">상태</th>
                  <th className="text-left px-4 py-3">가입일</th>
                  <th className="text-left px-4 py-3">관리</th>
                </tr>
              </thead>
              <tbody>
                {filtered.users.map(u => (
                  <tr key={u.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{u.nickname}</td>
                    <td className="px-4 py-3 text-gray-400">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                        ${u.role === 'admin' ? 'bg-red-900/50 text-red-400' :
                          u.role === 'coach' ? 'bg-blue-900/50 text-blue-400' :
                          'bg-gray-800 text-gray-400'}`}>
                        {u.role === 'admin' ? '관리자' : u.role === 'coach' ? '코치' : '학생'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{GAME_LABEL[u.game] || u.game || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_active ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                        {u.is_active ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{new Date(u.created_at).toLocaleDateString('ko-KR')}</td>
                    <td className="px-4 py-3">
                      {u.role !== 'admin' && (
                        u.is_active
                          ? <button onClick={() => handleDeactivate(u.id)} className="text-xs px-2.5 py-1 bg-red-900/50 text-red-400 rounded-lg hover:bg-red-800/50 transition-colors">비활성화</button>
                          : <button onClick={() => handleActivate(u.id)}   className="text-xs px-2.5 py-1 bg-green-900/50 text-green-400 rounded-lg hover:bg-green-800/50 transition-colors">활성화</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.users.length === 0 && <p className="text-center text-gray-600 py-10 text-sm">데이터가 없습니다.</p>}
          </div>
        )}

        {/* ── 강의 관리 ── */}
        {tab === 'lectures' && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 text-xs">
                  <th className="text-left px-4 py-3">강의명</th>
                  <th className="text-left px-4 py-3">코치</th>
                  <th className="text-left px-4 py-3">게임</th>
                  <th className="text-left px-4 py-3">가격</th>
                  <th className="text-left px-4 py-3">수강생</th>
                  <th className="text-left px-4 py-3">상태</th>
                  <th className="text-left px-4 py-3">관리</th>
                </tr>
              </thead>
              <tbody>
                {filtered.lectures.map(l => (
                  <tr key={l.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 text-white max-w-[220px] truncate">{l.title}</td>
                    <td className="px-4 py-3 text-gray-400">{l.coach_nickname}</td>
                    <td className="px-4 py-3 text-gray-400">{GAME_LABEL[l.game] || l.game}</td>
                    <td className="px-4 py-3 text-gray-300">{Number(l.price).toLocaleString()}원</td>
                    <td className="px-4 py-3 text-gray-400">{l.enroll_count || 0}명</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full
                        ${l.status === 'active' ? 'bg-green-900/50 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                        {l.status === 'active' ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex gap-1.5">
                      {l.status === 'active'
                        ? <button onClick={() => handleLectureStatus(l.id, 'inactive')} className="text-xs px-2.5 py-1 bg-red-900/50 text-red-400 rounded-lg hover:bg-red-800/50 transition-colors">비활성화</button>
                        : <button onClick={() => handleLectureStatus(l.id, 'active')}   className="text-xs px-2.5 py-1 bg-green-900/50 text-green-400 rounded-lg hover:bg-green-800/50 transition-colors">활성화</button>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.lectures.length === 0 && <p className="text-center text-gray-600 py-10 text-sm">데이터가 없습니다.</p>}
          </div>
        )}

        {/* ── 리뷰 관리 ── */}
        {tab === 'reviews' && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 text-xs">
                  <th className="text-left px-4 py-3">강의명</th>
                  <th className="text-left px-4 py-3">작성자</th>
                  <th className="text-left px-4 py-3">별점</th>
                  <th className="text-left px-4 py-3">내용</th>
                  <th className="text-left px-4 py-3">작성일</th>
                  <th className="text-left px-4 py-3">관리</th>
                </tr>
              </thead>
              <tbody>
                {filtered.reviews.map(r => (
                  <tr key={r.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 text-white max-w-[180px] truncate">{r.lecture_title}</td>
                    <td className="px-4 py-3 text-gray-400">{r.student_nickname}</td>
                    <td className="px-4 py-3 text-yellow-400">{'★'.repeat(r.rating)}</td>
                    <td className="px-4 py-3 text-gray-400 max-w-[200px] truncate">{r.comment}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(r.created_at).toLocaleDateString('ko-KR')}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDeleteReview(r.id)} className="text-xs px-2.5 py-1 bg-red-900/50 text-red-400 rounded-lg hover:bg-red-800/50 transition-colors">삭제</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.reviews.length === 0 && <p className="text-center text-gray-600 py-10 text-sm">데이터가 없습니다.</p>}
          </div>
        )}

        {/* ── 환불 내역 ── */}
        {tab === 'refunds' && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 text-xs">
                  <th className="text-left px-4 py-3">강의명</th>
                  <th className="text-left px-4 py-3">학생</th>
                  <th className="text-left px-4 py-3">코치</th>
                  <th className="text-left px-4 py-3">결제금액</th>
                  <th className="text-left px-4 py-3">결제일</th>
                  <th className="text-left px-4 py-3">환불일</th>
                  <th className="text-left px-4 py-3">사유</th>
                </tr>
              </thead>
              <tbody>
                {filtered.refunds.map(r => (
                  <tr key={r.application_id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 text-white max-w-[180px] truncate">{r.lecture_title}</td>
                    <td className="px-4 py-3 text-gray-400">{r.student_nickname}<br/><span className="text-xs text-gray-600">{r.student_email}</span></td>
                    <td className="px-4 py-3 text-gray-400">{r.coach_nickname}</td>
                    <td className="px-4 py-3 text-gray-300">{Number(r.price).toLocaleString()}원</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(r.paid_at).toLocaleDateString('ko-KR')}</td>
                    <td className="px-4 py-3 text-red-400">{new Date(r.refunded_at).toLocaleDateString('ko-KR')}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[150px] truncate">{r.refund_reason || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.refunds.length === 0 && <p className="text-center text-gray-600 py-10 text-sm">환불 내역이 없습니다.</p>}
          </div>
        )}

      </main>
    </div>
  )
}
