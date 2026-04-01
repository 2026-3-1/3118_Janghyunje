import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import useAuthStore from '../store/useAuthStore'
import { TierBadge, GameBadge, LoadingScreen, EmptyState } from '../components/ui'

const STATUS = {
  pending:  { label: '대기 중', cls: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-700' },
  approved: { label: '승인됨',  cls: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-700' },
  rejected: { label: '거절됨',  cls: 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 border-red-200 dark:border-red-700' },
}

export default function CoachDashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState({ msg: '', type: '' })
  const [activeTab, setActiveTab] = useState('all')

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '', type: '' }), 3000)
  }

  useEffect(() => {
    if (!user || user.role !== 'coach') { navigate('/'); return }
    fetchApplications()
  }, [user])

  const fetchApplications = () => {
    setLoading(true)
    api.get('/applications/coach', { params: { coach_id: user.id } })
      .then(res => setApplications(res.data.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  const handleApprove = async (appId) => {
    try {
      await api.put(`/applications/${appId}/approve`)
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: 'approved' } : a))
      showToast('수강 신청을 승인했습니다.')
    } catch {
      showToast('처리 중 오류가 발생했습니다.', 'error')
    }
  }

  const handleReject = async (appId) => {
    try {
      await api.put(`/applications/${appId}/reject`)
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: 'rejected' } : a))
      showToast('수강 신청을 거절했습니다.', 'error')
    } catch {
      showToast('처리 중 오류가 발생했습니다.', 'error')
    }
  }

  const filtered = activeTab === 'all'
    ? applications
    : applications.filter(a => a.status === activeTab)

  const counts = {
    all:      applications.length,
    pending:  applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  }

  const toastCls = {
    success: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-700 dark:text-green-400',
    error:   'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-600 dark:text-red-400',
  }

  return (
    <div className="max-w-4xl px-4 py-10 mx-auto space-y-6">
      {toast.msg && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium whitespace-nowrap ${toastCls[toast.type]}`}>
          {toast.type === 'success' ? '✓ ' : '⚠️ '}{toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">수강 신청 관리</h1>
          <p className="text-sm text-gray-400 dark:text-[#6b7280] mt-0.5">{user?.nickname} 코치님의 신청 목록</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/coach/lecture/new')}
            className="px-4 py-2 text-sm font-semibold text-white transition-colors rounded-lg bg-brand-500 hover:bg-brand-600">
            + 강의 등록
          </button>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-2 border-b border-gray-100 dark:border-[#1e2235]">
        {[
          { key: 'all',      label: '전체' },
          { key: 'pending',  label: '대기 중' },
          { key: 'approved', label: '승인됨' },
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
              ${activeTab === tab.key ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400' : 'bg-gray-100 dark:bg-[#1a1d2e] text-gray-500 dark:text-[#6b7280]'}`}>
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {loading ? <LoadingScreen /> : filtered.length === 0 ? (
        <EmptyState title="신청 내역이 없습니다" description="아직 수강 신청이 없어요." />
      ) : (
        <div className="space-y-3">
          {filtered.map(app => (
            <div key={app.id}
              className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1 min-w-0">
                  {/* 강의명 + 자료 관리 버튼 */}
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-gray-800 truncate dark:text-slate-200">{app.title}</p>
                    <button
                      onClick={() => navigate(`/lectures/${app.lecture_id}/manage`)}
                      className="text-[10px] px-2 py-0.5 bg-brand-50 dark:bg-[#1e2a4a] text-brand-500 dark:text-brand-400 border border-brand-200 dark:border-brand-700/50 rounded-md hover:bg-brand-500 hover:text-white transition-colors shrink-0">
                      자료 관리
                    </button>
                  </div>
                  {/* 학생 정보 */}
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-[10px] font-bold text-brand-500">
                      {app.student_nickname?.[0]}
                    </div>
                    <span className="text-xs font-medium text-gray-600 dark:text-slate-300">{app.student_nickname}</span>
                    <TierBadge tier={app.student_tier} tierName={app.student_tier} />
                  </div>
                  <p className="text-xs text-gray-400 dark:text-[#6b7280]">
                    신청일: {new Date(app.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  {/* 현재 상태 배지 */}
                  <span className={`text-xs px-2 py-0.5 rounded-md border font-medium ${STATUS[app.status]?.cls}`}>
                    {STATUS[app.status]?.label}
                  </span>
                  {/* 대기 중일 때만 승인/거절 버튼 표시 */}
                  {app.status === 'pending' && (
                    <div className="flex gap-1.5">
                      <button onClick={() => handleApprove(app.id)}
                        className="px-3 py-1 text-xs font-semibold text-white transition-colors bg-green-500 rounded-lg hover:bg-green-600">
                        승인
                      </button>
                      <button onClick={() => handleReject(app.id)}
                        className="px-3 py-1 bg-gray-100 dark:bg-[#1a1d2e] hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 dark:text-[#8892a4] hover:text-red-500 text-xs font-semibold rounded-lg border border-gray-200 dark:border-[#2a2d3e] hover:border-red-300 transition-colors">
                        거절
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
