export const GAME_LIST = [
  { value: 'all',          label: '전체',        icon: '⊞', iconBg: 'bg-brand-50 dark:bg-[#1e2235] border border-brand-100 dark:border-[#2a2d3e]', iconColor: 'text-brand-500' },
  { value: 'lol',          label: '리그오브레전드', icon: 'LoL', iconBg: 'bg-gradient-to-br from-[#c89b3c] to-[#785a28]', iconColor: 'text-white' },
  { value: 'valorant',     label: '발로란트',      icon: 'V',   iconBg: 'bg-gradient-to-br from-[#ff4655] to-[#bd3944]',  iconColor: 'text-white' },
  { value: 'tft',          label: '전략적팀전투',  icon: 'TFT', iconBg: 'bg-gradient-to-br from-[#9a5fb4] to-[#6b3fa0]',  iconColor: 'text-white' },
  { value: 'battleground', label: '배틀그라운드',  icon: 'BG',  iconBg: 'bg-gradient-to-br from-[#e8a838] to-[#c47d1a]',  iconColor: 'text-white' },
  { value: 'overwatch2',   label: '오버워치',      icon: 'OW',  iconBg: 'bg-gradient-to-br from-[#f99e1a] to-[#e87c17]',  iconColor: 'text-white' },
  { value: 'starcraft2',   label: '스타크래프트',  icon: 'SC',  iconBg: 'bg-gradient-to-br from-[#4a9eff] to-[#1a6fcc]',  iconColor: 'text-white' },
]

export const TIER_LIST = {
  lol: [
    { value: 'all', label: '전체 랭크' },
    { value: 'iron', label: '아이언' }, { value: 'bronze', label: '브론즈' },
    { value: 'silver', label: '실버' }, { value: 'gold', label: '골드' },
    { value: 'platinum', label: '플래티넘' }, { value: 'emerald', label: '에메랄드' },
    { value: 'diamond', label: '다이아몬드' }, { value: 'master', label: '마스터' },
    { value: 'grandmaster', label: '그랜드마스터' }, { value: 'challenger', label: '챌린저' },
  ],
  valorant: [
    { value: 'all', label: '전체 랭크' },
    { value: 'iron', label: '아이언' }, { value: 'bronze', label: '브론즈' },
    { value: 'silver', label: '실버' }, { value: 'gold', label: '골드' },
    { value: 'platinum', label: '플래티넘' }, { value: 'diamond', label: '다이아몬드' },
    { value: 'ascendant', label: '어센던트' }, { value: 'immortal', label: '이모탈' },
    { value: 'radiant', label: '레디언트' },
  ],
  default: [
    { value: 'all', label: '전체 랭크' },
    { value: 'bronze', label: '브론즈' }, { value: 'silver', label: '실버' },
    { value: 'gold', label: '골드' }, { value: 'platinum', label: '플래티넘' },
    { value: 'diamond', label: '다이아몬드' },
  ],
}

export const POSITION_LIST = [
  { value: 'all', label: '포지션' },
  { value: 'top', label: '탑' }, { value: 'jungle', label: '정글' },
  { value: 'mid', label: '미드' }, { value: 'adc', label: '원딜' },
  { value: 'support', label: '서포터' },
]

export const SORT_LIST = [
  { value: 'ranking', label: '랭킹순' },
  { value: 'rating',  label: '평점순' },
  { value: 'price_asc', label: '가격 낮은순' },
  { value: 'price_desc', label: '가격 높은순' },
  { value: 'newest', label: '최신순' },
]

export const COACH_TYPE_LIST = [
  { value: 'pro',     label: '프로게이머', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800', dot: 'bg-green-500' },
  { value: 'coach',   label: '프로팀코치', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800', dot: 'bg-purple-500' },
  { value: 'streamer',label: '스트리머',   color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800', dot: 'bg-blue-400' },
  { value: 'sale',    label: '할인중',     color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800', dot: 'bg-orange-500' },
]

export const TIER_BADGE_COLORS = {
  challenger:   'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
  grandmaster:  'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
  master:       'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  diamond:      'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  emerald:      'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  platinum:     'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-800',
  gold:         'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  silver:       'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700',
  bronze:       'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  radiant:      'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
  immortal:     'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
  default:      'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700',
}
