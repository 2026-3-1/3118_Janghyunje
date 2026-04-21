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
  active:   { label: '모집 중', cls: 'bg-green-50 dark:bg-green-900/20 text-green-600 border-green-200' },
  inactive: { label: '비공개',  cls: 'bg-gray-100 dark:bg-[#1a1d2e] text-gray-500 border-gray-200' },
  closed:   { label: '마감',    cls: 'bg-red-50 dark:bg-red-900/20 text-red-500 border-red-200' },
}

export default function CoachDashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [mainTab, setMainTab] = useState('applications')

  // 신청 관리
  const [applications, setApplications] = useState([])
  const [appLoading, setAppLoading]     = useState(true)
  const [activeTab, setActiveTab]       = useState('all')

  // 내 강의 목록
  const [lectures, setLectures]               = useState([])
  const [lecturesLoading, setLecturesLoading] = useState(false)
  const [lecturesFetched, setLecturesFetched] = useState(false)

  // 수강자 목록
  const [selectedLecture, setSelectedLecture] = useState(null)
  const [students, setStudents]               = useState([])
  const [studentsLoading, setStudentsLoading] = useState(false)

  // 성장 분석 모달
  const [growthModal, setGrowthModal]       = useState(null)
  const [growthForm, setGrowthForm]         = useState({ title: '', content: '' })
  const [growthSubmitting, setGrowthSubmitting] = useState(false)

  const [toast, setToast] = useState({ msg: '', type: '' })
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '', type: '' }), 3000)
  }

  useEffect(() => {
    if (!user || user.role !== 'coach') { navigate('/'); return }
    fetchApplications()
  }, [user])

  // ── 내 강의 fetch (최초 1회) ──────────────────────────────────────
  const fetchMyLectures = () => {
    if (lecturesFetched) return  // 이미 불러왔으면 중복 호출 방지
    setLecturesLoading(true)
    // /lectures/my 로 본인 강의만 조회
    api.get('/lectures/my')
      .then(res => {
        setLectures(res.data.data || [])
        setLecturesFetched(true)
      })
      .catch(() => {})
      .finally(() => setLecturesLoading(false))
  }

  // lectures 탭 진입 시 fetch
  useEffect(() => {
    if (mainTab === 'lectures') fetchMyLectures()
  }, [mainTab])

  // 수강자 탭 진입 시 강의 목록 미리 불러오기
  useEffect(() => {
    if (mainTab === 'students') fetchMyLectures()
  }, [mainTab])

  const fetchApplications = () => {
    setAppLoading(true)
    api.get('/applications/coach')
      .then(res => setApplications(res.data.data || []))
      .catch(() => {})
      .finally(() => setAppLoading(false))
  }

  const fetchStudents = async (lecture) => {
    setSelectedLecture(lecture)
    setStudentsLoading(true)
    try {
      const res = await api.get(`/applications/lecture/${lecture.id}`)
      setStudents(res.data.data || [])
    } catch { setStudents([]) }
    finally { setStudentsLoading(false) }
  }

  const handleApprove = async (appId) => {
    try {
      await api.put(`/applications/${appId}/approve`)
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: 'approved' } : a))
      showToast('수강 신청을 승인했습니다.')
    } catch { showToast('처리 중 오류가 발생했습니다.', 'error') }
  }

  const handleReject = async (appId) => {
    try {
      await api.put(`/applications/${appId}/reject`)
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: 'rejected' } : a))
      showToast('수강 신청을 거절했습니다.', 'error')
    } catch { showToast('처리 중 오류가 발생했습니다.', 'error') }
  }

  const handleGrowthSubmit = async () => {
    if (!growthForm.title.trim() || !growthForm.content.trim()) {
      showToast('제목과 내용을 모두 입력해주세요.', 'error'); return
    }
    setGrowthSubmitting(true)
    try {
      await api.post('/growth/reports', {
        lecture_id: growthModal.lecture_id,
        student_id: growthModal.student_id,
        title:   growthForm.title,
        content: growthForm.content,
      })
      showToast('성장 분석이 작성됐습니다.')
      setGrowthModal(null)
      setGrowthForm({ title: '', content: '' })
      if (selectedLecture) fetchStudents(selectedLecture)
    } catch (err) {
      showToast(err.response?.data?.message || '작성에 실패했습니다.', 'error')
    } finally { setGrowthSubmitting(false) }
  }

  const filtered = activeTab === 'all' ? applications : applications.filter(a => a.status === activeTab)
  const counts = {
    all:      applications.length,
    pending:  applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  }
  const toastCls = {
    success: 'bg-green-50 dark:bg-green-900/30 border-green-200 text-green-700',
    error:   'bg-red-50 dark:bg-red-900/30 border-red-200 text-red-600',
  }

  return (
    <div className="max-w-4xl px-4 py-10 mx-auto space-y-6">

      {/* 토스트 */}
      {toast.msg && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium whitespace-nowrap ${toastCls[toast.type]}`}>
          {toast.type === 'success' ? '✓ ' : '⚠️ '}{toast.msg}
        </div>
      )}

      {/* 성장 분석 작성 모달 */}
      {growthModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white dark:bg-[#13161e] rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">성장 분석 작성</h3>
              <button onClick={() => setGrowthModal(null)} className="text-gray-400 hover:text-gray-700 dark:hover:text-white">✕</button>
            </div>
            <p className="text-sm text-gray-500 dark:text-[#8892a4]">
              수강자: <span className="font-semibold text-gray-800 dark:text-white">{growthModal.student_nickname}</span>
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-[#8892a4]">제목</label>
              <input value={growthForm.title}
                onChange={e => setGrowthForm(p => ({ ...p, title: e.target.value }))}
                placeholder="예: 2주차 피드백 — 포지셔닝 개선 중점"
                className="w-full bg-gray-50 dark:bg-[#0d0f14] border border-gray-200 dark:border-[#2a2d3e] rounded-lg px-3 py-2.5 text-sm
                           text-gray-800 dark:text-slate-200 outline-none focus:border-brand-400 transition-colors" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-[#8892a4]">분석 내용</label>
              <textarea value={growthForm.content}
                onChange={e => setGrowthForm(p => ({ ...p, content: e.target.value }))}
                placeholder="수강자의 강점, 개선점, 다음 목표 등을 자유롭게 작성하세요."
                rows={6}
                className="w-full bg-gray-50 dark:bg-[#0d0f14] border border-gray-200 dark:border-[#2a2d3e] rounded-lg px-3 py-2.5 text-sm
                           text-gray-800 dark:text-slate-200 outline-none focus:border-brand-400 resize-none transition-colors" />
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button onClick={() => setGrowthModal(null)}
                className="px-4 py-2 text-sm text-gray-500 bg-gray-100 dark:bg-[#1a1d2e] rounded-lg hover:bg-gray-200 transition-colors">
                취소
              </button>
              <button onClick={handleGrowthSubmit} disabled={growthSubmitting}
                className="px-5 py-2 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 rounded-lg transition-colors">
                {growthSubmitting ? '작성 중...' : '작성 완료'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">코치 대시보드</h1>
          <p className="text-sm text-gray-400 dark:text-[#6b7280] mt-0.5">{user?.nickname} 코치님</p>
        </div>
        <button onClick={() => navigate('/coach/lecture/new')}
          className="px-4 py-2 text-sm font-semibold text-white rounded-lg bg-brand-500 hover:bg-brand-600 transition-colors">
          + 강의 등록
        </button>
      </div>

      {/* 메인 탭 */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-[#1a1d2e] rounded-xl w-fit">
        {[
          { key: 'applications', label: '수강 신청 관리', badge: counts.pending },
          { key: 'students',     label: '수강자 목록' },
          { key: 'lectures',     label: '내 강의 목록' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setMainTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors
              ${mainTab === tab.key
                ? 'bg-white dark:bg-[#13161e] text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-[#6b7280] hover:text-gray-700 dark:hover:text-white'}`}>
            {tab.label}
            {tab.badge > 0 && (
              <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-brand-500 text-white">{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── 수강 신청 관리 ── */}
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
                  ${activeTab === tab.key ? 'border-brand-500 text-brand-500' : 'border-transparent text-gray-400 dark:text-[#6b7280] hover:text-gray-700 dark:hover:text-white'}`}>
                {tab.label}
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full
                  ${activeTab === tab.key ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-600' : 'bg-gray-100 dark:bg-[#1a1d2e] text-gray-500'}`}>
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
                        <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 truncate">{app.title}</p>
                        <button onClick={() => navigate(`/lectures/${app.lecture_id}/manage`)}
                          className="text-[10px] px-2 py-0.5 bg-brand-50 dark:bg-[#1e2a4a] text-brand-500 border border-brand-200 dark:border-brand-700/50 rounded-md hover:bg-brand-500 hover:text-white transition-colors shrink-0">
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
                      <p className="text-xs text-gray-400">신청일: {new Date(app.created_at).toLocaleDateString('ko-KR')}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-md border font-medium ${STATUS[app.status]?.cls}`}>
                        {STATUS[app.status]?.label}
                      </span>
                      {app.status === 'pending' && (
                        <div className="flex gap-1.5">
                          <button onClick={() => handleApprove(app.id)}
                            className="px-3 py-1 text-xs font-semibold text-white bg-green-500 rounded-lg hover:bg-green-600">승인</button>
                          <button onClick={() => handleReject(app.id)}
                            className="px-3 py-1 bg-gray-100 dark:bg-[#1a1d2e] text-gray-500 text-xs font-semibold rounded-lg border border-gray-200 hover:bg-red-50 hover:text-red-500 hover:border-red-300 transition-colors">거절</button>
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

      {/* ── 수강자 목록 ── */}
      {mainTab === 'students' && (
        <div className="space-y-4">
          {!selectedLecture ? (
            lecturesLoading ? <LoadingScreen /> : (
              <div className="space-y-2">
                <p className="text-sm text-gray-500 dark:text-[#8892a4]">수강자를 확인할 강의를 선택하세요.</p>
                {lectures.length === 0 ? (
                  <EmptyState title="강의가 없습니다" description="먼저 강의를 등록해주세요." />
                ) : lectures.map(lec => (
                  <button key={lec.id} onClick={() => fetchStudents(lec)}
                    className="w-full text-left bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-xl p-4 hover:border-brand-400 transition-all">
                    <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">{lec.title}</p>
                    <p className="text-xs text-gray-400 mt-1">🎮 {lec.game} · 수강생 {lec.enroll_count ?? 0}명</p>
                  </button>
                ))}
              </div>
            )
          ) : (
            <>
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedLecture(null)}
                  className="text-sm text-gray-400 hover:text-brand-500 transition-colors">← 강의 목록</button>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">{selectedLecture.title}</h2>
              </div>
              {studentsLoading ? <LoadingScreen /> : students.length === 0 ? (
                <EmptyState title="수강자가 없습니다" description="아직 승인된 수강자가 없어요." />
              ) : (
                <div className="space-y-3">
                  {students.map(s => (
                    <div key={s.student_id}
                      className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-sm font-bold text-brand-500 shrink-0">
                              {s.student_nickname?.[0]}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-800 dark:text-white">{s.student_nickname}</p>
                              <p className="text-xs text-gray-400">{s.student_email}</p>
                            </div>
                            <TierBadge tier={s.student_tier} tierName={s.student_tier} />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-gray-400">
                              <span>진도율</span>
                              <span>{s.completed_count}/{s.total_count} ({s.progress_percent}%)</span>
                            </div>
                            <div className="h-2 bg-gray-100 dark:bg-[#1a1d2e] rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all
                                ${s.progress_percent >= 80 ? 'bg-green-500' : s.progress_percent >= 60 ? 'bg-brand-500' : 'bg-amber-400'}`}
                                style={{ width: `${s.progress_percent}%` }} />
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            {s.has_review
                              ? <span className="text-green-500">⭐ 리뷰 작성됨 ({s.review_rating}점)</span>
                              : <span className="text-gray-300 dark:text-[#4a5568]">리뷰 미작성</span>}
                            {s.has_growth_report
                              ? <button onClick={() => navigate(`/growth/reports/${s.growth_report_id}`)}
                                  className="text-brand-500 hover:underline">📊 성장 분석 보기</button>
                              : <span className="text-gray-300 dark:text-[#4a5568]">성장 분석 미작성</span>}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setGrowthModal({ student_id: s.student_id, student_nickname: s.student_nickname, lecture_id: selectedLecture.id })
                            setGrowthForm({ title: '', content: '' })
                          }}
                          className={`shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors
                            ${s.has_growth_report
                              ? 'bg-gray-50 dark:bg-[#1a1d2e] text-gray-500 border-gray-200 hover:bg-brand-50 hover:text-brand-500'
                              : 'bg-brand-50 dark:bg-[#1e2a4a] text-brand-500 border-brand-200 hover:bg-brand-500 hover:text-white'}`}>
                          {s.has_growth_report ? '분석 재작성' : '📊 분석 작성'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── 내 강의 목록 ── */}
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
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>🎮 {lec.game}</span>
                        <span>💰 {Number(lec.price).toLocaleString()}원</span>
                        <span>👥 {lec.enroll_count ?? 0}명</span>
                        <span>⭐ {Number(lec.rating ?? 0).toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <button onClick={() => fetchStudents(lec)}
                        className="text-xs px-3 py-1.5 bg-brand-50 dark:bg-[#1e2a4a] text-brand-500 rounded-lg hover:bg-brand-500 hover:text-white transition-colors border border-brand-200">
                        수강자 보기
                      </button>
                      <button onClick={() => navigate(`/lectures/${lec.id}`)}
                        className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-[#1a1d2e] text-gray-600 dark:text-[#8892a4] rounded-lg hover:bg-gray-200 transition-colors border border-gray-200 dark:border-[#2a2d3e]">
                        상세 보기
                      </button>
                      <button onClick={() => navigate(`/coach/lecture/edit/${lec.id}`)}
                        className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-[#1a1d2e] text-gray-600 dark:text-[#8892a4] rounded-lg hover:bg-gray-200 transition-colors border border-gray-200 dark:border-[#2a2d3e]">
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
