import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/useAuthStore'

const TOSS_CLIENT_KEY = 'test_ck_ALnQvDd2VJqJqeylKnjN3Mj7X41m'

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

  const { lecture, queue = [], fromCart = false } = location.state || {}

  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [receiptEmail, setReceiptEmail] = useState('')

  useEffect(() => {
    if (!user)    { navigate('/login'); return }
    if (!lecture) { navigate(-1);      return }
    setReceiptEmail(user.email || '')
    setError('')
  }, [])

  if (!lecture) return null

  const discountRate = lecture.originalPrice
    ? Math.round((1 - lecture.price / lecture.originalPrice) * 100)
    : null

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
      const orderName = lecture.title.length > 30
        ? lecture.title.slice(0, 30) + '...'
        : lecture.title

      // successUrl → 별도 페이지로 분리
      const successUrl = `${window.location.origin}/checkout/success?lectureId=${lecture.id}&amount=${lecture.price}&email=${encodeURIComponent(receiptEmail)}`
      const failUrl    = `${window.location.origin}/checkout/fail`

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
      if (err.code !== 'USER_CANCEL') {
        setError('결제 창을 열 수 없습니다. 잠시 후 다시 시도해주세요.')
      }
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-sm text-gray-400 hover:text-brand-500 transition-colors">← 뒤로</button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">결제하기</h1>
        {fromCart && <span className="ml-auto text-xs text-gray-400">{queue.length + 1}개 중 1번째</span>}
      </div>

      {/* 강의 정보 */}
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

      {/* 영수증 이메일 */}
      <div className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">📧</span>
          <p className="text-sm font-bold text-gray-800 dark:text-white">영수증 받을 이메일</p>
        </div>
        <input type="email" value={receiptEmail}
          onChange={e => { setReceiptEmail(e.target.value); setError('') }}
          placeholder="receipt@example.com"
          className="w-full bg-gray-50 dark:bg-[#0d0f14] border border-gray-200 dark:border-[#2a2d3e] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-400 text-gray-800 dark:text-slate-200 placeholder:text-gray-300" />
        <p className="text-xs text-gray-400">결제 완료 후 입력하신 이메일로 수강 확인 메일이 발송됩니다.</p>
      </div>

      {/* 결제 금액 */}
      <div className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-xl p-5 space-y-3">
        <p className="text-sm font-bold text-gray-800 dark:text-white">결제 금액</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-500 dark:text-[#8892a4]">
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

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-xl p-4">
        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">💳 토스페이먼츠 결제</p>
        <p className="text-xs text-blue-500 dark:text-blue-300">카드, 카카오페이, 네이버페이, PAYCO 등 다양한 결제수단을 지원합니다.</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400">
          ⚠️ {error}
        </div>
      )}

      <button onClick={handlePay} disabled={loading}
        className="w-full py-4 rounded-xl font-extrabold text-base bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/30 transition-colors">
        {loading ? '결제창 여는 중...' : `💳 ${Number(lecture.price).toLocaleString()}원 결제하기`}
      </button>
    </div>
  )
}
