import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { TierBadge, StarRating, CardBadge } from './ui'
import useAuthStore from '../store/useAuthStore'

const STATUS_BTN = {
  approved: { label: '수강 중', cls: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-700 cursor-default' },
}

export default function LectureCard({ lecture, initialStatus = null }) {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [toast, setToast] = useState('')

  const { id, title, price, originalPrice, coach, rating, reviewCount, enrollCount, badges, thumbBg, thumbIcon } = lecture

  const discountRate = originalPrice
    ? Math.round((1 - price / originalPrice) * 100)
    : null

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleApply = (e) => {
    e.stopPropagation()
    if (!user) { showToast('로그인 후 수강 신청이 가능합니다.'); return }
    navigate('/checkout', { state: { lecture } })
  }

  // state 없이 prop 직접 사용 → initialStatus 변경 시 즉시 반영
  const renderBtn = () => {
    if (initialStatus === 'approved') {
      return (
        <button disabled onClick={e => e.stopPropagation()}
          className={`text-xs px-2.5 py-1 rounded-lg border ${STATUS_BTN.approved.cls}`}>
          수강 중
        </button>
      )
    }
    return (
      <button onClick={handleApply}
        className={`text-xs px-2.5 py-1 rounded-lg border transition-colors
          ${!user
            ? 'bg-gray-50 dark:bg-[#1a1d2e] text-gray-400 dark:text-[#6b7280] border-gray-200 dark:border-[#2a2d3e]'
            : 'bg-brand-50 dark:bg-[#1e2a4a] text-brand-600 dark:text-brand-400 border-brand-200 dark:border-brand-700/50 hover:bg-brand-500 hover:text-white hover:border-brand-500'
          }`}>
        {!user ? '🔒 신청' : '신청'}
      </button>
    )
  }

  return (
    <div onClick={() => navigate(`/lectures/${id}`)}
      className="group bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-xl overflow-hidden cursor-pointer
                 hover:border-brand-400 dark:hover:border-brand-500/60 hover:-translate-y-0.5 hover:shadow-md
                 transition-all duration-200 relative">

      {toast && (
        <div className="absolute inset-x-0 top-0 z-10 bg-red-500 text-white text-xs font-medium text-center py-1.5 rounded-t-xl">
          {toast}
        </div>
      )}

      <div className={`relative aspect-video bg-gradient-to-br ${thumbBg} flex items-center justify-center text-3xl overflow-hidden`}>
        <span className="select-none">{thumbIcon}</span>
        {badges?.length > 0 && (
          <div className="absolute flex flex-wrap gap-1 top-2 left-2">
            {badges.map(b => <CardBadge key={b} type={b} />)}
          </div>
        )}
      </div>

      <div className="p-3 space-y-2">
        <h3 className="text-sm font-medium text-gray-800 dark:text-slate-200 leading-snug line-clamp-2 min-h-[40px] group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors">
          {title}
        </h3>

        <div className="flex items-center gap-2">
          <StarRating rating={rating} />
          <span className="text-gray-300 dark:text-[#4a5568] text-xs">({reviewCount})</span>
          <span className="text-gray-300 dark:text-[#4a5568] text-xs">· {enrollCount}명</span>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-[10px] font-bold text-brand-500 dark:text-brand-400 shrink-0">
            {coach.nickname[0]}
          </div>
          <span className="text-xs text-gray-400 dark:text-[#6b7280] truncate">{coach.nickname}</span>
          <div className="ml-auto shrink-0">
            <TierBadge tier={coach.tier} tierName={coach.tierName} />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-gray-50 dark:border-white/5">
          <div className="flex items-baseline gap-1.5">
            <div className="w-4 h-4 bg-brand-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0">G</div>
            <span className="text-sm font-bold text-gray-900 dark:text-white">{price.toLocaleString()}</span>
            {originalPrice && (
              <>
                <span className="text-xs text-gray-300 dark:text-[#4a5568] line-through">{originalPrice.toLocaleString()}</span>
                <span className="text-xs font-semibold text-orange-500">{discountRate}%</span>
              </>
            )}
          </div>
          {renderBtn()}
        </div>
      </div>
    </div>
  )
}
