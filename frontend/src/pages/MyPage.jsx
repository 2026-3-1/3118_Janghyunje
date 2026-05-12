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
  const savedColor = localStorage.getItem('avatarColor') || 'bg-indigo-500'

  useEffect(() => {
    if (!user) { setLoading(false); return }
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

  // 결제 완료 = 즉시 approved → approved만 표시
  const approved = applications.filter(a => a.status === 'approved')

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">

      {/* 유저 헤더 */}
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-full ${savedColor} flex items-center justify-center text-base font-bold text-white select-none shrink-0`}>
          {user.nickname?.[0]?.toUpperCase()}
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">{user.nickname}님의 수강 목록</h1>
          <p className="text-xs text-gray-400 dark:text-[#6b7280]">수강 중 {approved.length}개 강의</p>
        </div>
      </div>

      {/* 목록 */}
      {loading ? <LoadingScreen /> : approved.length === 0 ? (
        <EmptyState
          title="수강 중인 강의가 없어요"
          description="강의 목록에서 원하는 강의를 결제해보세요."
          action={{ label: '강의 둘러보기', onClick: () => navigate('/lectures') }}
        />
      ) : (
        <div className="space-y-3">
          {approved.map(app => (
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
                  <span className="text-xs px-2 py-0.5 rounded-md border font-medium bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-700">
                    수강 중
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
