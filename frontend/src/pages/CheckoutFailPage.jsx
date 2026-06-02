import { useNavigate } from 'react-router-dom'

export default function CheckoutFailPage() {
  const navigate = useNavigate()

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center space-y-6">
      <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-4xl mx-auto">✕</div>
      <div className="space-y-2">
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">결제 실패</h1>
        <p className="text-gray-500 dark:text-[#8892a4] text-sm">
          결제가 취소되었거나 오류가 발생했습니다.
        </p>
      </div>
      <div className="flex gap-3">
        <button onClick={() => navigate(-1)}
          className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm rounded-xl transition-colors">
          다시 시도
        </button>
        <button onClick={() => navigate('/lectures')}
          className="flex-1 py-3 bg-gray-100 dark:bg-[#1a1d2e] text-gray-600 dark:text-slate-300 font-bold text-sm rounded-xl transition-colors">
          강의 목록으로
        </button>
      </div>
    </div>
  )
}
