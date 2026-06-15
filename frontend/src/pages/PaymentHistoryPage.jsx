import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import useAuthStore from '../store/useAuthStore'

const GAME_LABEL = {
  lol: 'LoL', valorant: '발로란트', overwatch2: '오버워치2',
  battleground: '배그', tft: 'TFT', starcraft2: 'SC2',
}

export default function PaymentHistoryPage() {
  const navigate  = useNavigate()
  const { user }  = useAuthStore()

  const [payments, setPayments] = useState([])
  const [loading, setLoading]   = useState(true)
  const [toast, setToast]       = useState({ msg: '', type: '' })
  const [refundModal, setRefundModal] = useState(null) // { applicationId, lectureTitle, price, progress }
  const [refundReason, setRefundReason] = useState('')
  const [refunding, setRefunding]       = useState(false)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '', type: '' }), 3500)
  }

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const res = await api.get('/payments')
      setPayments(res.data.data || [])
    } catch {
      showToast('결제 내역을 불러오지 못했습니다.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    fetchPayments()
  }, [user])

  const handleRefund = async () => {
    if (!refundReason.trim()) { showToast('환불 사유를 입력해주세요.', 'error'); return }
    setRefunding(true)
    try {
      await api.post(`/payments/${refundModal.applicationId}/refund`, { reason: refundReason })
      showToast('환불이 완료됐습니다.')
      setRefundModal(null)
      setRefundReason('')
      fetchPayments()
    } catch (err) {
      const msg = err.response?.data?.message || '환불 처리 중 오류가 발생했습니다.'
      showToast(msg, 'error')
      setRefundModal(null)
    } finally {
      setRefunding(false)
    }
  }

  const statusLabel = (p) => {
    if (p.refunded_at) return { text: '환불 완료', cls: 'bg-red-100 dark:bg-red-900/30 text-red-600' }
    return { text: '결제 완료', cls: 'bg-green-100 dark:bg-green-900/30 text-green-600' }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

      {/* Toast */}
      {toast.msg && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium whitespace-nowrap
          ${toast.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
          {toast.type === 'error' ? '⚠️ ' : '✓ '}{toast.msg}
        </div>
      )}

      {/* 환불 모달 */}
      {refundModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white dark:bg-[#13161e] rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl border border-gray-100 dark:border-[#1e2235]">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">환불 신청</h3>
            <div className="bg-gray-50 dark:bg-[#0d0f14] rounded-xl p-4 space-y-2">
              <p className="text-sm font-semibold text-gray-800 dark:text-white">{refundModal.lectureTitle}</p>
              <p className="text-sm text-brand-500 font-bold">{Number(refundModal.price).toLocaleString()}원</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-brand-500 h-2 rounded-full transition-all" style={{ width: `${refundModal.progress}%` }} />
                </div>
                <span className="text-xs text-gray-500">수강 {refundModal.progress}%</span>
              </div>
              {refundModal.progress >= 30 ? (
                <p className="text-xs text-red-500 mt-1">⚠️ 수강률이 30% 이상으로 환불이 불가합니다.</p>
              ) : (
                <p className="text-xs text-green-600 mt-1">✓ 환불 가능합니다 (수강률 30% 미만)</p>
              )}
            </div>

            {refundModal.progress < 30 && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 dark:text-[#8892a4]">환불 사유</label>
                <textarea
                  value={refundReason}
                  onChange={e => setRefundReason(e.target.value)}
                  placeholder="환불 사유를 입력해주세요."
                  rows={3}
                  className="w-full bg-gray-50 dark:bg-[#0d0f14] border border-gray-200 dark:border-[#2a2d3e] rounded-lg px-3 py-2.5 text-sm text-gray-800 dark:text-slate-200 outline-none focus:border-brand-400 resize-none"
                />
              </div>
            )}

            <div className="flex gap-2">
              {refundModal.progress < 30 && (
                <button onClick={handleRefund} disabled={refunding}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-sm font-semibold rounded-xl transition-colors">
                  {refunding ? '처리 중...' : '환불 신청'}
                </button>
              )}
              <button onClick={() => { setRefundModal(null); setRefundReason('') }}
                className="flex-1 py-2.5 bg-gray-100 dark:bg-[#1a1d2e] text-gray-600 dark:text-slate-300 text-sm font-semibold rounded-xl transition-colors hover:bg-gray-200">
                {refundModal.progress >= 30 ? '닫기' : '취소'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">💳 결제 내역</h1>
        <p className="text-sm text-gray-400">총 {payments.length}건</p>
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <div className="text-5xl">💳</div>
          <p className="text-gray-500 dark:text-[#8892a4]">결제 내역이 없습니다.</p>
          <button onClick={() => navigate('/lectures')}
            className="px-4 py-2 bg-brand-500 text-white text-sm font-semibold rounded-lg hover:bg-brand-600 transition-colors">
            강의 둘러보기
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map(p => {
            const sl = statusLabel(p)
            return (
              <div key={p.application_id}
                className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sl.cls}`}>{sl.text}</span>
                      <span className="text-xs text-gray-400">{GAME_LABEL[p.game] || p.game}</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">{p.lecture_title}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                      <span>코치: {p.coach_nickname}</span>
                      <span>결제일: {new Date(p.paid_at).toLocaleDateString('ko-KR')}</span>
                      {p.refunded_at && <span className="text-red-500">환불일: {new Date(p.refunded_at).toLocaleDateString('ko-KR')}</span>}
                    </div>

                    {/* 진도율 바 */}
                    {!p.refunded_at && (
                      <div className="flex items-center gap-2 pt-1">
                        <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 max-w-[200px]">
                          <div className={`h-1.5 rounded-full ${p.progress_percent >= 30 ? 'bg-orange-400' : 'bg-brand-500'}`}
                            style={{ width: `${p.progress_percent}%` }} />
                        </div>
                        <span className="text-xs text-gray-400">수강 {p.progress_percent}%</span>
                        {p.progress_percent >= 30 && <span className="text-xs text-orange-500">환불 불가</span>}
                      </div>
                    )}

                    {p.refund_reason && (
                      <p className="text-xs text-gray-400 bg-gray-50 dark:bg-[#0d0f14] rounded-lg px-3 py-1.5">
                        환불 사유: {p.refund_reason}
                      </p>
                    )}
                  </div>

                  <div className="text-right space-y-2 shrink-0">
                    <p className="text-base font-extrabold text-gray-900 dark:text-white">
                      {Number(p.price).toLocaleString()}원
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {!p.refunded_at && (
                        <>
                          <button onClick={() => navigate(`/lectures/${p.lecture_id}/contents`)}
                            className="text-xs px-3 py-1.5 bg-brand-50 dark:bg-[#1e2a4a] text-brand-500 border border-brand-200 rounded-lg hover:bg-brand-100 transition-colors font-medium">
                            강의 보기
                          </button>
                          <button
                            onClick={() => setRefundModal({
                              applicationId: p.application_id,
                              lectureTitle:  p.lecture_title,
                              price:         p.price,
                              progress:      p.progress_percent,
                            })}
                            className="text-xs px-3 py-1.5 bg-gray-50 dark:bg-[#1a1d2e] text-gray-500 border border-gray-200 dark:border-[#2a2d3e] rounded-lg hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors font-medium">
                            환불 신청
                          </button>
                        </>
                      )}
                      {p.refunded_at && (
                        <span className="text-xs px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-500 border border-red-200 rounded-lg font-medium">
                          환불 완료
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
