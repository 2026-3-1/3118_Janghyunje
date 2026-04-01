import api from './api'
import { mockLectures, mockReviews } from '../mocks/mockLectures'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'
const delay = (ms = 300) => new Promise(res => setTimeout(res, ms))

// 백엔드 응답 → 프론트 컴포넌트 형식으로 변환
const normalize = (row) => ({
  ...row,
  // 백엔드는 flat 구조 (coach_nickname) → 프론트는 중첩 (coach.nickname)
  coach: {
    nickname: row.coach_nickname,
    tier:     row.coach_tier,
    tierName: row.coach_tier,
  },
  // snake_case → camelCase
  originalPrice: row.original_price,
  targetTier:    row.target_tier,
  targetTierName: row.target_tier,
  reviewCount:   Number(row.review_count  ?? 0),
  enrollCount:   Number(row.enroll_count  ?? 0),
  rating:        Number(row.rating        ?? 0),
  coachType:     row.coach_type,
  // 썸네일은 game 기준으로 매핑
  thumbBg:   THUMB_BG[row.game]   || 'from-[#1a1d2e] to-[#2a2d3e]',
  thumbIcon: THUMB_ICON[row.game] || '🎮',
  // 배지: original_price 있으면 sale 배지 추가
  badges: ['online', ...(row.original_price ? ['sale'] : [])],
})

const THUMB_BG = {
  lol:          'from-[#0a1628] to-[#1a3a6b]',
  valorant:     'from-[#1a0a0a] to-[#3d0f14]',
  overwatch2:   'from-[#0a1a2e] to-[#1a3550]',
  battleground: 'from-[#1a1200] to-[#3d2e00]',
  tft:          'from-[#1a0a2e] to-[#2e1a50]',
  starcraft2:   'from-[#0a0a1a] to-[#1a1a3d]',
}

const THUMB_ICON = {
  lol:          '⚔',
  valorant:     '🎯',
  overwatch2:   '🛡',
  battleground: '🔫',
  tft:          '♟',
  starcraft2:   '🚀',
}

export async function getLectures({ game = 'all', tier = 'all', maxPrice = 100000, keyword = '', coachType = 'all', position = 'all', sort = 'ranking' } = {}) {
  if (USE_MOCK) {
    await delay()
    let result = [...mockLectures]
    if (game !== 'all')       result = result.filter(l => l.game === game)
    if (tier !== 'all')       result = result.filter(l => l.targetTier === tier)
    if (maxPrice < 100000)    result = result.filter(l => l.price <= maxPrice)
    if (keyword)              result = result.filter(l => l.title.includes(keyword) || l.coach.nickname.includes(keyword))
    if (coachType !== 'all')  result = result.filter(l => l.coachType === coachType)
    if (position !== 'all')   result = result.filter(l => l.position === position)
    if (sort === 'rating')    result.sort((a, b) => b.rating - a.rating)
    if (sort === 'price_asc') result.sort((a, b) => a.price - b.price)
    if (sort === 'price_desc')result.sort((a, b) => b.price - a.price)
    if (sort === 'newest')    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    return result
  }
  const { data } = await api.get('/lectures', { params: { game, tier, maxPrice, keyword, coachType, position, sort } })
  return data.data.map(normalize)
}

export async function getLectureById(id) {
  if (USE_MOCK) {
    await delay()
    const lecture = mockLectures.find(l => l.id === Number(id))
    if (!lecture) throw new Error('강의를 찾을 수 없습니다.')
    return lecture
  }
  const { data } = await api.get(`/lectures/${id}`)
  return normalize(data.data)
}

export async function getReviewsByLectureId(lectureId) {
  if (USE_MOCK) {
    await delay()
    return mockReviews.filter(r => r.lectureId === Number(lectureId))
  }
  const { data } = await api.get(`/reviews/${lectureId}`)
  // 리뷰도 컴포넌트 형식에 맞게 변환
  return data.data.map(r => ({
    ...r,
    student: {
      nickname: r.student_nickname,
      tier:     r.student_tier,
      tierName: r.student_tier,
    },
  }))
}

export async function applyLecture(lectureId) {
  if (USE_MOCK) {
    await delay(500)
    return { success: true, message: '수강 신청이 완료되었습니다.' }
  }
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  if (!user) throw new Error('로그인이 필요합니다.')
  const { data } = await api.post('/applications', { lecture_id: Number(lectureId), student_id: user.id })
  return data
}

// 회원가입
export async function signup({ email, password, nickname, role, game, tier }) {
  const { data } = await api.post('/signup', { email, password, nickname, role, game, tier })
  return data
}

// 로그인
export async function login({ email, password }) {
  const { data } = await api.post('/login', { email, password })
  return data
}
