import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { LoadingScreen, EmptyState } from '../components/ui'

const GAME_LABEL = {
  lol: 'League of Legends', valorant: '발로란트', overwatch2: '오버워치 2',
  battleground: '배틀그라운드', tft: '전략적팀전투', starcraft2: '스타크래프트 2',
}

export default function GrowthPage() {
  const navigate = useNavigate()
  const [reports, setReports] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    api.get('/growth/reports')
      .then(res => {
        const data = res.data.data || []
        setReports(data)
        if (data.length > 0) setSelected(data[0])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingScreen />

  if (reports.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <EmptyState
          title="아직 성장 분석이 없어요"
          description="코치가 성장 분석을 작성하면 여기서 확인할 수 있습니다."
          action={{ label: '강의 둘러보기', onClick: () => navigate('/lectures') }}
        />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-6">📊 성장 분석</h1>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* 목록 사이드바 */}
        <aside className="lg:w-72 shrink-0 space-y-2">
          {reports.map(r => (
            <button key={r.id}
              onClick={() => setSelected(r)}
              className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all
                ${selected?.id === r.id
                  ? 'border-brand-400 dark:border-brand-500/60 bg-brand-50 dark:bg-[#1e2a4a]'
                  : 'border-gray-100 dark:border-[#1e2235] bg-white dark:bg-[#13161e] hover:border-brand-300'}`}>
              <p className={`text-sm font-semibold line-clamp-2 ${selected?.id === r.id ? 'text-brand-600 dark:text-brand-400' : 'text-gray-800 dark:text-slate-200'}`}>
                {r.title}
              </p>
              <p className="text-xs text-gray-400 dark:text-[#6b7280] mt-1">
                {GAME_LABEL[r.game] || r.game} · {r.coach_nickname} 코치
              </p>
              <p className="text-xs text-gray-300 dark:text-[#4a5568] mt-0.5">
                {new Date(r.created_at).toLocaleDateString('ko-KR')}
              </p>
            </button>
          ))}
        </aside>

        {/* 본문 */}
        {selected && (
          <article className="flex-1 bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-xl p-6 space-y-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-[#6b7280]">
                <span>{GAME_LABEL[selected.game] || selected.game}</span>
                <span>·</span>
                <span>{selected.lecture_title}</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selected.title}</h2>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-xs font-bold text-brand-500">
                  {selected.coach_nickname?.[0]}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{selected.coach_nickname} 코치 작성</span>
                <span className="text-xs text-gray-300 dark:text-[#4a5568]">
                  {new Date(selected.created_at).toLocaleDateString('ko-KR')}
                </span>
              </div>
            </div>

            <hr className="border-gray-100 dark:border-[#1e2235]" />

            <div className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {selected.content}
            </div>
          </article>
        )}
      </div>
    </div>
  )
}
