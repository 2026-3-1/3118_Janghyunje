import { TIER_BADGE_COLORS } from '../constants/games'

export function TierBadge({ tier, tierName }) {
  const cls = TIER_BADGE_COLORS[tier] || TIER_BADGE_COLORS.default
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${cls}`}>
      {tierName || tier}
    </span>
  )
}

export function GameBadge({ gameName }) {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-brand-50 dark:bg-[#1e2a4a] text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-700/50">
      {gameName}
    </span>
  )
}

export function CardBadge({ type }) {
  const map = {
    online: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    sale:   'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
    rec:    'bg-brand-50 dark:bg-[#1e2a4a] text-brand-600 dark:text-brand-400',
  }
  const label = { online: '온라인', sale: '할인', rec: '추천' }
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${map[type] || ''}`}>
      {label[type]}
    </span>
  )
}

export function StarRating({ rating, size = 'sm' }) {
  const textSize = size === 'lg' ? 'text-base' : 'text-xs'
  return (
    <div className={`flex items-center gap-0.5 ${textSize}`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < Math.round(rating) ? 'text-amber-400' : 'text-gray-200 dark:text-gray-700'}>★</span>
      ))}
      <span className="text-amber-500 font-semibold ml-0.5 text-xs">{rating.toFixed(1)}</span>
    </div>
  )
}

export function Spinner({ size = 'md' }) {
  const s = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-10 h-10' }[size]
  return <div className={`${s} border-2 border-gray-200 dark:border-white/10 border-t-brand-500 rounded-full animate-spin`} />
}

export function LoadingScreen() {
  return (
    <div className="flex items-center justify-center py-24">
      <Spinner size="lg" />
    </div>
  )
}

export function EmptyState({ title = '결과가 없습니다', description = '조건을 바꿔서 다시 검색해보세요.', action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-5xl mb-4">🎮</div>
      <p className="text-gray-700 dark:text-slate-300 font-semibold text-lg mb-2">{title}</p>
      <p className="text-gray-400 dark:text-slate-500 text-sm mb-6">{description}</p>
      {action && (
        <button onClick={action.onClick}
          className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm rounded-lg transition-colors">
          {action.label}
        </button>
      )}
    </div>
  )
}

export function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-1.5 mt-8">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}
        className="px-3 py-1.5 rounded-lg text-sm bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-[#2a2d3e] text-gray-500 dark:text-[#8892a4] hover:border-brand-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
        이전
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
        <button key={p} onClick={() => onPageChange(p)}
          className={`w-8 h-8 rounded-lg text-sm transition-colors
            ${p === currentPage
              ? 'bg-brand-500 text-white'
              : 'bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-[#2a2d3e] text-gray-500 dark:text-[#8892a4] hover:border-brand-400'
            }`}>
          {p}
        </button>
      ))}
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}
        className="px-3 py-1.5 rounded-lg text-sm bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-[#2a2d3e] text-gray-500 dark:text-[#8892a4] hover:border-brand-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
        다음
      </button>
    </div>
  )
}
