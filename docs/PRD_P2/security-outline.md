# GCP P2 — 인증/인가 설계 개요 (Security Outline)

## 1. 인증 방식

| 항목 | 선택 | 이유 |
|------|------|------|
| 인증 방식 | JWT (JSON Web Token) | Stateless, 서버 세션 불필요, 모바일 친화적 |
| 알고리즘 | HS256 | 단일 서버 환경에서 충분한 보안 수준 |
| 토큰 유효기간 | 7일 | 사용자 편의와 보안의 균형 |
| 저장 위치 | localStorage | 구현 단순성 (운영 환경에서는 httpOnly Cookie 권장) |
| 전달 방식 | Authorization: Bearer 헤더 | REST API 표준 방식 |

---

## 2. 역할(Role) 모델

```
users.role
  ├── student  학생 — 강의 수강, 리뷰 작성
  └── coach    코치 — 강의 등록/운영, 수강자 관리
```

### 역할별 접근 가능 API

| 분류 | 공개 | 로그인 | 학생 전용 | 코치 전용 |
|------|------|--------|-----------|-----------|
| 강의 조회 | ✅ | — | — | — |
| 강의 등록/수정/삭제 | — | — | — | ✅ |
| 수강 신청(결제) | — | — | ✅ | — |
| 수강 목록 조회 | — | — | ✅ | — |
| 수강자 목록 조회 | — | — | — | ✅ |
| 리뷰 작성 | — | — | ✅ | — |
| 장바구니 | — | ✅ | — | — |
| 진도율 | — | ✅ | — | — |
| 성장 분석 작성 | — | — | — | ✅ |
| 성장 분석 열람 | — | — | ✅ | — |
| 커뮤니티 조회 | ✅ | — | — | — |
| 커뮤니티 작성 | — | ✅ | — | — |

---

## 3. 미들웨어 구조

```
Request
  └── authenticate (토큰 검증)
        └── authorize('coach') / authorize('student') (역할 검증)
              └── Controller (비즈니스 로직)
```

### authenticate
```javascript
const token = req.headers.authorization?.split(' ')[1]
req.user = jwt.verify(token, process.env.JWT_SECRET)
// 실패 시 → 401
```

### authorize
```javascript
// 역할 불일치 시 → 403
if (!roles.includes(req.user.role)) return 403
```

---

## 4. 소유권 검증

역할 확인 외에 리소스 소유자인지 서버에서 추가 검증

| 상황 | 검증 내용 |
|------|----------|
| 강의 수정/삭제 | `lectures.coach_id === req.user.id` |
| 유저 정보 수정 | `req.params.id === req.user.id` |
| 게시글 수정/삭제 | `posts.user_id === req.user.id` |
| 댓글 삭제 | `comments.user_id === req.user.id` |
| 성장 분석 작성 | 본인 강의 수강자인지 확인 |

---

## 5. 프론트엔드 보호

```jsx
// 로그인 필요
<PrivateRoute> → 비로그인 시 /login

// 역할 제한
<RoleRoute role="coach"> → 비코치 시 /
```

### 적용 라우트

| 라우트 | 보호 방식 |
|--------|----------|
| /mypage, /profile, /cart, /growth | PrivateRoute |
| /lectures/:id/contents | PrivateRoute |
| /community/write | PrivateRoute |
| /coach/dashboard | RoleRoute(coach) |
| /coach/lecture/new, edit | RoleRoute(coach) |
| /lectures/:id/manage | RoleRoute(coach) |

---

## 6. 토큰 만료 처리

```
서버 401 응답
  → Axios interceptor 감지
  → localStorage 초기화 (token, user 제거)
  → window.location.href = '/login'
  ※ /login, /register 페이지에서는 리다이렉트 안 함 (무한루프 방지)
```
