import { useState, useEffect } from 'react'
import api from '../services/api'
import useAuthStore from '../store/useAuthStore'

export default function FollowButton({ coachId }) {
  const { user } = useAuthStore()
  const [status, setStatus]   = useState({ is_following: false, follower_count: 0 })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user || user.role !== 'student' || !coachId) return
    api.get(`/coaches/${coachId}/follow`)
      .then(res => setStatus(res.data.data))
      .catch(() => {})
  }, [coachId, user])

  const handleToggle = async () => {
    if (!user) return
    setLoading(true)
    try {
      if (status.is_following) {
        const res = await api.delete(`/coaches/${coachId}/follow`)
        setStatus(res.data.data)
      } else {
        const res = await api.post(`/coaches/${coachId}/follow`)
        setStatus(res.data.data)
      }
    } catch {} finally { setLoading(false) }
  }

  // 코치 본인이거나 비로그인 학생이 아닌 경우 숨김
  if (!user || user.role !== 'student' || user.id === coachId) return null

  return (
    <button onClick={handleToggle} disabled={loading}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
        ${status.is_following
          ? 'bg-brand-50 dark:bg-[#1e2a4a] border-brand-400 text-brand-600 dark:text-brand-400'
          : 'bg-white dark:bg-[#1a1d2e] border-gray-200 dark:border-[#2a2d3e] text-gray-600 dark:text-slate-300 hover:border-brand-400 hover:text-brand-500'}`}>
      {loading ? '...' : status.is_following ? '✓ 팔로잉' : '+ 팔로우'}
      <span className="text-gray-400 dark:text-[#6b7280] font-normal">{status.follower_count}</span>
    </button>
  )
}
