import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { LoadingScreen, EmptyState } from '../components/ui'

const GAME_LABEL = {
  lol: 'LoL', valorant: '발로란트', overwatch2: '오버워치2',
  battleground: '배그', tft: 'TFT', starcraft2: 'SC2',
}
const GAME_COLOR = {
  lol: 'bg-blue-500', valorant: 'bg-red-500', overwatch2: 'bg-orange-500',
  battleground: 'bg-yellow-600', tft: 'bg-purple-500', starcraft2: 'bg-gray-500',
}

export default function CartPage() {
  const navigate = useNavigate()
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(new Set())
  const [applying, setApplying] = useState(false)
  const [toast, setToast] = useState({ msg: '', type: '' })

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '', type: '' }), 3000)
  }

  const loadCart = () => {
    setLoading(true)
    api.get('/cart')
      .then(res => {
        const data = res.data.data || []
        setItems(data)
        setSelected(new Set(data.map(i => i.lecture_id ?? i.id)))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadCart() }, [])

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === items.length) setSelected(new Set())
    else setSelected(new Set(items.map(i => i.lecture_id ?? i.id)))
  }

  const handleRemove = async (lectureId) => {
    try {
      await api.delete(`/cart/${lectureId}`)
      setItems(prev => prev.filter(i => (i.lecture_id ?? i.id) !== lectureId))
      setSelected(prev => { const n = new Set(prev); n.delete(lectureId); return n })
    } catch {
      showToast('삭제에 실패했습니다.', 'error')
    }
  }

  const handleApplySelected = async () => {
    const targets = items.filter(i => selected.has(i.lecture_id ?? i.id))
    if (!targets.length) { showToast('신청할 강의를 선택해주세요.', 'error'); return }
    setApplying(true)
    let successCount = 0
    for (const item of targets) {
      try {
        await api.post('/applications', { lecture_id: item.lecture_id ?? item.id })
        await api.delete(`/cart/${item.lecture_id ?? item.id}`)
        successCount++
      } catch {}
    }
    showToast(`${successCount}개 강의 수강 신청이 완료됐습니다!`)
    loadCart()
    setApplying(false)
  }

  const selectedItems  = items.filter(i => selected.has(i.lecture_id ?? i.id))
  const totalPrice     = selectedItems.reduce((s, i) => s + Number(i.price), 0)
  const totalOriginal  = selectedItems.reduce((s, i) => s + Number(i.original_price || i.price), 0)
  const totalDiscount  = totalOriginal - totalPrice

  if (loading) return <LoadingScreen />

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {toast.msg && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium whitespace-nowrap
          ${toast.type === 'error'
            ? 'bg-red-50 dark:bg-red-900/30 border-red-200 text-red-600'
            : 'bg-green-50 dark:bg-green-900/30 border-green-200 text-green-700'}`}>
          {toast.type === 'error' ? '⚠️ ' : '✓ '}{toast.msg}
        </div>
      )}

      <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
        장바구니 <span className="text-gray-400 dark:text-[#6b7280] font-normal text-base">{items.length}개</span>
      </h1>

      {items.length === 0 ? (
        <EmptyState
          title="장바구니가 비어있어요"
          description="관심 있는 강의를 담아보세요."
          action={{ label: '강의 둘러보기', onClick: () => navigate('/lectures') }}
        />
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">

          {/* 강의 목록 */}
          <div className="flex-1 space-y-3">
            {/* 전체 선택 */}
            <label className="flex items-center gap-2 px-1 cursor-pointer select-none">
              <input type="checkbox" checked={selected.size === items.length}
                onChange={toggleAll}
                className="w-4 h-4 accent-brand-500 cursor-pointer" />
              <span className="text-sm text-gray-600 dark:text-slate-300">전체 선택 ({selected.size}/{items.length})</span>
            </label>

            {items.map(item => {
              const lid = item.lecture_id ?? item.id
              const isSelected = selected.has(lid)
              const discount = item.original_price
                ? Math.round((1 - item.price / item.original_price) * 100)
                : null

              return (
                <div key={lid}
                  className={`bg-white dark:bg-[#13161e] border rounded-xl p-4 transition-all
                    ${isSelected
                      ? 'border-brand-400 dark:border-brand-500/60'
                      : 'border-gray-100 dark:border-[#1e2235]'}`}>
                  <div className="flex items-start gap-3">
                    <input type="checkbox" checked={isSelected}
                      onChange={() => toggleSelect(lid)}
                      className="w-4 h-4 accent-brand-500 cursor-pointer mt-1 shrink-0" />

                    <div className="flex-1 min-w-0 space-y-1.5 cursor-pointer"
                      onClick={() => navigate(`/lectures/${lid}`)}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded text-white font-medium ${GAME_COLOR[item.game] || 'bg-gray-500'}`}>
                          {GAME_LABEL[item.game] || item.game}
                        </span>
                        {discount && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-600 font-medium">
                            {discount}% 할인
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 line-clamp-2">{item.title}</p>
                      <p className="text-xs text-gray-400 dark:text-[#6b7280]">코치 {item.coach_nickname} · ⭐ {Number(item.rating).toFixed(1)} ({item.review_count})</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-base font-bold text-gray-900 dark:text-white">{Number(item.price).toLocaleString()}원</span>
                        {item.original_price && (
                          <span className="text-xs text-gray-300 dark:text-[#4a5568] line-through">{Number(item.original_price).toLocaleString()}원</span>
                        )}
                      </div>
                    </div>

                    <button onClick={() => handleRemove(lid)}
                      className="text-gray-300 dark:text-[#4a5568] hover:text-red-500 transition-colors text-lg shrink-0">
                      ✕
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 결제 요약 */}
          <div className="lg:w-72 shrink-0">
            <div className="bg-white dark:bg-[#13161e] border border-gray-100 dark:border-[#1e2235] rounded-xl p-5 space-y-4 sticky top-20">
              <h2 className="text-sm font-bold text-gray-800 dark:text-white">수강 신청 요약</h2>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-500 dark:text-[#8892a4]">
                  <span>선택 강의 ({selectedItems.length}개)</span>
                  <span>{totalOriginal.toLocaleString()}원</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-orange-500">
                    <span>할인</span>
                    <span>-{totalDiscount.toLocaleString()}원</span>
                  </div>
                )}
                <div className="border-t border-gray-100 dark:border-[#2a2d3e] pt-2 flex justify-between font-bold text-gray-900 dark:text-white">
                  <span>합계</span>
                  <span>{totalPrice.toLocaleString()}원</span>
                </div>
              </div>

              <button
                onClick={handleApplySelected}
                disabled={applying || selected.size === 0}
                className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white font-bold text-sm rounded-xl transition-colors">
                {applying ? '신청 중...' : `선택 강의 수강 신청 (${selectedItems.length}개)`}
              </button>

              <p className="text-xs text-gray-400 dark:text-[#6b7280] text-center">
                수강 신청 후 코치 승인이 필요합니다.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
