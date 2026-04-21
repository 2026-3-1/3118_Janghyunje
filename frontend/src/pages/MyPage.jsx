import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import useAuthStore from '../store/useAuthStore'
import { GameBadge, TierBadge, LoadingScreen, EmptyState } from '../components/ui'

export default function MyPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const savedColor = localStorage.getItem('avatarColor') || 'bg-indigo-500'

  useEffect(() => {
    if (!user) { setLoading(false); return }
    // P2: student_id 쿼리 파라미터 제거 — JWT에서 서버가 직접 추출
    api.get('/applications/student')
      .then(res => setApplications(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <EmptyState
          title="로그인이 필요합니다"
          description="내 수강 목록을 보려면 로그인해주세요."
          action={{ label: '로그인하러 가기', onClick: () => navigate('/login') }}
        />
      </div>
    )
  }

  const STATUS_CLS   = { pending: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-700', approved: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-700', rejected: 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 border-red-200 dark:border-red-700' }
  const STATUS_LABEL = { pending: '검토 중', approved: '수강 중', rejected: '거절됨' }

  const counts = {
    all:      applications.length,
    approved: applications.filter(a => a.status === 'approved').length,
    pending:  applications.filter(a => a.status === 'pending').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  }

  const filtered = activeTab === 'all' ? applications : applications.filter(a => a.status === activeTab)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">

      {/* 유저 헤더 */}
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-full ${savedColor} flex items-center justify-center text-base font-bold text-white select-none shrink-0`}>
          {user.nickname?.[0]?.toUpperCase()}
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">{user.nickname}님의 수강 목록</h1>
          <p className="text-xs text-gray-400 dark:text-[#6b7280]">총 {applications.length}개 강의 신청</p>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 border-b border-gray-100 dark:border-[#1e2235]">
        {[
          { key: 'all',      label: '전체' },
          { key: 'approved', label: '수강 중' },
          { key: 'pending',  label: '검토 중' },
          { key: 'rejected', label: '거절됨' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px
              ${activeTab === tab.key
                ? 'border-brand-500 text-brand-500'
                : 'border-transparent text-gray-400 dark:text-[#6b7280] hover:text-gray-700 dark:hover:text-white'
              }`}>
            {tab.label}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full
              ${activeTab === tab.key
                ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400'
                : 'bg-gray-100 dark:bg-[#1a1d2e] text-gray-500 dark:text-[#6b7280]'}`}>
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* 목록 */}
      {loading ? <LoadingScreen /> : filtered.length === 0 ? (
        <EmptyState
          title="신청한 강의가 없어요"
          description="강의 목록에서 원하는 강의를 신청해보세요."
          action={{ label: '강의 둘러보기', onClick: () => navigate('/lectures') }}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(app => (
            <div key={app.id} onClick={() => navigate(`/lectures/${app.lecture_id}`)}
              className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-xl p-4
                         hover:border-brand-400 dark:hover:border-brand-500/60 cursor-pointer transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <GameBadge gameName={app.game} />
                    <TierBadge tier={app.target_tier} tierName={app.target_tier} />
                  </div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 line-clamp-1">{app.title}</p>
                  <p className="text-xs text-gray-400 dark:text-[#6b7280]">
                    코치: {app.coach_nickname} · {new Date(app.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-md border font-medium ${STATUS_CLS[app.status]}`}>
                    {STATUS_LABEL[app.status]}
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {Number(app.price).toLocaleString()}원
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
