import { GAME_LIST } from '../constants/games'
import useLectureStore from '../store/useLectureStore'

export default function GameTabs() {
  const { filter, setFilter, fetchLectures } = useLectureStore()

  const handleClick = (value) => {
    setFilter('game', value)
    setFilter('tier', 'all')
    setTimeout(() => fetchLectures(), 0)
  }

  return (
    <div className="bg-white dark:bg-[#13161e] border-b border-gray-100 dark:border-[#1e2235] overflow-x-auto">
      <div className="max-w-6xl mx-auto px-4 flex gap-1">
        {GAME_LIST.map(game => (
          <button
            key={game.value}
            onClick={() => handleClick(game.value)}
            className={`flex flex-col items-center gap-1 py-2.5 px-3 border-b-2 min-w-[72px] transition-all shrink-0
              ${filter.game === game.value
                ? 'border-brand-500'
                : 'border-transparent hover:bg-gray-50 dark:hover:bg-[#1a1d2e]'
              }`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${game.iconBg} ${game.iconColor}`}>
              {game.icon}
            </div>
            <span className={`text-[10px] whitespace-nowrap transition-colors
              ${filter.game === game.value
                ? 'text-brand-500 dark:text-brand-400 font-medium'
                : 'text-gray-400 dark:text-[#8892a4]'
              }`}>
              {game.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
