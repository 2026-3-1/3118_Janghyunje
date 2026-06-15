import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/useAuthStore'
import api from '../services/api'
import { sendEnrollmentEmail } from '../utils/emailService'

const TOSS_CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY

const GAME_LABEL = {
  lol: 'LoL', valorant: '발로란트', overwatch2: '오버워치2',
  battleground: '배그', tft: 'TFT', starcraft2: 'SC2',
}

const loadTossPayments = () => {
  return new Promise((resolve, reject) => {
    if (window.TossPayments) { resolve(window.TossPayments); return }
    const script = document.createElement('script')
    script.src = 'https://js.tosspayments.com/v1/payment'
    script.onload  = () => resolve(window.TossPayments)
    script.onerror = reject
    document.head.appendChild(script)
  })
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()

  const { lecture } = location.state || {}

  const [loading, setLoading]   = useState(false)
  const [done, setDone]         = useState(false)
  const [error, setError]       = useState('')
  const [receiptEmail, setReceiptEmail] = useState('')

  useEffect(() => {
    if (!user) { navigate('/login'); return }

    // 토스 결제 완료 후 돌아온 경우 — URL 파라미터 먼저 체크
    const params    = new URLSearchParams(window.location.search)
    const lectureId = params.get('lectureId')
    const amount    = params.get('amount')
    const email     = params.get('email') || ''
    const fail      = params.get('fail')

    if (fail) {
      setError('결제가 취소됐습니다.')
      window.history.replaceState({}, '', window.location.pathname)
      return
    }

    if (lectureId) {
      window.history.replaceState({}, '', window.location.pathname)
      const decodedEmail = decodeURIComponent(email)
      setReceiptEmail(decodedEmail)
      handlePaymentComplete(Number(lectureId), decodedEmail, Number(amount))
      return
    }

    // 일반 진입 — lecture 없으면 뒤로
    if (!lecture) { navigate(-1); return }
    setReceiptEmail(user.email || '')
  }, [])

  const handlePaymentComplete = async (lectureId, email, amount) => {
    setLoading(true)
    try {
      await api.post('/applications', { lecture_id: lectureId })
      try { await api.delete(`/cart/${lectureId}`) } catch {}
      if (email) {
        sendEnrollmentEmail({
          toEmail:      email,
          nickname:     user?.nickname || '',
          lectureTitle: lecture?.title || '',
          price:        amount,
        }).catch(() => {})
      }
      setDone(true)
    } catch (err) {
      if (err.response?.status === 409) {
        setDone(true) // 이미 수강 신청된 경우도 완료 처리
      } else {
        setError(err.response?.data?.message || '처리 중 오류가 발생했습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePay = async () => {
    if (receiptEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(receiptEmail)) {
      setError('올바른 이메일 형식을 입력해주세요.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const TossPayments = await loadTossPayments()
      const tossPayments = TossPayments(TOSS_CLIENT_KEY)

      const orderId   = `order-${Date.now()}-${user.id}`
      const orderName = lecture.title.length > 30 ? lecture.title.slice(0, 30) + '...' : lecture.title

      const currentUrl = window.location.origin + window.location.pathname
      const successUrl = `${currentUrl}?lectureId=${lecture.id}&amount=${lecture.price}&email=${encodeURIComponent(receiptEmail)}&orderId=${orderId}`
      const failUrl    = `${currentUrl}?fail=true`

      await tossPayments.requestPayment('카드', {
        amount:        Number(lecture.price),
        orderId,
        orderName,
        customerName:  user.nickname,
        customerEmail: receiptEmail || user.email,
        successUrl,
        failUrl,
      })
    } catch (err) {
      if (err.code !== 'USER_CANCEL') setError('결제 창을 열 수 없습니다. 잠시 후 다시 시도해주세요.')
      setLoading(false)
    }
  }

  // 로딩 중
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500">결제 처리 중...</p>
        </div>
      </div>
    )
  }

  // 결제 완료
  if (done) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-4xl mx-auto">✓</div>
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">결제 완료!</h1>
          <p className="text-gray-500 dark:text-[#8892a4] text-sm">수강 신청이 완료됐습니다.</p>
        </div>
        {receiptEmail && (
          <p className="text-xs text-green-500">{receiptEmail} 로 확인 메일을 발송했습니다.</p>
        )}
        <div className="flex gap-3">
          <button onClick={() => navigate('/mypage')}
            className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm rounded-xl transition-colors">
            내 수강 목록
          </button>
          <button onClick={() => navigate('/lectures')}
            className="flex-1 py-3 bg-gray-100 dark:bg-[#1a1d2e] text-gray-600 dark:text-slate-300 font-bold text-sm rounded-xl transition-colors">
            강의 둘러보기
          </button>
        </div>
      </div>
    )
  }

  if (!lecture) return null

  const discountRate = lecture.originalPrice
    ? Math.round((1 - lecture.price / lecture.originalPrice) * 100)
    : null

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-sm text-gray-400 hover:text-brand-500">← 뒤로</button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">결제하기</h1>
      </div>

      <div className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-xl p-5">
        <p className="text-xs text-gray-400 mb-3 font-medium">수강 신청 강의</p>
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-2xl shrink-0">🎮</div>
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2">{lecture.title}</p>
            <p className="text-xs text-gray-400">{GAME_LABEL[lecture.game] || lecture.game} · {lecture.coach?.nickname} 코치</p>
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-lg font-extrabold text-gray-900 dark:text-white">{Number(lecture.price).toLocaleString()}원</span>
              {lecture.originalPrice && (
                <>
                  <span className="text-xs text-gray-300 line-through">{Number(lecture.originalPrice).toLocaleString()}원</span>
                  <span className="text-xs font-bold text-orange-500">{discountRate}% 할인</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-xl p-5 space-y-3">
        <p className="text-sm font-bold text-gray-800 dark:text-white">영수증 받을 이메일</p>
        <input type="email" value={receiptEmail}
          onChange={e => { setReceiptEmail(e.target.value); setError('') }}
          placeholder="receipt@example.com"
          className="w-full bg-gray-50 dark:bg-[#0d0f14] border border-gray-200 dark:border-[#2a2d3e] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-400 text-gray-800 dark:text-slate-200 placeholder:text-gray-300" />
        <p className="text-xs text-gray-400">결제 완료 후 이메일로 수강 확인 메일이 발송됩니다.</p>
      </div>

      <div className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-xl p-5 space-y-3">
        <p className="text-sm font-bold text-gray-800 dark:text-white">결제 금액</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>강의 정가</span>
            <span>{Number(lecture.originalPrice || lecture.price).toLocaleString()}원</span>
          </div>
          {lecture.originalPrice && (
            <div className="flex justify-between text-orange-500">
              <span>할인 ({discountRate}%)</span>
              <span>-{(Number(lecture.originalPrice) - Number(lecture.price)).toLocaleString()}원</span>
            </div>
          )}
          <div className="border-t border-gray-100 dark:border-[#2a2d3e] pt-2 flex justify-between font-extrabold text-gray-900 dark:text-white text-base">
            <span>최종 결제 금액</span>
            <span className="text-brand-500">{Number(lecture.price).toLocaleString()}원</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <button onClick={handlePay}
        className="w-full py-4 rounded-xl font-extrabold text-base bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/30 transition-colors">
        {Number(lecture.price).toLocaleString()}원 결제하기
      </button>
    </div>
  )
}
