import { useEffect, useState } from 'react'
import api from '../services/api'
import useAuthStore from '../store/useAuthStore'

// 내 수강 신청 목록을 { lectureId: status } 맵으로 반환
export default function useMyApplications() {
  const { user } = useAuthStore()
  const [statusMap, setStatusMap] = useState({})

  useEffect(() => {
    if (!user || user.role !== 'student') return
    const token = localStorage.getItem('token')
    if (!token) return

    api.get('/applications/student')
      .then(res => {
        const map = {}
        ;(res.data.data || []).forEach(a => {
          map[a.lecture_id] = a.status
        })
        setStatusMap(map)
      })
      .catch(() => {})
  }, [user])

  return statusMap
}
