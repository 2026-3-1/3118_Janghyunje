import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import useAuthStore from '../store/useAuthStore'
import { sendEnrollmentEmail } from '../utils/emailService'

export default function CheckoutSuccessPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [sentEmail, setSentEmail] = useState('')

  useEffect(() => {
    const lectureId = searchParams.get('lectureId')
    const email     = searchParams.get('email') || ''
    const amount    = searchParams.get('amount')

    if (!lectureId) { navigate('/'); return }

    const process = async () => {
      try {
        await api.post('/applications', { lecture_id: Number(lectureId) })
        try { await api.delete(`/cart/${lectureId}`) } catch {}

        // EmailJS 이메일 발송 — await로 완료 대기
        if (email) {
          const decodedEmail = decodeURIComponent(email)
          setSentEmail(decodedEmail)
          await sendEnrollmentEmail({
            toEmail:      decodedEmail,
            nickname:     user?.nickname || '',
            lectureTitle: '',
            price:        Number(amount) || 0,
          })
        }

        setStatus('done')
      } catch (err) {
        if (err.response?.status === 409) {
          setStatus('done')
        } else {
          setErrorMsg(err.response?.data?.message || '처리 중 오류가 발생했습니다.')
          setStatus('error')
        }
      }
    }
    process()
  }, [])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 dark:text-[#8892a4]">결제 처리 중...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-4xl mx-auto">✕</div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">오류 발생</h1>
        <p className="text-gray-500 text-sm">{errorMsg}</p>
        <button onClick={() => navigate('/lectures')}
          className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-colors">
          강의 목록으로
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center space-y-6">
      <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-4xl mx-auto">✓</div>
      <div className="space-y-2">
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">결제 완료!</h1>
        <p className="text-gray-500 dark:text-[#8892a4] text-sm">
          수강 신청이 완료됐습니다.<br />지금 바로 강의를 수강할 수 있어요.
        </p>
      </div>
      {sentEmail && (
        <p className="text-xs text-green-500">
          📧 {sentEmail} 로 확인 메일을 발송했습니다.
        </p>
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
