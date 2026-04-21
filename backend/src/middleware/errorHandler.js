import jwt from 'jsonwebtoken'

// 공통 에러 응답 형식
export const errorHandler = (err, req, res, next) => {
  console.error(err)
  const status = err.status || 500
  res.status(status).json({
    success: false,
    message: err.message || '서버 오류가 발생했습니다.',
  })
}

// 404
export const notFound = (req, res) => {
  res.status(404).json({ success: false, message: '존재하지 않는 API입니다.' })
}

// P2: JWT 인증 미들웨어 — Authorization: Bearer <token>
export const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token)
    return res.status(401).json({ success: false, message: '로그인이 필요합니다.' })
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ success: false, message: '유효하지 않은 토큰입니다.' })
  }
}

// P2: RBAC 미들웨어 — 역할 기반 접근 제어
// 사용 예: authorize('coach') / authorize('student', 'coach')
export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role))
    return res.status(403).json({ success: false, message: '접근 권한이 없습니다.' })
  next()
}
