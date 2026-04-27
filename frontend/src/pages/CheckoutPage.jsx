import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../services/api'
import useAuthStore from '../store/useAuthStore'

const PAYMENT_METHODS = [
  { id: 'card',      label: '신용/체크카드', icon: '💳' },
  { id: 'kakaopay', label: '카카오페이',    icon: '💛' },
  { id: 'naverpay', label: '네이버페이',    icon: '💚' },
  { id: 'tosspay',  label: '토스페이',     icon: '💙' },
]

const GAME_LABEL = {
  lol: 'LoL', valorant: '발로란트', overwatch2: '오버워치2',
  battleground: '배그', tft: 'TFT', starcraft2: 'SC2',
}

// maxLength 제거하고 함수 내에서 16자리 제한
function formatCardNumber(raw) {
  const digits = raw.replace(/[^0-9]/g, '').slice(0, 16)
  const parts  = digits.match(/.{1,4}/g) || []
  return parts.join(' - ')
}

function formatExpiry(raw) {
  const digits = raw.replace(/[^0-9]/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return digits.slice(0, 2) + ' / ' + digits.slice(2)
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()

  const { lecture, queue = [], fromCart = false } = location.state || {}

  const [payMethod, setPayMethod] = useState('card')
  const [agreeTos, setAgreeTos]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [done, setDone]           = useState(false)

  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry]         = useState('')
  const [cvc, setCvc]               = useState('')

  useEffect(() => {
    if (!user)    { navigate('/login'); return }
    if (!lecture) { navigate(-1);      return }
    setCardNumber(''); setExpiry(''); setCvc('')
    setAgreeTos(false); setDone(false)
  }, [lecture?.id])

  if (!lecture) return null

  const discountRate = lecture.originalPrice
    ? Math.round((1 - lecture.price / lecture.originalPrice) * 100)
    : null

  const handlePay = async () => {
    if (!agreeTos) { alert('이용약관에 동의해주세요.'); return }
    setLoading(true)
    try {
      await api.post('/applications', { lecture_id: lecture.id })
      setDone(true)
    } catch (err) {
      alert(err.response?.data?.message || '결제 처리 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleNextLecture = () => {
    const [next, ...rest] = queue
    navigate('/checkout', {
      state: { lecture: next, queue: rest, fromCart: true },
      replace: true,
    })
  }

  if (done) {
    const hasNext = queue.length > 0
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-4xl mx-auto">✓</div>
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">결제 완료!</h1>
          <p className="text-gray-500 dark:text-[#8892a4] text-sm">
            수강 신청이 완료됐습니다.<br />코치 승인 후 강의를 수강할 수 있어요.
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-xl p-4 text-left space-y-2">
          <p className="text-sm font-semibold text-gray-800 dark:text-white line-clamp-2">{lecture.title}</p>
          <p className="text-sm text-brand-500 font-bold">{Number(lecture.price).toLocaleString()}원 결제</p>
          <p className="text-xs text-gray-400">결제수단: {PAYMENT_METHODS.find(m => m.id === payMethod)?.label}</p>
        </div>
        {hasNext && (
          <div className="bg-brand-50 dark:bg-[#1e2a4a] border border-brand-200 dark:border-brand-700/50 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">
              다음 결제할 강의가 {queue.length}개 남아있어요
            </p>
            <p className="text-xs text-brand-500 dark:text-brand-400 line-clamp-1">{queue[0].title}</p>
            <button onClick={handleNextLecture}
              className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm rounded-xl transition-colors">
              다음 강의 결제하기 →
            </button>
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={() => navigate('/mypage')}
            className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm rounded-xl transition-colors">
            내 수강 목록
          </button>
          <button onClick={() => navigate(fromCart ? '/cart' : '/lectures')}
            className="flex-1 py-3 bg-gray-100 dark:bg-[#1a1d2e] text-gray-600 dark:text-slate-300 font-bold text-sm rounded-xl transition-colors">
            {fromCart ? '장바구니로' : '강의 둘러보기'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">

      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="text-sm text-gray-400 hover:text-brand-500 transition-colors">← 뒤로</button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">결제하기</h1>
        {fromCart && (
          <span className="ml-auto text-xs text-gray-400 dark:text-[#6b7280]">
            {queue.length + 1}개 중 1번째
          </span>
        )}
      </div>

      {/* 강의 정보 */}
      <div className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-xl p-5">
        <p className="text-xs text-gray-400 dark:text-[#6b7280] mb-3 font-medium">수강 신청 강의</p>
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-2xl shrink-0">🎮</div>
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2">{lecture.title}</p>
            <p className="text-xs text-gray-400 dark:text-[#6b7280]">
              {GAME_LABEL[lecture.game] || lecture.game} · {lecture.coach?.nickname} 코치
            </p>
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-lg font-extrabold text-gray-900 dark:text-white">{Number(lecture.price).toLocaleString()}원</span>
              {lecture.originalPrice && (
                <>
                  <span className="text-xs text-gray-300 dark:text-[#4a5568] line-through">{Number(lecture.originalPrice).toLocaleString()}원</span>
                  <span className="text-xs font-bold text-orange-500">{discountRate}% 할인</span>
                </>
              )}
            </div>
          </div>
        </div>
        {queue.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-[#2a2d3e] space-y-1">
            <p className="text-xs text-gray-400 dark:text-[#6b7280]">다음 결제 예정</p>
            {queue.slice(0, 2).map((q, i) => (
              <p key={i} className="text-xs text-gray-500 dark:text-slate-400 line-clamp-1">· {q.title}</p>
            ))}
            {queue.length > 2 && <p className="text-xs text-gray-400">외 {queue.length - 2}개</p>}
          </div>
        )}
      </div>

      {/* 결제 수단 */}
      <div className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-xl p-5 space-y-3">
        <p className="text-sm font-bold text-gray-800 dark:text-white">결제 수단</p>
        <div className="grid grid-cols-2 gap-2">
          {PAYMENT_METHODS.map(m => (
            <button key={m.id} onClick={() => setPayMethod(m.id)}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all
                ${payMethod === m.id
                  ? 'border-brand-500 bg-brand-50 dark:bg-[#1e2a4a] text-brand-600 dark:text-brand-400'
                  : 'border-gray-200 dark:border-[#2a2d3e] text-gray-600 dark:text-slate-300 hover:border-brand-300'}`}>
              <span className="text-lg">{m.icon}</span>
              {m.label}
              {payMethod === m.id && <span className="ml-auto text-brand-500 text-xs">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* 카드 입력 */}
      {payMethod === 'card' && (
        <div className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-xl p-5 space-y-3">
          <p className="text-sm font-bold text-gray-800 dark:text-white">카드 정보</p>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 dark:text-[#6b7280] mb-1.5 block">카드 번호</label>
              <input
                type="text"
                inputMode="numeric"
                value={cardNumber}
                onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                placeholder="0000 - 0000 - 0000 - 0000"
                className="w-full bg-gray-50 dark:bg-[#0d0f14] border border-gray-200 dark:border-[#2a2d3e] rounded-lg px-3 py-2.5
                           text-sm text-gray-800 dark:text-slate-200 placeholder:text-gray-300 dark:placeholder:text-[#4a5568]
                           outline-none focus:border-brand-400 transition-colors tracking-widest font-mono"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-400 dark:text-[#6b7280] mb-1.5 block">유효기간</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={expiry}
                  onChange={e => setExpiry(formatExpiry(e.target.value))}
                  placeholder="MM / YY"
                  maxLength={7}
                  className="w-full bg-gray-50 dark:bg-[#0d0f14] border border-gray-200 dark:border-[#2a2d3e] rounded-lg px-3 py-2.5
                             text-sm text-gray-800 dark:text-slate-200 placeholder:text-gray-300 dark:placeholder:text-[#4a5568]
                             outline-none focus:border-brand-400 transition-colors font-mono"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-400 dark:text-[#6b7280] mb-1.5 block">CVC</label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={cvc}
                  onChange={e => setCvc(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
                  placeholder="•••"
                  maxLength={3}
                  className="w-full bg-gray-50 dark:bg-[#0d0f14] border border-gray-200 dark:border-[#2a2d3e] rounded-lg px-3 py-2.5
                             text-sm text-gray-800 dark:text-slate-200 placeholder:text-gray-300 dark:placeholder:text-[#4a5568]
                             outline-none focus:border-brand-400 transition-colors font-mono"
                />
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400 dark:text-[#6b7280]">🔒 카드 정보는 안전하게 암호화되어 처리됩니다.</p>
        </div>
      )}

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

      {/* 약관 동의 */}
      <label className="flex items-start gap-2.5 cursor-pointer select-none">
        <input type="checkbox" checked={agreeTos} onChange={e => setAgreeTos(e.target.checked)}
          className="w-4 h-4 accent-brand-500 cursor-pointer mt-0.5 shrink-0" />
        <span className="text-sm text-gray-600 dark:text-slate-300">
          주문 내용을 확인했으며{' '}
          <span className="text-brand-500 underline cursor-pointer">이용약관</span>
          {' '}및{' '}
          <span className="text-brand-500 underline cursor-pointer">결제 정책</span>에 동의합니다.
        </span>
      </label>

      {/* 결제 버튼 */}
      <button onClick={handlePay} disabled={loading || !agreeTos}
        className={`w-full py-4 rounded-xl font-extrabold text-base transition-colors
          ${loading
            ? 'bg-brand-400 text-white cursor-wait'
            : !agreeTos
            ? 'bg-gray-100 dark:bg-[#1a1d2e] text-gray-400 cursor-not-allowed'
            : 'bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/30'}`}>
        {loading ? '결제 처리 중...' : `${Number(lecture.price).toLocaleString()}원 결제하기`}
      </button>

      <p className="text-xs text-center text-gray-400 dark:text-[#6b7280]">
        결제 완료 후 코치 승인을 받으면 강의를 수강할 수 있습니다.
      </p>
    </div>
  )
}
