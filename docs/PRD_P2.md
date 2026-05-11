# GCP (Game Coaching Platform) — PRD P2
## Product Requirements Document — Phase 2

| 항목 | 내용 |
|------|------|
| 작성자 | 18 장현제 |
| 버전 | 1.0 |
| 작성일 | 2026년 5월 8일 |
| 단계 | P2 — 실전형 / 인증+권한 |

---

## 1. P2 개요

P1에서 구축한 기본 플랫폼에 **JWT 인증·인가**, **결제**, **영상 이어보기·진도율**, **성장 분석**을 추가한다.

### P1 → P2 변경사항 요약

| 항목 | P1 | P2 |
|------|----|----|
| 인증 | 없음 | JWT Bearer 토큰 (HS256, 7일) |
| student_id 전달 방식 | body에 직접 입력 | JWT에서 서버가 자동 추출 |
| coach_id 전달 방식 | body에 직접 입력 | JWT에서 서버가 자동 추출 |
| 수강 신청 승인 | 코치 수동 승인/거절 | 결제 완료 시 즉시 approved |
| 결제 | 없음 | 결제 페이지 (카드/카카오/네이버/토스) |
| 장바구니 | 없음 | 담기·삭제·일괄 결제 |
| 영상 진도 | 없음 | 실시간 저장 + 이어보기 |
| 성장 분석 | 없음 | 코치 작성 → 학생 열람 |
| 코치 대시보드 | 수강 신청 관리 | 수강자 목록 + 내 강의 목록 |

---

## 2. 인증 / 인가 설계

### 2.1 JWT 토큰 명세

| 항목 | 값 |
|------|-----|
| 알고리즘 | HS256 |
| 유효기간 | 7일 (JWT_EXPIRES_IN=7d) |
| 저장 위치 | localStorage |
| 전달 방식 | Authorization: Bearer {token} |
| Secret | 환경변수 JWT_SECRET |

**Payload 구조**
```json
{
  "id": 1,
  "role": "student",
  "iat": 1713300000,
  "exp": 1713904800
}
```

**로그인 응답 구조**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "nickname": "홍길동",
      "role": "student",
      "game": "lol",
      "tier": "gold"
    }
  }
}
```

### 2.2 미들웨어 구조

```
Request
  └── authenticate          Bearer 토큰 없거나 위변조 → 401
        └── authorize(role) 역할 불일치 → 403
              └── Controller
```

**authenticate 구현**
```js
const token = req.headers.authorization?.split(' ')[1]
req.user = jwt.verify(token, process.env.JWT_SECRET)
// 실패 시 401 반환
```

**authorize 구현**
```js
(roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return res.status(403).json(...)
  next()
}
```

### 2.3 역할별 API 접근 권한

| 분류 | API | 공개 | 로그인 | student | coach |
|------|-----|:----:|:------:|:-------:|:-----:|
| 강의 | 목록/상세 조회 | ✅ | | | |
| 강의 | 등록/수정/삭제 | | | | ✅ |
| 강의 | 내 강의 목록 (my) | | | | ✅ |
| 수강 | 수강 신청 (결제) | | | ✅ | |
| 수강 | 학생 신청 목록 | | | ✅ | |
| 수강 | 수강자 목록 | | | | ✅ |
| 리뷰 | 리뷰 조회 | ✅ | | | |
| 리뷰 | 리뷰 작성 | | | ✅ | |
| 장바구니 | 전체 CRUD | | ✅ | | |
| 진도율 | 저장/조회 | | ✅ | | |
| 성장 분석 | 작성/수정/삭제 | | | | ✅ |
| 성장 분석 | 내 분석 열람 | | | ✅ | |
| 콘텐츠 | 목록/조회 | | ✅ | | |
| 콘텐츠 | 등록/수정/삭제 | | | | ✅ |
| 댓글 | 작성 | | ✅ | | |
| 커뮤니티 | 조회 | ✅ | | | |
| 커뮤니티 | 글쓰기/댓글 | | ✅ | | |

### 2.4 소유권 검증 (서버)

모든 수정·삭제 요청에서 리소스 소유자 여부를 서버에서 추가 검증한다.

| 리소스 | 검증 조건 |
|--------|----------|
| 강의 수정/삭제 | `lectures.coach_id === req.user.id` |
| 유저 정보 수정 | `req.params.id === String(req.user.id)` |
| 게시글 수정/삭제 | `posts.user_id === req.user.id` |
| 콘텐츠 수정/삭제 | 해당 강의 `coach_id === req.user.id` |
| 댓글 삭제 | `comments.user_id === req.user.id` |
| 성장 분석 작성 | 본인 강의의 수강 승인된 학생인지 확인 |
| 성장 분석 수정/삭제 | `growth_reports.coach_id === req.user.id` |

### 2.5 프론트엔드 라우트 보호

```jsx
// 비로그인 → /login 리다이렉트
function PrivateRoute({ children }) {
  const { user } = useAuthStore()
  return user ? children : <Navigate to="/login" replace />
}

// 역할 불일치 → / 리다이렉트
function RoleRoute({ children, role }) {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to="/" replace />
  return children
}
```

**보호 라우트 목록**

| 경로 | 보호 방식 |
|------|----------|
| /mypage, /profile, /cart, /checkout, /growth | PrivateRoute |
| /community/write, /community/edit/:id | PrivateRoute |
| /lectures/:id/contents | PrivateRoute |
| /coach/dashboard | RoleRoute(coach) |
| /coach/lecture/new, /coach/lecture/edit/:id | RoleRoute(coach) |
| /lectures/:id/manage | RoleRoute(coach) |

### 2.6 Axios 인터셉터

**요청 인터셉터** — 모든 요청에 토큰 자동 첨부
```js
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
```

**응답 인터셉터** — 401 수신 시 자동 로그아웃
```js
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const path = window.location.pathname
      // /login, /register에서는 리다이렉트 안 함 (무한루프 방지)
      if (path !== '/login' && path !== '/register') {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)
```

---

## 3. P2 추가 데이터베이스 스키마

### cart_items
| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | |
| user_id | INT | FK → users.id | 장바구니 소유자 |
| lecture_id | INT | FK → lectures.id | 담긴 강의 |
| created_at | TIMESTAMP | DEFAULT NOW | 담은 시각 |
| | | UNIQUE(user_id, lecture_id) | 중복 담기 방지 |

### content_progress
| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | |
| user_id | INT | FK → users.id | 수강자 |
| content_id | INT | FK → lecture_contents.id | 콘텐츠 |
| lecture_id | INT | FK → lectures.id | 강의 |
| watched_sec | INT | DEFAULT 0 | 시청한 초 |
| duration_sec | INT | DEFAULT 0 | 전체 영상 길이(초) |
| completed | TINYINT(1) | DEFAULT 0 | 완료 여부 (98% 이상 시 1) |
| updated_at | TIMESTAMP | ON UPDATE NOW | 마지막 업데이트 |
| | | UNIQUE(user_id, content_id) | 중복 방지 |

### growth_reports
| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | |
| lecture_id | INT | FK → lectures.id | 강의 |
| student_id | INT | FK → users.id | 대상 학생 |
| coach_id | INT | FK → users.id | 작성 코치 |
| title | VARCHAR(200) | NOT NULL | 분석 제목 |
| content | TEXT | NOT NULL | 분석 내용 |
| created_at | TIMESTAMP | DEFAULT NOW | 작성일 |
| updated_at | TIMESTAMP | ON UPDATE NOW | 수정일 |

---

## 4. P2 API 엔드포인트

### 강의 (변경/추가)
| Method | Path | 인증 | 역할 | 설명 |
|--------|------|:----:|:----:|------|
| GET | /api/lectures/my | ✅ | coach | **신규** 본인 강의만 조회 (JWT 추출) |

### 수강 신청 (변경)
| Method | Path | 인증 | 역할 | 설명 |
|--------|------|:----:|:----:|------|
| POST | /api/applications | ✅ | student | 결제 완료 → status=approved 즉시 저장 |
| GET | /api/applications/lecture/:lectureId | ✅ | coach | **신규** 강의별 수강자 목록 (진도율·리뷰·성장분석 포함) |

### 장바구니 (신규)
| Method | Path | 인증 | 설명 |
|--------|------|:----:|------|
| GET | /api/cart | ✅ | 장바구니 목록 조회 |
| POST | /api/cart | ✅ | 강의 담기 |
| DELETE | /api/cart/:lectureId | ✅ | 강의 단건 삭제 |
| DELETE | /api/cart | ✅ | 전체 비우기 |

### 진도율 (신규)
| Method | Path | 인증 | 설명 |
|--------|------|:----:|------|
| POST | /api/progress | ✅ | 진도 저장 (watched_sec, duration_sec) |
| GET | /api/progress/:lectureId | ✅ | 강의 전체 진도율 (시간 기반 계산) |
| GET | /api/progress/:lectureId/content/:contentId | ✅ | 단일 콘텐츠 진도 (이어보기용) |

### 성장 분석 (신규)
| Method | Path | 인증 | 역할 | 설명 |
|--------|------|:----:|:----:|------|
| GET | /api/growth/reports | ✅ | student | 내 성장 분석 목록 |
| GET | /api/growth/coach/reports | ✅ | coach | 내가 작성한 목록 |
| GET | /api/growth/reports/:id | ✅ | - | 단건 조회 (코치·해당 학생만) |
| POST | /api/growth/reports | ✅ | coach | 작성 (기존 있으면 UPDATE) |
| PUT | /api/growth/reports/:id | ✅ | coach | 수정 (본인만) |
| DELETE | /api/growth/reports/:id | ✅ | coach | 삭제 (본인만) |

---

## 5. P2 기능 상세

### 5.1 결제 페이지 (`/checkout`)

**진입 방법**
- 강의 상세 → `💳 바로 결제하기` 버튼
- 장바구니 → `💳 결제하기` 버튼

**navigate 방식**
```js
navigate('/checkout', {
  state: { lecture, queue: [], fromCart: false }
})
```

**결제 플로우**
1. 결제 수단 선택 (신용/체크카드, 카카오페이, 네이버페이, 토스페이)
2. 카드 선택 시: 카드번호(16자리 자동 하이픈), 유효기간, CVC 입력
3. 약관 동의 체크 → 결제 버튼 활성화
4. `POST /api/applications { lecture_id }` → `status = 'approved'` 즉시 저장
5. 결제 완료 화면 → 내 수강 목록 / 강의 둘러보기

**다중 결제 (장바구니)**
- queue로 나머지 강의 전달
- 완료 후 "다음 강의 결제하기 →" 버튼으로 순서대로 처리

### 5.2 장바구니

**서버 방어 로직**
- 본인 강의 담기 시도 → 403
- 이미 수강 중인 강의 담기 시도 → 409
- Navbar: token 있을 때만 `/cart` API 호출 (무한루프 방지)

### 5.3 영상 이어보기 (YouTube IFrame API)

**구현 방식**
```
loadYouTubeAPI() → window.YT.Player 생성
  → onStateChange
      PLAYING: setInterval 5초마다 saveProgress()
      PAUSED/ENDED: clearInterval + 즉시 saveProgress()
```

**이어보기 로직**
```js
const prog = progressMap[selected.id]
const startAt = (prog && prog.duration_sec > 0 && !prog.completed)
  ? Math.max(0, prog.watched_sec - 2)  // 2초 앞에서 시작
  : 0
createPlayer(videoId, startAt)
```

**완료 기준**: `watched_sec / duration_sec >= 0.98`

**다음 강의 모달**: 완료 처리 시 자동 팝업 → 10초 카운트다운 → 자동 이동

### 5.4 진도율 계산 (시청 시간 기반)

```js
// 영상 길이에 따른 가중치 적용
const totalDuration = items.reduce((s, i) => s + Number(i.duration_sec), 0)
const totalWatched  = items.reduce((s, i) =>
  s + Math.min(Number(i.watched_sec), Number(i.duration_sec)), 0)
const percent = Math.round((totalWatched / totalDuration) * 100)
```

- 표시 형태: `20분 15초 / 30분`
- 60% 이상: 리뷰 작성 가능 (`can_review: true`)

### 5.5 성장 분석

**작성 (코치)**: 수강자 목록에서 "📊 분석 작성" 버튼 → 모달 → 제목·내용 입력
- 기존 분석 있으면 INSERT 아닌 UPDATE (중복 생성 방지)
- 본인 강의의 수강 승인된 학생에게만 작성 가능

**열람 (학생)**: `/growth` 페이지에서 본인에게 작성된 분석만 조회

### 5.6 코치 대시보드 개선

| 탭 | 내용 |
|----|------|
| 수강자 목록 | 강의 선택 → 수강자별 진도율·리뷰 여부·성장분석 여부 표시 |
| 내 강의 목록 | `GET /api/lectures/my` (본인 강의만, 전체 목록 X) |

---

## 6. 에러 응답 규격

| 상황 | HTTP | code 필드 | message |
|------|------|-----------|---------|
| 토큰 없음 | 401 | - | 로그인이 필요합니다. |
| 토큰 만료/위변조 | 401 | - | 유효하지 않은 토큰입니다. |
| 역할 불일치 | 403 | - | 접근 권한이 없습니다. |
| 소유권 불일치 | 403 | - | 본인 ...만 가능합니다. |
| 이메일 중복 | 409 | EMAIL_DUPLICATE | 이미 회원가입이 되어있는 이메일입니다. |
| 닉네임 중복 | 409 | NICKNAME_DUPLICATE | 이미 존재하는 아이디입니다. |
| 수강 중복 | 409 | - | 이미 수강 중인 강의입니다. |
| 진도율 부족 (리뷰) | 403 | PROGRESS_REQUIRED | 현재 진도율 N%입니다. (60% 이상 필요) |

---

## 7. 보안 설계 (STRIDE)

| 위협 | 내용 | 대응 | 상태 |
|------|------|------|------|
| Spoofing | 타인 토큰으로 API 호출 | JWT 서명 검증 + authenticate 미들웨어 → 401 | ✅ |
| Tampering | JWT payload 위변조, SQL Injection | HS256 서명 검증, Prepared Statement | ✅ |
| Repudiation | 결제·수강 기록 부인 | 서버에서 소유권 검증 | ✅ |
| Information Disclosure | 비밀번호·토큰 노출 | bcrypt(salt=10), 응답에서 password 제거 | ✅ |
| Denial of Service | 로그인 무한 시도 | Rate Limiting 미구현 → P3 예정 | ⚠️ |
| Elevation of Privilege | 학생이 코치 API 호출 | authorize('coach') 미들웨어 → 403 | ✅ |

---

## 8. 테스트

### Playwright e2e 테스트 — 22개 전부 통과

| 파일 | 테스트 내용 | 수 |
|------|------------|:--:|
| tc01 | 회원가입 → 로그인 → JWT 저장 → 강의 결제 | 4 |
| tc02 | 비로그인 보호 라우트 8개 경로 차단 확인 | 8 |
| tc03 | 학생 계정의 코치 전용 페이지 접근 차단 | 3 |
| tc04 | 장바구니 담기 → 결제 페이지 이동 흐름 | 3 |
| tc05 | 코치 대시보드 기능 (탭, 강의 등록 접근) | 4 |

**실행 방법**
```bash
# 프론트(5173) + 백엔드(3000) 실행 후
cd e2e
npm install
npx playwright install chromium
npx playwright test
```

---

## 9. 주요 버그 수정 이력

| 버그 | 원인 | 수정 |
|------|------|------|
| Navbar 무한 새로고침 | 비로그인 시 /cart API → 401 → window.location 루프 | token 있을 때만 API 호출 + /login 페이지에서 리다이렉트 방지 |
| 카드번호 14자리 제한 | input maxLength + ' - ' 구분자 충돌 | maxLength 제거, formatCardNumber에서 숫자 16자리 직접 제한 |
| 코치 대시보드 타인 강의 노출 | /api/lectures 전체 조회 사용 | /api/lectures/my 신규 API 분리 |
| 수강자 목록 중복 표시 | growth_reports 재작성 시 INSERT 중복 생성 | 기존 행 확인 후 UPSERT |
| 회원가입 후 token 미저장 | setUser(res.data) P1 방식 그대로 사용 | setUser(res.data.user, res.data.token)으로 수정 |
| 강의 카드 수강상태 깜빡임 | useState(initialStatus) — prop 변경 시 state 미반영 | prop 직접 사용으로 변경 |
| 다음 강의 모달 미표시 | 영상 끝 1~2초 전 멈춤으로 100% 미도달 | 완료 기준 100% → 98%로 완화 |

---

## 10. 마이그레이션 파일

| 파일 | 내용 |
|------|------|
| schema.sql | P1 기본 테이블 |
| migration_community.sql | 커뮤니티 테이블 |
| migration_contents.sql | 강의 콘텐츠 테이블 |
| migration_p2.sql | P2 추가 테이블 (cart_items, content_progress, growth_reports) |
