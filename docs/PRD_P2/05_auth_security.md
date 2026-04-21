# GCP P2 — 인증 및 보안 명세서

## 1. JWT 설계

### 토큰 스펙

| 항목 | 값 |
|------|-----|
| 알고리즘 | HS256 (HMAC SHA-256) |
| 유효기간 | 7일 (`JWT_EXPIRES_IN=7d`) |
| 발급 시점 | 로그인 성공 시 |
| 저장 위치 | 클라이언트 localStorage |
| 전달 방식 | `Authorization: Bearer <token>` |

### Payload 구조

```json
{
  "id": 1,
  "role": "student",
  "iat": 1713300000,
  "exp": 1713904800
}
```

| 필드 | 설명 |
|------|------|
| id | 유저 PK (users.id) |
| role | 역할 (student/coach) |
| iat | 발급 시각 (issued at) |
| exp | 만료 시각 (expiration) |

### 비밀키 관리

```env
# .env
JWT_SECRET=your_production_secret_key_here
JWT_EXPIRES_IN=7d
```

> 운영 환경에서는 충분히 복잡한 랜덤 문자열 사용 권장 (최소 32자)

---

## 2. authenticate 미들웨어

```javascript
// middleware/errorHandler.js
export const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]

  if (!token)
    return res.status(401).json({ success: false, message: '로그인이 필요합니다.' })

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    // req.user = { id, role, iat, exp }
    next()
  } catch {
    res.status(401).json({ success: false, message: '유효하지 않은 토큰입니다.' })
  }
}
```

**처리 흐름**
1. `Authorization` 헤더에서 `Bearer <token>` 추출
2. 토큰 없으면 → 401
3. `jwt.verify()` 실패 (만료/위변조) → 401
4. 성공 → `req.user`에 payload 저장 → `next()`

---

## 3. authorize 미들웨어 (RBAC)

```javascript
export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role))
    return res.status(403).json({ success: false, message: '접근 권한이 없습니다.' })
  next()
}
```

**사용 예시**
```javascript
// 코치만
router.post('/lectures', authenticate, authorize('coach'), createLecture)

// 학생만
router.post('/applications', authenticate, authorize('student'), applyLecture)

// 학생 또는 코치 (로그인만 필요)
router.get('/users/:id', authenticate, getUserById)
```

---

## 4. 라우트별 인증 적용

### 공개 (인증 없음)
```
GET  /lectures, GET /lectures/:id
GET  /reviews/:lectureId
GET  /posts, GET /posts/:id
POST /signup, POST /login
```

### 로그인 필요 (authenticate만)
```
GET/PUT /users/:id
GET     /lectures/:id/contents
GET     /contents/:id
GET/POST/DELETE  /contents/:id/comments
POST/PUT/DELETE  /posts, /posts/:id
POST/DELETE      /posts/:id/comments, /post-comments/:id
```

### 학생 전용 (authenticate + authorize('student'))
```
POST /applications
GET  /applications/student
POST /reviews
```

### 코치 전용 (authenticate + authorize('coach'))
```
POST/PUT/DELETE  /lectures, /lectures/:id
GET              /applications/coach
PUT              /applications/:id/approve
PUT              /applications/:id/reject
POST/PUT/DELETE  /lectures/:id/contents, /contents/:id
```

---

## 5. 소유권 검증

역할(Role) 확인 외에, 리소스가 본인 것인지도 서버에서 검증한다.

### 유저 정보 수정 — 본인만 가능
```javascript
// authController.js
if (req.user.id !== Number(req.params.id))
  return res.status(403).json({ message: '본인 정보만 수정할 수 있습니다.' })
```

### 수강 신청 승인/거절 — 본인 강의의 신청만 처리 가능
```javascript
// applicationController.js
const [apps] = await pool.query(
  'SELECT l.coach_id FROM applications a JOIN lectures l ON a.lecture_id = l.id WHERE a.id = ?',
  [req.params.id]
)
if (apps[0].coach_id !== req.user.id)
  return res.status(403).json({ message: '본인 강의의 신청만 처리할 수 있습니다.' })
```

---

## 6. 프론트엔드 인증 처리

### Axios Interceptor

```javascript
// services/api.js
// 요청 interceptor — 토큰 자동 첨부
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 응답 interceptor — 401 자동 처리
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)
```

### useAuthStore

```javascript
// store/useAuthStore.js
const useAuthStore = create((set) => ({
  user:  JSON.parse(localStorage.getItem('user')  || 'null'),
  token: localStorage.getItem('token') || null,

  setUser: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user))
    if (token) localStorage.setItem('token', token)
    set({ user, token })
  },

  logout: () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    set({ user: null, token: null })
  },
}))
```

### 로그인 후 처리 흐름 (LoginPage.jsx)

```javascript
const res = await login(form)
// res.data = { token: "...", user: { ... } }
setUser(res.data.user, res.data.token)
navigate('/')
```

---

## 7. 보안 고려사항 및 향후 개선

| 항목 | 현재 상태 | 향후 개선 방향 |
|------|----------|---------------|
| 토큰 저장 | localStorage | httpOnly Cookie 방식 고려 |
| Refresh Token | 미구현 | 구현 예정 (만료 시 자동 재발급) |
| 비밀번호 | bcrypt(salt=10) 해시 | 현재 적절한 수준 |
| HTTPS | 미적용 (개발환경) | 운영 시 적용 필요 |
| Rate Limiting | 미적용 | 로그인 시도 횟수 제한 고려 |
