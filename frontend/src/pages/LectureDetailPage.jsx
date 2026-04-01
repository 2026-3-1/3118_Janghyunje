import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getLectureById, getReviewsByLectureId, applyLecture } from '../services/lectureService'
import { TierBadge, GameBadge, StarRating, CardBadge, LoadingScreen } from '../components/ui'
import useAuthStore from '../store/useAuthStore'
import api from '../services/api'

// 신청 상태별 버튼 스타일/텍스트
const APPLICATION_STATUS = {
  pending:  { label: '검토 중',  cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700 cursor-default' },
  approved: { label: '수강 중',  cls: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700 cursor-default' },
  rejected: { label: '거절됨',   cls: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-300 dark:border-red-700 cursor-default' },
}

export default function LectureDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [lecture, setLecture] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [applicationStatus, setApplicationStatus] = useState(null) // null | 'pending' | 'approved' | 'rejected'
  const [toast, setToast] = useState({ msg: '', type: '' })

  const showToast = (msg, type = 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '', type: '' }), 3000)
  }

  useEffect(() => {
    Promise.all([getLectureById(id), getReviewsByLectureId(id)])
      .then(([l, r]) => {
        setLecture(l)
        setReviews(r)
        const prev = JSON.parse(localStorage.getItem('recentLectures') || '[]')
        const next = [l.id, ...prev.filter(rid => rid !== l.id)].slice(0, 5)
        localStorage.setItem('recentLectures', JSON.stringify(next))
      })
      .catch(() => navigate('/lectures'))
      .finally(() => setLoading(false))
  }, [id])

  // 로그인 상태면 이미 신청한 강의인지 확인
  useEffect(() => {
    if (!user) return
    api.get('/applications/student', { params: { student_id: user.id } })
      .then(res => {
        const found = (res.data.data || []).find(a => a.lecture_id === Number(id))
        if (found) setApplicationStatus(found.status)
      })
      .catch(() => {})
  }, [id, user])

  const handleApply = async () => {
    if (!user) {
      showToast('로그인 후 수강 신청이 가능합니다.')
      return
    }
    if (applicationStatus || applying) return
    setApplying(true)
    try {
      await applyLecture(id)
      setApplicationStatus('pending')
      showToast('수강 신청이 완료되었습니다. 코치 승인을 기다려주세요.', 'success')
    } catch (err) {
      const msg = err.response?.data?.message || '신청 중 오류가 발생했습니다.'
      // 이미 신청한 경우
      if (err.response?.status === 409) {
        setApplicationStatus('pending')
        showToast('이미 수강 신청된 강의입니다.')
      } else {
        showToast(msg)
      }
    } finally {
      setApplying(false)
    }
  }

  if (loading) return <LoadingScreen />

  const discountRate = lecture.originalPrice
    ? Math.round((1 - lecture.price / lecture.originalPrice) * 100)
    : null

  const toastCls = {
    error:   'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-600 dark:text-red-400',
    success: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-600 dark:text-green-400',
  }

  // 신청 버튼 렌더링 결정
  const renderApplyButton = () => {
    if (applicationStatus) {
      const s = APPLICATION_STATUS[applicationStatus]
      return (
        <button disabled className={`px-7 py-2.5 rounded-xl font-bold text-sm border ${s.cls}`}>
          {s.label}
        </button>
      )
    }
    return (
      <button onClick={handleApply} disabled={applying}
        className={`px-7 py-2.5 rounded-xl font-bold text-sm transition-colors
          ${applying
            ? 'bg-brand-400 text-white cursor-wait'
            : !user
            ? 'bg-gray-100 dark:bg-[#1a1d2e] text-gray-500 dark:text-[#6b7280] border border-gray-200 dark:border-[#2a2d3e] hover:bg-red-50 hover:text-red-500 hover:border-red-300'
            : 'bg-brand-500 hover:bg-brand-600 text-white'
          }`}>
        {applying ? '신청 중...' : !user ? '🔒 로그인 후 신청' : '수강 신청'}
      </button>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
      {/* 토스트 */}
      {toast.msg && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5
                         px-4 py-3 rounded-xl border shadow-lg text-sm font-medium whitespace-nowrap ${toastCls[toast.type] || toastCls.error}`}>
          <span>{toast.type === 'success' ? '✓' : '⚠️'}</span>
          {toast.msg}
          {toast.type !== 'success' && !user && (
            <button onClick={() => navigate('/login')} className="ml-2 underline text-xs font-semibold">
              로그인하기
            </button>
          )}
        </div>
      )}

      <button onClick={() => navigate(-1)}
        className="text-sm text-gray-400 dark:text-[#8892a4] hover:text-brand-500 transition-colors flex items-center gap-1">
        ← 뒤로
      </button>

      {/* 썸네일 */}
      <div className={`relative rounded-xl overflow-hidden aspect-video bg-gradient-to-br ${lecture.thumbBg} flex items-center justify-center text-6xl`}>
        <span className="select-none">{lecture.thumbIcon}</span>
        {lecture.badges?.length > 0 && (
          <div className="absolute top-3 left-3 flex gap-1.5">
            {lecture.badges.map(b => <CardBadge key={b} type={b} />)}
          </div>
        )}
      </div>

      {/* 강의 정보 */}
      <div className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-xl p-5 space-y-3">
        <div className="flex flex-wrap gap-2">
          <GameBadge gameName={lecture.gameName} />
          <TierBadge tier={lecture.targetTier} tierName={`대상 ${lecture.targetTierName}`} />
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-snug">{lecture.title}</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <StarRating rating={lecture.rating} size="lg" />
          <span className="text-gray-400 dark:text-[#6b7280] text-sm">리뷰 {lecture.reviewCount}개 · {lecture.enrollCount}명 수강</span>
        </div>
        <p className="text-gray-600 dark:text-slate-300 text-sm leading-relaxed">{lecture.description}</p>
        {lecture.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {lecture.tags.map(t => (
              <span key={t} className="text-xs px-2 py-0.5 bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-slate-500 rounded-md border border-gray-100 dark:border-white/5">
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 코치 정보 */}
      <div className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-xl p-5">
        <h2 className="text-sm font-bold text-gray-700 dark:text-white mb-3">코치 정보</h2>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-lg font-bold text-brand-500 dark:text-brand-400 shrink-0">
            {lecture.coach.nickname[0]}
          </div>
          <div>
            <div className="text-gray-900 dark:text-white font-semibold text-sm">{lecture.coach.nickname}</div>
            <TierBadge tier={lecture.coach.tier} tierName={lecture.coach.tierName} />
          </div>
        </div>
      </div>

      {/* 수강 신청 */}
      <div className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-xl p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs text-gray-400 dark:text-[#6b7280] mb-1">수강료</div>
            <div className="flex items-baseline gap-2">
              <div className="w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">G</div>
              <span className="text-2xl font-extrabold text-gray-900 dark:text-white">{lecture.price.toLocaleString()}</span>
              {lecture.originalPrice && (
                <>
                  <span className="text-sm text-gray-300 dark:text-[#4a5568] line-through">{lecture.originalPrice.toLocaleString()}</span>
                  <span className="text-sm font-bold text-orange-500">{discountRate}%</span>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {/* 승인된 수강생 or 코치 → 강의 수강 버튼 */}
            {(applicationStatus === 'approved' || user?.id === lecture.coach_id) && (
              <button
                onClick={() => navigate(`/lectures/${id}/contents`)}
                className="px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white font-bold text-sm rounded-xl transition-colors">
                ▶ 강의 수강하기
              </button>
            )}
            {renderApplyButton()}
            {!user && (
              <p className="text-xs text-gray-400 dark:text-[#6b7280]">
                <button onClick={() => navigate('/login')} className="text-brand-500 hover:underline">로그인</button>
                {' '}후 수강 신청이 가능합니다.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 리뷰 */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-gray-700 dark:text-white">수강 후기 ({reviews.length})</h2>
        {reviews.length === 0 ? (
          <p className="text-center text-gray-400 dark:text-[#6b7280] text-sm py-8">아직 후기가 없습니다.</p>
        ) : reviews.map(r => (
          <div key={r.id} className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-gray-800 dark:text-white font-medium text-sm">{r.student.nickname}</span>
              <TierBadge tier={r.student.tier} tierName={r.student.tierName} />
              <StarRating rating={r.rating} />
            </div>
            <p className="text-gray-600 dark:text-slate-300 text-sm leading-relaxed">{r.comment}</p>
            <p className="text-gray-300 dark:text-[#4a5568] text-xs">{r.createdAt}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
