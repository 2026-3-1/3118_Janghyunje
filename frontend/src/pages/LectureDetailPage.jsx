import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getLectureById, getReviewsByLectureId, applyLecture } from '../services/lectureService'
import { TierBadge, GameBadge, StarRating, CardBadge, LoadingScreen } from '../components/ui'
import useAuthStore from '../store/useAuthStore'
import api from '../services/api'

const APPLICATION_STATUS = {
  pending:  { label: '검토 중',  cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700 cursor-default' },
  approved: { label: '수강 중',  cls: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700 cursor-default' },
  rejected: { label: '거절됨',   cls: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-300 dark:border-red-700 cursor-default' },
}

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className="text-2xl leading-none transition-transform hover:scale-110">
          <span className={(hovered || value) >= n ? 'text-yellow-400' : 'text-gray-200 dark:text-gray-700'}>★</span>
        </button>
      ))}
      <span className="ml-2 text-sm text-gray-400 dark:text-[#6b7280] self-center">
        {(hovered || value) > 0
          ? ['', '별로예요', '그저 그래요', '괜찮아요', '좋아요', '최고예요'][hovered || value]
          : '별점을 선택하세요'}
      </span>
    </div>
  )
}

export default function LectureDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [lecture, setLecture]               = useState(null)
  const [reviews, setReviews]               = useState([])
  const [loading, setLoading]               = useState(true)
  const [applying, setApplying]             = useState(false)
  const [applicationStatus, setApplicationStatus] = useState(null)
  const [toast, setToast]                   = useState({ msg: '', type: '' })

  // 장바구니 상태
  const [inCart, setInCart]       = useState(false)
  const [addingCart, setAddingCart] = useState(false)

  // 리뷰
  const [reviewRating, setReviewRating]       = useState(0)
  const [reviewComment, setReviewComment]     = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [alreadyReviewed, setAlreadyReviewed] = useState(false)

  const showToast = (msg, type = 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '', type: '' }), 3000)
  }

  const loadReviews = async () => {
    const r = await getReviewsByLectureId(id)
    setReviews(r)
    if (user) {
      const mine = r.find(rv => rv.student_id === user.id)
      if (mine) setAlreadyReviewed(true)
    }
  }

  useEffect(() => {
    Promise.all([getLectureById(id), getReviewsByLectureId(id)])
      .then(([l, r]) => {
        setLecture(l)
        setReviews(r)
        if (user) {
          const mine = r.find(rv => rv.student_id === user.id)
          if (mine) setAlreadyReviewed(true)
        }
        const prev = JSON.parse(localStorage.getItem('recentLectures') || '[]')
        const next = [l.id, ...prev.filter(rid => rid !== l.id)].slice(0, 5)
        localStorage.setItem('recentLectures', JSON.stringify(next))
      })
      .catch(() => navigate('/lectures'))
      .finally(() => setLoading(false))
  }, [id])

  // 수강 신청 상태 + 장바구니 여부 조회
  useEffect(() => {
    if (!user) return
    // 수강 신청 상태
    api.get('/applications/student')
      .then(res => {
        const found = (res.data.data || []).find(a => a.lecture_id === Number(id))
        if (found) setApplicationStatus(found.status)
      })
      .catch(() => {})
    // 장바구니 여부
    api.get('/cart')
      .then(res => {
        const inC = (res.data.data || []).some(i => (i.lecture_id ?? i.id) === Number(id))
        setInCart(inC)
      })
      .catch(() => {})
  }, [id, user])

  // 수강 신청
  const handleApply = async () => {
    if (!user) { showToast('로그인 후 수강 신청이 가능합니다.'); return }
    if (applicationStatus || applying) return
    setApplying(true)
    try {
      await applyLecture(id)
      setApplicationStatus('pending')
      // 장바구니에 있으면 제거
      if (inCart) {
        await api.delete(`/cart/${id}`)
        setInCart(false)
      }
      showToast('수강 신청이 완료됐습니다. 코치 승인을 기다려주세요.', 'success')
    } catch (err) {
      if (err.response?.status === 409) {
        setApplicationStatus('pending')
        showToast('이미 수강 신청된 강의입니다.')
      } else {
        showToast(err.response?.data?.message || '신청 중 오류가 발생했습니다.')
      }
    } finally {
      setApplying(false)
    }
  }

  // 장바구니 담기 / 빼기
  const handleCartToggle = async () => {
    if (!user) { showToast('로그인 후 이용할 수 있습니다.'); return }
    setAddingCart(true)
    try {
      if (inCart) {
        await api.delete(`/cart/${id}`)
        setInCart(false)
        showToast('장바구니에서 제거됐습니다.', 'success')
      } else {
        await api.post('/cart', { lecture_id: Number(id) })
        setInCart(true)
        showToast('장바구니에 담겼습니다! 장바구니에서 한번에 신청하세요.', 'success')
      }
    } catch (err) {
      showToast(err.response?.data?.message || '오류가 발생했습니다.')
    } finally {
      setAddingCart(false)
    }
  }

  // 리뷰 제출
  const handleReviewSubmit = async () => {
    if (!reviewRating) { showToast('별점을 선택해주세요.'); return }
    if (!reviewComment.trim()) { showToast('후기 내용을 입력해주세요.'); return }
    setSubmittingReview(true)
    try {
      await api.post('/reviews', {
        lecture_id: Number(id),
        rating: reviewRating,
        comment: reviewComment.trim(),
      })
      showToast('후기가 등록됐습니다!', 'success')
      setAlreadyReviewed(true)
      setReviewRating(0)
      setReviewComment('')
      await loadReviews()
    } catch (err) {
      if (err.response?.status === 409) {
        showToast('이미 후기를 작성하셨습니다.')
        setAlreadyReviewed(true)
      } else {
        showToast(err.response?.data?.message || '후기 등록에 실패했습니다.')
      }
    } finally {
      setSubmittingReview(false)
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

  const isMyLecture    = user?.id === lecture.coach_id
  const canWriteReview = user && !isMyLecture && applicationStatus === 'approved' && !alreadyReviewed

  // 신청 버튼 렌더링
  const renderApplyButton = () => {
    if (isMyLecture) return null
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
            ? 'bg-gray-100 dark:bg-[#1a1d2e] text-gray-500 dark:text-[#6b7280] border border-gray-200 dark:border-[#2a2d3e]'
            : 'bg-brand-500 hover:bg-brand-600 text-white'}`}>
        {applying ? '신청 중...' : !user ? '🔒 로그인 후 신청' : '수강 신청'}
      </button>
    )
  }

  // 장바구니 버튼 렌더링
  const renderCartButton = () => {
    if (isMyLecture || applicationStatus) return null
    return (
      <button onClick={handleCartToggle} disabled={addingCart}
        className={`px-5 py-2.5 rounded-xl font-bold text-sm border transition-colors
          ${addingCart
            ? 'opacity-50 cursor-wait'
            : inCart
            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 hover:bg-amber-100'
            : 'bg-white dark:bg-[#1a1d2e] border-gray-200 dark:border-[#2a2d3e] text-gray-600 dark:text-slate-300 hover:border-brand-400 hover:text-brand-500'
          }`}>
        {addingCart ? '...' : inCart ? '🛒 담김 ✓' : '🛒 장바구니'}
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
          {toast.type === 'success' && inCart && !applicationStatus && (
            <button onClick={() => navigate('/cart')} className="ml-2 underline text-xs font-semibold">
              장바구니 보기 →
            </button>
          )}
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

      {/* 수강 신청 + 장바구니 */}
      <div className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-xl p-5 space-y-4">
        {/* 가격 */}
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

        {/* 버튼 영역 */}
        <div className="flex flex-col gap-2">
          {/* 수강하기 버튼 (승인된 경우) */}
          {(applicationStatus === 'approved' || isMyLecture) && (
            <button onClick={() => navigate(`/lectures/${id}/contents`)}
              className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold text-sm rounded-xl transition-colors">
              ▶ 강의 수강하기
            </button>
          )}

          {/* 수강 신청 + 장바구니 버튼 나란히 */}
          {!applicationStatus && !isMyLecture && (
            <div className="flex gap-2">
              {/* 장바구니 */}
              {renderCartButton()}
              {/* 수강 신청 (flex-1로 나머지 공간 차지) */}
              <div className="flex-1">
                <button onClick={handleApply} disabled={applying}
                  className={`w-full py-2.5 rounded-xl font-bold text-sm transition-colors
                    ${applying
                      ? 'bg-brand-400 text-white cursor-wait'
                      : !user
                      ? 'bg-gray-100 dark:bg-[#1a1d2e] text-gray-500 dark:text-[#6b7280] border border-gray-200 dark:border-[#2a2d3e]'
                      : 'bg-brand-500 hover:bg-brand-600 text-white'}`}>
                  {applying ? '신청 중...' : !user ? '🔒 로그인 후 신청' : '바로 수강 신청'}
                </button>
              </div>
            </div>
          )}

          {/* 이미 신청한 경우 상태 버튼 */}
          {applicationStatus && !isMyLecture && (
            <button disabled className={`w-full py-2.5 rounded-xl font-bold text-sm border ${APPLICATION_STATUS[applicationStatus]?.cls}`}>
              {APPLICATION_STATUS[applicationStatus]?.label}
            </button>
          )}

          {/* 비로그인 안내 */}
          {!user && (
            <p className="text-xs text-gray-400 dark:text-[#6b7280] text-center">
              <button onClick={() => navigate('/login')} className="text-brand-500 hover:underline">로그인</button>
              {' '}후 수강 신청 또는 장바구니 이용이 가능합니다.
            </p>
          )}

          {/* 장바구니에 담긴 경우 바로가기 */}
          {inCart && !applicationStatus && (
            <button onClick={() => navigate('/cart')}
              className="w-full py-2 text-xs text-brand-500 hover:text-brand-600 font-medium transition-colors">
              장바구니 바로가기 →
            </button>
          )}
        </div>
      </div>

      {/* 리뷰 작성 폼 */}
      {canWriteReview && (
        <div className="bg-white dark:bg-[#13161e] border border-brand-200 dark:border-brand-500/30 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-800 dark:text-white">후기 작성</h2>
          <div>
            <p className="text-xs text-gray-400 dark:text-[#6b7280] mb-2">별점</p>
            <StarPicker value={reviewRating} onChange={setReviewRating} />
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-[#6b7280] mb-2">후기 내용</p>
            <textarea
              value={reviewComment} onChange={e => setReviewComment(e.target.value)}
              placeholder="수강 후기를 자유롭게 작성해주세요."
              rows={4} maxLength={500}
              className="w-full rounded-xl border border-gray-200 dark:border-[#2a2d3e] bg-gray-50 dark:bg-[#0d0f14]
                         text-gray-800 dark:text-slate-200 text-sm px-4 py-3 resize-none outline-none
                         focus:border-brand-400 dark:focus:border-brand-500 transition-colors
                         placeholder:text-gray-300 dark:placeholder:text-[#4a5568]"
            />
            <p className="text-right text-xs text-gray-300 dark:text-[#4a5568] mt-1">{reviewComment.length} / 500</p>
          </div>
          <button onClick={handleReviewSubmit} disabled={submittingReview}
            className={`w-full py-2.5 rounded-xl font-bold text-sm transition-colors
              ${submittingReview ? 'bg-brand-300 text-white cursor-wait' : 'bg-brand-500 hover:bg-brand-600 text-white'}`}>
            {submittingReview ? '등록 중...' : '후기 등록하기'}
          </button>
        </div>
      )}

      {/* 이미 작성한 경우 */}
      {user && !isMyLecture && applicationStatus === 'approved' && alreadyReviewed && (
        <div className="bg-gray-50 dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-xl p-4 text-center text-sm text-gray-400 dark:text-[#6b7280]">
          ✓ 이미 후기를 작성하셨습니다.
        </div>
      )}

      {/* 수강 승인 전 안내 */}
      {user && !isMyLecture && applicationStatus === 'pending' && (
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 rounded-xl p-4 text-center text-sm text-amber-600 dark:text-amber-400">
          코치 승인 후 후기를 작성할 수 있습니다.
        </div>
      )}

      {/* 리뷰 목록 */}
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
