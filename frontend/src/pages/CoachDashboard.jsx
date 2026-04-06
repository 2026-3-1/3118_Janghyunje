import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import useAuthStore from '../store/useAuthStore'
import { TierBadge, LoadingScreen, EmptyState } from '../components/ui'

const STATUS = {
  pending:  { label: '대기 중', cls: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-700' },
  approved: { label: '승인됨',  cls: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-700' },
  rejected: { label: '거절됨',  cls: 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 border-red-200 dark:border-red-700' },
}

const LECTURE_STATUS = {
  active:   { label: '모집 중', cls: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-700' },
  inactive: { label: '비공개',  cls: 'bg-gray-100 dark:bg-[#1a1d2e] text-gray-500 dark:text-[#6b7280] border-gray-200 dark:border-[#2a2d3e]' },
  closed:   { label: '마감',    cls: 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 border-red-200 dark:border-red-700' },
}

export default function CoachDashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [mainTab, setMainTab] = useState('applications')

  // 신청 관리
  const [applications, setApplications] = useState([])
  const [appLoading, setAppLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')

  // 내 강의 목록
  const [lectures, setLectures] = useState([])
  const [lecturesLoading, setLecturesLoading] = useState(false)
  const [lecturesFetched, setLecturesFetched] = useState(false)

  const [toast, setToast] = useState({ msg: '', type: '' })

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '', type: '' }), 3000)
  }

  useEffect(() => {
    if (!user || user.role !== 'coach') { navigate('/'); return }
    fetchApplications()
  }, [user])

  useEffect(() => {
    if (mainTab === 'lectures' && !lecturesFetched) fetchMyLectures()
  }, [mainTab])

  const fetchApplications = () => {
    setAppLoading(true)
    api.get('/applications/coach', { params: { coach_id: user.id } })
      .then(res => setApplications(res.data.data || []))
      .catch(err => console.error(err))
      .finally(() => setAppLoading(false))
  }

  const fetchMyLectures = () => {
    setLecturesLoading(true)
    api.get('/lectures', { params: { coach_id: user.id } })
      .then(res => { setLectures(res.data.data || []); setLecturesFetched(true) })
      .catch(err => console.error(err))
      .finally(() => setLecturesLoading(false))
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
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">코치 대시보드</h1>
          <p className="text-sm text-gray-400 dark:text-[#6b7280] mt-0.5">{user?.nickname} 코치님</p>
        </div>
        <button onClick={() => navigate('/coach/lecture/new')}
          className="px-4 py-2 text-sm font-semibold text-white transition-colors rounded-lg bg-brand-500 hover:bg-brand-600">
          + 강의 등록
        </button>
      </div>

      {/* 메인 탭 */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-[#1a1d2e] rounded-xl w-fit">
        <button
          onClick={() => setMainTab('applications')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors
            ${mainTab === 'applications'
              ? 'bg-white dark:bg-[#13161e] text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-[#6b7280] hover:text-gray-700 dark:hover:text-white'
            }`}>
          수강 신청 관리
          {counts.pending > 0 && (
            <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-brand-500 text-white">
              {counts.pending}
            </span>
          )}
        </button>
        <button
          onClick={() => setMainTab('lectures')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors
            ${mainTab === 'lectures'
              ? 'bg-white dark:bg-[#13161e] text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-[#6b7280] hover:text-gray-700 dark:hover:text-white'
            }`}>
          내 강의 목록
        </button>
      </div>

      {/* ── 수강 신청 관리 탭 ── */}
      {mainTab === 'applications' && (
        <>
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

          {appLoading ? <LoadingScreen /> : filtered.length === 0 ? (
            <EmptyState title="신청 내역이 없습니다" description="아직 수강 신청이 없어요." />
          ) : (
            <div className="space-y-3">
              {filtered.map(app => (
                <div key={app.id}
                  className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-gray-800 truncate dark:text-slate-200">{app.title}</p>
                        <button
                          onClick={() => navigate(`/lectures/${app.lecture_id}/manage`)}
                          className="text-[10px] px-2 py-0.5 bg-brand-50 dark:bg-[#1e2a4a] text-brand-500 dark:text-brand-400 border border-brand-200 dark:border-brand-700/50 rounded-md hover:bg-brand-500 hover:text-white transition-colors shrink-0">
                          자료 관리
                        </button>
                      </div>
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
                      <span className={`text-xs px-2 py-0.5 rounded-md border font-medium ${STATUS[app.status]?.cls}`}>
                        {STATUS[app.status]?.label}
                      </span>
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
        </>
      )}

      {/* ── 내 강의 목록 탭 ── */}
      {mainTab === 'lectures' && (
        <>
          {lecturesLoading ? <LoadingScreen /> : lectures.length === 0 ? (
            <EmptyState title="등록한 강의가 없습니다" description="강의를 등록해보세요!" />
          ) : (
            <div className="space-y-3">
              {lectures.map(lec => (
                <div key={lec.id}
                  className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 truncate">{lec.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-md border font-medium ${LECTURE_STATUS[lec.status]?.cls || LECTURE_STATUS.active.cls}`}>
                          {LECTURE_STATUS[lec.status]?.label || '모집 중'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-[#6b7280]">
                        <span>🎮 {lec.game}</span>
                        <span>💰 {Number(lec.price).toLocaleString()}원</span>
                        <span>👥 {lec.enroll_count}명 수강 중</span>
                        <span>⭐ {Number(lec.rating).toFixed(1)}</span>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-[#6b7280]">
                        등록일: {new Date(lec.created_at).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <button
                        onClick={() => navigate(`/lectures/${lec.id}`)}
                        className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-[#1a1d2e] text-gray-600 dark:text-[#8892a4] rounded-lg hover:bg-gray-200 dark:hover:bg-[#2a2d3e] transition-colors border border-gray-200 dark:border-[#2a2d3e]">
                        상세 보기
                      </button>
                      <button
                        onClick={() => navigate(`/coach/lecture/edit/${lec.id}`)}
                        className="text-xs px-3 py-1.5 bg-brand-50 dark:bg-[#1e2a4a] text-brand-500 dark:text-brand-400 rounded-lg hover:bg-brand-500 hover:text-white transition-colors border border-brand-200 dark:border-brand-700/50">
                        수정
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
