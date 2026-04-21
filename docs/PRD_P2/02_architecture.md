# GCP P2 — 시스템 아키텍처

## 1. 전체 구조 (P2)

```
┌─────────────────────────────────────────────────────────┐
│                     클라이언트 (Browser)                  │
│  React + Vite  ·  Zustand  ·  Tailwind CSS  ·  Axios   │
│                                                          │
│  ┌─────────────────┐   ┌──────────────────────────┐     │
│  │  Public Routes  │   │  Protected Routes         │     │
│  │  / /lectures    │   │  PrivateRoute (로그인필요) │     │
│  │  /login         │   │  RoleRoute (코치전용)      │     │
│  │  /register      │   └──────────────────────────┘     │
│  └─────────────────┘                                     │
│                                                          │
│  Axios Interceptor:                                      │
│    요청 → Authorization: Bearer <token> 자동 첨부        │
│    응답 → 401 수신 시 localStorage 초기화 + /login       │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTPS REST
                        │ Authorization: Bearer <JWT>
┌───────────────────────▼─────────────────────────────────┐
│                   백엔드 서버 (P2)                         │
│  Node.js + Express                                       │
│                                                          │
│  ┌──────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │  Routes  │→ │   Middleware     │→ │  Controllers  │  │
│  └──────────┘  │  authenticate   │  └───────┬───────┘  │
│                │  authorize()    │          │           │
│                │  errorHandler   │          ▼           │
│                └──────────────────┘   DB Pool (mysql2)  │
│                                            │             │
└───────────────────────┬────────────────────┘             │
                        │                                  │
┌───────────────────────▼─────────────────────────────────┐
│                  MySQL 데이터베이스                        │
│  (P1과 동일 스키마, 테이블 추가 없음)                      │
└─────────────────────────────────────────────────────────┘
```

## 2. JWT 인증 흐름

```
[로그인 요청]
  클라이언트 → POST /api/login { email, password }
        ↓
  서버: bcrypt.compare()로 비밀번호 검증
        ↓
  서버: jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '7d' })
        ↓
  응답: { success: true, data: { token, user } }
        ↓
  클라이언트: localStorage.setItem('token', token)
              localStorage.setItem('user', JSON.stringify(user))
              useAuthStore.setUser(user, token)

[인증 필요 API 호출]
  클라이언트 → Axios interceptor → Authorization: Bearer <token> 자동 첨부
        ↓
  서버 authenticate 미들웨어:
    - token 없음 → 401
    - jwt.verify() 실패 → 401
    - 성공 → req.user = { id, role, iat, exp } → next()
        ↓
  서버 authorize('coach') 미들웨어:
    - req.user.role !== 'coach' → 403
    - 성공 → next()
        ↓
  Controller 실행

[토큰 만료 / 무효]
  서버 → 401 응답
  Axios interceptor → localStorage 초기화 → window.location.href = '/login'
```

## 3. 라우트 보호 구조 (프론트엔드)

```jsx
// PrivateRoute: 로그인 여부만 확인
function PrivateRoute({ children }) {
  const { user } = useAuthStore()
  return user ? children : <Navigate to="/login" replace />
}

// RoleRoute: 특정 역할만 허용
function RoleRoute({ children, role }) {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to="/" replace />
  return children
}
```

| 라우트 | 보호 방식 | 비인가 시 |
|--------|-----------|----------|
| `/mypage` | PrivateRoute | /login 이동 |
| `/profile` | PrivateRoute | /login 이동 |
| `/community/write` | PrivateRoute | /login 이동 |
| `/lectures/:id/contents` | PrivateRoute | /login 이동 |
| `/coach/dashboard` | RoleRoute(coach) | / 이동 |
| `/coach/lecture/new` | RoleRoute(coach) | / 이동 |
| `/coach/lecture/edit/:id` | RoleRoute(coach) | / 이동 |
| `/lectures/:id/manage` | RoleRoute(coach) | / 이동 |

## 4. 미들웨어 체인 (백엔드)

```
Request
  ↓
cors() — Origin 허용
  ↓
express.json() — Body 파싱
  ↓
Router 매칭
  ↓
authenticate (토큰 검증) ← 보호 라우트만
  ↓
authorize('coach') ← 역할 제한 라우트만
  ↓
Controller (비즈니스 로직)
  ↓
errorHandler (에러 처리)
  ↓
Response
```

## 5. P1 vs P2 아키텍처 비교

| 항목 | P1 | P2 |
|------|-----|-----|
| 인증 | 없음 | JWT Bearer |
| 미들웨어 | errorHandler, notFound | + authenticate, authorize |
| 라우트 보호 | 없음 | PrivateRoute, RoleRoute |
| 사용자 식별 | Body/Query 파라미터 | req.user.id (JWT payload) |
| 토큰 저장 | 없음 | localStorage('token') |
