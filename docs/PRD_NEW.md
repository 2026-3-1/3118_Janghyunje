# GCP (Game Coaching Platform) — 완전 명세 PRD
## 이 문서 하나로 동일한 프로젝트를 재구현할 수 있는 수준의 명세서

| 항목 | 내용 |
|------|------|
| 작성자 | 18 장현제 |
| 작성일 | 2026년 5월 |
| DB | game_coaching_platform (MySQL 8, utf8mb4) |
| 백엔드 | Node.js + Express, PORT 3000 |
| 프론트엔드 | React 18 + Vite, PORT 5173 |

---

## 1. 서비스 개요

게임 실력 향상을 원하는 **학생**과 코칭 강의를 제공하는 **코치**를 연결하는 웹 기반 게임 강의 매칭 플랫폼.

### 핵심 플로우
```
코치: 회원가입(role=coach) → 강의 등록 → 콘텐츠(영상/자료) 등록 → 수강자 관리 → 성장 분석 작성
학생: 회원가입(role=student) → 강의 탐색/검색 → 결제 → 수강(이어보기/진도율) → 리뷰 작성 → 성장 분석 열람
```

---

## 2. 기술 스택 및 환경 설정

### 백엔드
```
Node.js + Express
mysql2 (Prepared Statement, ORM 없음)
bcrypt (salt=10)
jsonwebtoken (HS256)
dotenv
swagger-ui-express

환경변수 (.env):
  PORT=3000
  DB_HOST=localhost
  DB_USER=root
  DB_PASSWORD=...
  DB_NAME=game_coaching_platform
  JWT_SECRET=...
  JWT_EXPIRES_IN=7d

CORS: origin http://localhost:5173
API prefix: /api
Swagger: /api-docs
헬스체크: GET /health → { status: 'ok' }
```

### 프론트엔드
```
React 18 + Vite
Zustand (상태 관리: useAuthStore, useLectureStore 등)
Tailwind CSS (다크모드: dark: 유틸리티)
React Router v6
axios (baseURL: '/api', timeout: 10000)
YouTube IFrame API (동적 로드)
```

### 프론트엔드 디렉토리
```
frontend/src/
├── App.jsx               라우팅 정의
├── pages/                페이지 컴포넌트 (18개)
├── components/
│   ├── layout/           Navbar.jsx, Footer.jsx
│   ├── GameTabs.jsx      게임 카테고리 탭
│   ├── LectureCard.jsx   강의 카드
│   ├── SearchFilter.jsx  검색/필터
│   └── ui.jsx            공통 UI (EmptyState, LoadingScreen, TierBadge, GameBadge, ...)
├── store/
│   ├── useAuthStore.js   JWT + user 상태
│   ├── useLectureStore.js 강의 목록 + 필터
│   └── useMyApplications.js 수강 상태 맵
├── services/
│   ├── api.js            axios 인스턴스 + 인터셉터
│   └── lectureService.js signup, login 함수
└── constants/
    └── games.js          GAME_LIST, TIER_LIST
```

---

## 3. 사용자 역할

| 역할 | DB값 | 설명 |
|------|------|------|
| 학생 | student | 강의 탐색·결제·수강·리뷰 작성 |
| 코치 | coach | 강의 등록·관리·수강자 관리·성장 분석 작성 |

---

## 4. 데이터베이스 전체 스키마

### 마이그레이션 실행 순서
```bash
mysql -u root -p < backend/src/db/schema.sql              # users, lectures, applications, reviews
mysql -u root -p game_coaching_platform < backend/src/db/migration_community.sql  # posts, post_comments
mysql -u root -p game_coaching_platform < backend/src/db/migration_contents.sql   # lecture_contents, comments
mysql -u root -p game_coaching_platform < backend/src/db/migration_p2.sql         # cart_items, content_progress, growth_reports
```

### 4.1 users
```sql
CREATE TABLE users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  email      VARCHAR(255) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,          -- bcrypt(salt=10)
  nickname   VARCHAR(100) NOT NULL,
  role       ENUM('student','coach') NOT NULL DEFAULT 'student',
  game       VARCHAR(50),
  tier       VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4.2 lectures
```sql
CREATE TABLE lectures (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  coach_id       INT NOT NULL,
  title          VARCHAR(255) NOT NULL,
  description    TEXT,
  game           VARCHAR(50) NOT NULL,
  price          INT NOT NULL DEFAULT 0,
  original_price INT,                        -- 정가 (할인 시 사용)
  target_tier    VARCHAR(50),
  position       VARCHAR(50),
  coach_type     VARCHAR(50),
  status         ENUM('active','inactive') DEFAULT 'active',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (coach_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 4.3 applications
```sql
CREATE TABLE applications (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  lecture_id INT NOT NULL,
  student_id INT NOT NULL,
  status     ENUM('pending','approved','rejected') DEFAULT 'pending',
  -- P2: 결제 완료 시 즉시 'approved'로 INSERT
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_application (lecture_id, student_id),
  FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 4.4 reviews
```sql
CREATE TABLE reviews (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  lecture_id INT NOT NULL,
  student_id INT NOT NULL,
  rating     TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_review (lecture_id, student_id),
  FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 4.5 lecture_contents
```sql
CREATE TABLE lecture_contents (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  lecture_id  INT NOT NULL,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  type        ENUM('video','material') NOT NULL DEFAULT 'video',
  url         VARCHAR(500) NOT NULL,         -- YouTube embed URL 또는 자료 링크
  order_num   INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE
);
```

### 4.6 comments (강의 콘텐츠 댓글)
```sql
CREATE TABLE comments (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  content_id INT NOT NULL,
  user_id    INT NOT NULL,
  comment    TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (content_id) REFERENCES lecture_contents(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE
);
```

### 4.7 posts (커뮤니티)
```sql
CREATE TABLE posts (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  category   ENUM('question','tip') NOT NULL DEFAULT 'question',
  title      VARCHAR(255) NOT NULL,
  content    TEXT NOT NULL,
  view_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 4.8 post_comments
```sql
CREATE TABLE post_comments (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  post_id    INT NOT NULL,
  user_id    INT NOT NULL,
  content    TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 4.9 cart_items (P2)
```sql
CREATE TABLE cart_items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  lecture_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cart (user_id, lecture_id),
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE
);
```

### 4.10 content_progress (P2)
```sql
CREATE TABLE content_progress (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  content_id   INT NOT NULL,
  lecture_id   INT NOT NULL,
  watched_sec  INT DEFAULT 0,               -- 현재까지 시청한 초
  duration_sec INT DEFAULT 0,               -- 전체 영상 길이 (초)
  completed    TINYINT(1) DEFAULT 0,        -- 98% 이상 시청 시 1
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_progress (user_id, content_id),
  FOREIGN KEY (user_id)    REFERENCES users(id)            ON DELETE CASCADE,
  FOREIGN KEY (content_id) REFERENCES lecture_contents(id) ON DELETE CASCADE,
  FOREIGN KEY (lecture_id) REFERENCES lectures(id)         ON DELETE CASCADE
);
```
> UPSERT 처리: `ON DUPLICATE KEY UPDATE watched_sec = GREATEST(watched_sec, VALUES(watched_sec)), ...`
> watched_sec는 항상 최댓값 유지 (뒤로 되감아도 감소 안 함)

### 4.11 growth_reports (P2)
```sql
CREATE TABLE growth_reports (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  lecture_id INT NOT NULL,
  student_id INT NOT NULL,
  coach_id   INT NOT NULL,
  title      VARCHAR(200) NOT NULL,
  content    TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (coach_id)   REFERENCES users(id)    ON DELETE CASCADE
);
```
> (lecture_id, student_id) 조합으로 1개만 유지: 재작성 시 INSERT 아닌 UPDATE

---

## 5. 인증 / 인가

### 5.1 JWT 명세
```
알고리즘: HS256
유효기간: 7일 (JWT_EXPIRES_IN=7d)
저장 위치: localStorage (key: 'token')
전달 방식: Authorization: Bearer {token}

Payload:
{
  "id": 1,         // users.id
  "role": "student" // student | coach
}

로그인 응답:
{
  "success": true,
  "data": {
    "token": "eyJ...",
    "user": { id, email, nickname, role, game, tier, created_at }
    // password 필드 제거
  }
}
```

### 5.2 미들웨어 (errorHandler.js)
```js
// authenticate — Bearer 토큰 검증
const token = req.headers.authorization?.split(' ')[1]
req.user = jwt.verify(token, process.env.JWT_SECRET)
// 토큰 없음: 401 "로그인이 필요합니다."
// 위변조/만료: 401 "유효하지 않은 토큰입니다."

// authorize(...roles) — 역할 검증
if (!roles.includes(req.user?.role)) → 403 "접근 권한이 없습니다."
```

### 5.3 소유권 검증 (서버)
| 리소스 | 검증 |
|--------|------|
| 강의 수정/삭제 | `lectures.coach_id === req.user.id` |
| 유저 정보 수정 | `Number(req.params.id) === req.user.id` |
| 콘텐츠 수정/삭제 | 해당 강의 `coach_id === req.user.id` |
| 성장 분석 수정/삭제 | `growth_reports.coach_id === req.user.id` |
| 성장 분석 열람 | `coach_id === user.id OR student_id === user.id` |

### 5.4 Axios 인터셉터 (api.js)
```js
// 요청: token 자동 첨부
config.headers.Authorization = `Bearer ${localStorage.getItem('token')}`

// 응답: 401 수신 시 자동 로그아웃
if (err.response?.status === 401) {
  const path = window.location.pathname
  if (path !== '/login' && path !== '/register') {   // 무한루프 방지
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }
}
```

### 5.5 프론트엔드 라우트 보호
```jsx
function PrivateRoute({ children }) {
  const { user } = useAuthStore()
  return user ? children : <Navigate to="/login" replace />
}

function RoleRoute({ children, role }) {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to="/" replace />
  return children
}
```

---

## 6. 전체 라우팅

### 6.1 프론트엔드 라우팅 (App.jsx)

| 경로 | 페이지 | 보호 |
|------|--------|------|
| / | MainPage | 공개 |
| /lectures | LectureListPage | 공개 |
| /lectures/:id | LectureDetailPage | 공개 |
| /login | LoginPage | 공개 |
| /register | RegisterPage | 공개 |
| /community | CommunityPage | 공개 |
| /community/:id | CommunityDetailPage | 공개 |
| /mypage | MyPage | PrivateRoute |
| /profile | ProfilePage | PrivateRoute |
| /cart | CartPage | PrivateRoute |
| /checkout | CheckoutPage | PrivateRoute |
| /growth | GrowthPage | PrivateRoute |
| /community/write | CommunityWritePage | PrivateRoute |
| /community/edit/:id | CommunityWritePage | PrivateRoute |
| /lectures/:lectureId/contents | LectureContentPage | PrivateRoute |
| /coach/dashboard | CoachDashboard | RoleRoute(coach) |
| /coach/lecture/new | LectureRegisterPage | RoleRoute(coach) |
| /coach/lecture/edit/:id | LectureRegisterPage | RoleRoute(coach) |
| /lectures/:lectureId/manage | LectureContentManagePage | RoleRoute(coach) |

### 6.2 백엔드 API 라우팅 (routes/index.js)

#### 인증
| Method | Path | Middleware | Controller |
|--------|------|------------|------------|
| POST | /api/signup | - | signup |
| POST | /api/login | - | login |
| GET | /api/users/:id | authenticate | getUserById |
| PUT | /api/users/:id | authenticate | updateUser |

#### 강의
| Method | Path | Middleware | Controller |
|--------|------|------------|------------|
| GET | /api/lectures | - | getLectures |
| GET | /api/lectures/my | authenticate, authorize('coach') | getMyLectures |
| GET | /api/lectures/:id | - | getLectureById |
| POST | /api/lectures | authenticate, authorize('coach') | createLecture |
| PUT | /api/lectures/:id | authenticate, authorize('coach') | updateLecture |
| DELETE | /api/lectures/:id | authenticate, authorize('coach') | deleteLecture |

> ⚠️ `/api/lectures/my`는 `/api/lectures/:id` 보다 먼저 등록되어야 함

#### 수강 신청
| Method | Path | Middleware | Controller |
|--------|------|------------|------------|
| POST | /api/applications | authenticate, authorize('student') | applyLecture |
| GET | /api/applications/student | authenticate, authorize('student') | getStudentApplications |
| GET | /api/applications/coach | authenticate, authorize('coach') | getCoachApplications |
| GET | /api/applications/lecture/:lectureId | authenticate, authorize('coach') | getLectureStudents |

#### 리뷰
| Method | Path | Middleware | Controller |
|--------|------|------------|------------|
| GET | /api/reviews/:lectureId | - | getReviews |
| POST | /api/reviews | authenticate, authorize('student') | createReview |

#### 장바구니
| Method | Path | Middleware | Controller |
|--------|------|------------|------------|
| GET | /api/cart | authenticate | getCart |
| POST | /api/cart | authenticate | addToCart |
| DELETE | /api/cart/:lectureId | authenticate | removeFromCart |
| DELETE | /api/cart | authenticate | clearCart |

#### 진도율
| Method | Path | Middleware | Controller |
|--------|------|------------|------------|
| POST | /api/progress | authenticate | saveProgress |
| GET | /api/progress/:lectureId | authenticate | getLectureProgress |
| GET | /api/progress/:lectureId/content/:contentId | authenticate | getContentProgress |

#### 성장 분석
| Method | Path | Middleware | Controller |
|--------|------|------------|------------|
| GET | /api/growth/reports | authenticate, authorize('student') | getMyReports |
| GET | /api/growth/coach/reports | authenticate, authorize('coach') | getCoachReports |
| GET | /api/growth/reports/:id | authenticate | getReportById |
| POST | /api/growth/reports | authenticate, authorize('coach') | createReport |
| PUT | /api/growth/reports/:id | authenticate, authorize('coach') | updateReport |
| DELETE | /api/growth/reports/:id | authenticate, authorize('coach') | deleteReport |

#### 강의 콘텐츠 / 댓글
| Method | Path | Middleware | Controller |
|--------|------|------------|------------|
| GET | /api/lectures/:lectureId/contents | authenticate | getContents |
| POST | /api/lectures/:lectureId/contents | authenticate, authorize('coach') | createContent |
| GET | /api/contents/:id | authenticate | getContentById |
| PUT | /api/contents/:id | authenticate, authorize('coach') | updateContent |
| DELETE | /api/contents/:id | authenticate, authorize('coach') | deleteContent |
| GET | /api/contents/:id/comments | authenticate | getComments |
| POST | /api/contents/:id/comments | authenticate | createComment |
| DELETE | /api/comments/:id | authenticate | deleteComment |

#### 커뮤니티
| Method | Path | Middleware | Controller |
|--------|------|------------|------------|
| GET | /api/posts | - | getPosts |
| GET | /api/posts/:id | - | getPostById |
| POST | /api/posts | authenticate | createPost |
| PUT | /api/posts/:id | authenticate | updatePost |
| DELETE | /api/posts/:id | authenticate | deletePost |
| POST | /api/posts/:id/comments | authenticate | createPostComment |
| DELETE | /api/post-comments/:id | authenticate | deletePostComment |

---

## 7. 기능별 상세 명세

### 7.1 회원가입 (POST /api/signup)

**Request body**
```json
{ "email": "user@example.com", "password": "1234", "nickname": "홍길동",
  "role": "student", "game": "lol", "tier": "gold" }
```

**로직**
1. email UNIQUE 중복 체크 → 409 `{ code: "EMAIL_DUPLICATE" }`
2. nickname UNIQUE 중복 체크 → 409 `{ code: "NICKNAME_DUPLICATE" }`
3. `bcrypt.hash(password, 10)` 후 INSERT
4. 회원가입 성공 → 201 `{ id: insertId }`
5. **프론트에서 회원가입 후 바로 login API 호출 → 자동 로그인**
   - `setUser(res.data.user, res.data.token)` 으로 localStorage 저장

**RegisterPage 폼 구조**
```
역할 선택 버튼: 🎮 학생 | 🏆 코치
email input: placeholder="email@example.com"
nickname input: placeholder="게임 닉네임"
password input: placeholder="4자 이상"
passwordConfirm input: placeholder="비밀번호 재입력"
게임 select (GAME_LIST에서 'all' 제외)
티어 select (TIER_LIST[game])
회원가입 버튼
```

---

### 7.2 로그인 (POST /api/login)

**Request body**
```json
{ "email": "user@example.com", "password": "1234" }
```

**Response**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": { "id": 1, "email": "...", "nickname": "...", "role": "student", "game": "lol", "tier": "gold" }
  }
}
```

**프론트 처리**
```js
localStorage.setItem('token', data.token)
localStorage.setItem('user', JSON.stringify(data.user))
```

**아이디 저장**: 로그인 폼에 체크박스 → localStorage에 email 저장, 다음 방문 시 자동 입력

---

### 7.3 강의 목록 (GET /api/lectures)

**Query params**
```
game      : lol | valorant | tft | battleground | overwatch2 | starcraft2 (없으면 전체)
tier      : 티어값 (없으면 전체)
maxPrice  : 숫자 (없으면 전체)
coachType : 코치 유형 (없으면 전체)
position  : 포지션 (없으면 전체)
keyword   : 강의제목 OR 코치닉네임 LIKE 검색
sort      : ranking(기본) | rating | price_asc | price_desc | newest
```

**SQL 로직**
```sql
SELECT l.*, u.nickname AS coach_nickname, u.tier AS coach_tier,
       COALESCE(AVG(r.rating), 0) AS rating,
       COUNT(DISTINCT r.id) AS review_count,
       COUNT(DISTINCT a.id) AS enroll_count
FROM lectures l
JOIN users u ON l.coach_id = u.id
LEFT JOIN reviews r ON r.lecture_id = l.id
LEFT JOIN applications a ON a.lecture_id = l.id AND a.status = 'approved'
WHERE l.status = 'active'
-- + 조건 필터 동적 추가
GROUP BY l.id, u.nickname, u.tier
ORDER BY [sort]
```

**정렬 매핑**
```js
{
  ranking:    'ORDER BY enroll_count DESC',
  rating:     'ORDER BY rating DESC',
  price_asc:  'ORDER BY l.price ASC',
  price_desc: 'ORDER BY l.price DESC',
  newest:     'ORDER BY l.created_at DESC',
}
```

---

### 7.4 수강 신청/결제 (POST /api/applications)

**Request body**: `{ "lecture_id": 1 }`
**student_id**: JWT에서 자동 추출 (`req.user.id`)

**서버 검증**
1. 강의 존재 확인
2. `lectures.coach_id === student_id` → 403 (본인 강의 신청 방지)
3. INSERT `status = 'approved'` (결제 완료 = 즉시 수강 승인)
4. `ER_DUP_ENTRY` → 409 "이미 수강 중인 강의입니다."

**CheckoutPage 흐름**
```
navigate('/checkout', { state: { lecture, queue: [], fromCart: false } })

결제 수단: 신용/체크카드(💳) | 카카오페이(💛) | 네이버페이(💚) | 토스페이(💙)

카드 선택 시 입력 필드:
  카드번호: formatCardNumber() — 숫자만 추출 후 16자리 제한, 4자리마다 ' - ' 삽입
  유효기간: formatExpiry() — MM / YY 형식 자동 포맷
  CVC: 숫자 3자리

약관 동의 체크박스 → 결제 버튼 활성화
결제 버튼 클릭 → POST /api/applications
완료 → done=true 상태로 완료 화면 표시

장바구니 다중 결제:
  queue 배열로 나머지 강의 전달
  완료 후 "다음 강의 결제하기 →" 버튼 → navigate('/checkout', state: { lecture: queue[0], queue: rest })
```

---

### 7.5 장바구니

**addToCart 서버 검증**
1. `lectures.coach_id === user_id` → 403 (본인 강의 담기 방지)
2. `applications.status != 'rejected'` 이미 신청한 강의 → 409
3. `ER_DUP_ENTRY` → 409 "이미 장바구니에 담긴 강의입니다."

**getCart SQL**
```sql
SELECT ci.id AS cart_item_id, l.id, l.title, l.game, l.price, l.original_price,
       u.nickname AS coach_nickname, COALESCE(AVG(r.rating), 0) AS rating,
       COUNT(DISTINCT r.id) AS review_count, ci.created_at AS added_at
FROM cart_items ci
JOIN lectures l ON ci.lecture_id = l.id
JOIN users u ON l.coach_id = u.id
LEFT JOIN reviews r ON r.lecture_id = l.id
WHERE ci.user_id = ?
GROUP BY ci.id, l.id, u.nickname, u.tier
ORDER BY ci.created_at DESC
```

**CartPage UI**
- 전체 선택/개별 선택 체크박스
- 선택 합계 금액 실시간 계산
- ✕ 버튼으로 단건 삭제
- 결제 버튼 → 첫 번째 강의 결제 페이지로, 나머지는 queue

**Navbar 뱃지**: 로그인 상태이고 token이 있을 때만 `/cart` API 호출 (무한루프 방지)

---

### 7.6 영상 이어보기 (YouTube IFrame API)

**플레이어 생성**
```js
loadYouTubeAPI()  // window.YT.Player 동적 로드
new window.YT.Player(div, {
  videoId,
  playerVars: { autoplay: 0, start: Math.floor(startSeconds), rel: 0, modestbranding: 1 },
  events: { onStateChange }
})
```

**진도 저장 타이밍**
```
PLAYING 상태: setInterval 5초마다 saveProgress(contentId, currentTime, duration)
PAUSED/ENDED/기타: clearInterval + 즉시 saveProgress
```

**이어보기 위치 결정**
```js
// 영상 전환 시 API 직접 호출로 최신값 가져옴
const res = await api.get(`/progress/${lectureId}/content/${selected.id}`)
const startAt = (prog && prog.duration_sec > 0 && !prog.completed)
  ? Math.max(0, prog.watched_sec - 2)  // 2초 앞에서 시작
  : 0
```

**완료 처리**: `watched_sec / duration_sec >= 0.98` → `completed = 1`
**다음 강의 모달**: completed=1 처음 감지 시 → NextContentModal 표시 (10초 카운트다운 자동 이동)

---

### 7.7 진도율 계산

**saveProgress (POST /api/progress)**
```sql
INSERT INTO content_progress (user_id, content_id, lecture_id, watched_sec, duration_sec, completed)
VALUES (?, ?, ?, ?, ?, ?)
ON DUPLICATE KEY UPDATE
  watched_sec  = GREATEST(watched_sec, VALUES(watched_sec)),  -- 최댓값 유지
  duration_sec = VALUES(duration_sec),
  completed    = GREATEST(completed, VALUES(completed)),
  updated_at   = CURRENT_TIMESTAMP
```

**getLectureProgress (GET /api/progress/:lectureId) 응답**
```json
{
  "total": 2,              // 전체 콘텐츠 수
  "done": 1,               // completed=1 수
  "percent": 72,           // 시청 시간 기반 퍼센트
  "can_review": true,      // 60% 이상이면 true
  "total_duration": 2940,  // 전체 영상 길이 (초)
  "total_watched": 2117,   // 시청한 초
  "total_duration_fmt": "49분 9초",
  "total_watched_fmt": "35분 17초",
  "items": [
    { "content_id": 1, "title": "...", "watched_sec": 1800, "duration_sec": 1800, "completed": 1 },
    { "content_id": 2, "title": "...", "watched_sec": 317,  "duration_sec": 1140, "completed": 0 }
  ]
}
```

**진도율 계산 공식 (시청 시간 기반)**
```js
const totalDuration = items.reduce((s, i) => s + Number(i.duration_sec), 0)
const totalWatched  = items.reduce((s, i) =>
  s + Math.min(Number(i.watched_sec), Number(i.duration_sec) || Number(i.watched_sec)), 0)

const percent = totalDuration > 0
  ? Math.min(Math.round((totalWatched / totalDuration) * 100), 100)
  : total > 0 ? Math.round((done / total) * 100) : 0  // fallback: 완료 개수 기준
```

**사이드바 진도율 표시**
- 상단: "전체 진도 72%" + 진도 바 (80% 이상 시 green, 미만 시 brand)
- 하단: "35분 17초 / 49분 9초"
- 60% 이상: "✓ 리뷰 작성 가능"
- 개별 영상: 시청 중이면 개별 진도 바 + "▶ 3:24 이어보기"

**영상 전환 시**: `selected?.id` useEffect에서 `loadProgress()` 즉시 호출하여 합산 진도 갱신

---

### 7.8 리뷰 작성 (POST /api/reviews)

**서버 검증**
1. 수강 승인 확인: `applications.status = 'approved'`
2. 진도율 60% 이상 확인 (시청 시간 기반, getLectureProgress와 동일 계산)
   - 미달 시 403 `{ code: "PROGRESS_REQUIRED", percent: N, message: "60% 이상 수강 필요" }`
3. `ER_DUP_ENTRY` → 409 "이미 리뷰를 작성했습니다."

---

### 7.9 성장 분석

**createReport 서버 로직**
```
1. 본인 강의인지 확인 (lectures.coach_id === req.user.id)
2. 수강 승인된 학생인지 확인 (applications.status = 'approved')
3. 기존 분석 존재 확인:
   - 없으면: INSERT
   - 있으면: UPDATE title, content, updated_at
   → (lecture_id, student_id) 조합으로 항상 1개만 유지
```

**CoachDashboard 성장 분석 작성 모달**
```
팝업 form:
  제목 input (placeholder: "예: 2주차 피드백 — 포지셔닝 개선 중점")
  내용 textarea (rows=6, placeholder: "수강자의 강점, 개선점, 다음 목표 등...")
  취소 / 작성 완료 버튼
```

**GrowthPage (학생)**
- 좌측 사이드바: 분석 목록 (제목, 게임, 코치명, 날짜)
- 우측 본문: 선택된 분석의 전체 내용 (whitespace-pre-line)
- 첫 항목 자동 선택

---

### 7.10 수강자 목록 진도율 (getLectureStudents)

**SQL 진도율 계산 (코치 대시보드)**
```sql
CASE
  WHEN SUM(duration_sec) > 0
  THEN LEAST(ROUND(SUM(LEAST(watched_sec, duration_sec)) / SUM(duration_sec) * 100), 100)
  ELSE ROUND(SUM(completed) / NULLIF(COUNT(*), 0) * 100)
END AS progress_percent
```
→ 학생 페이지의 getLectureProgress와 동일한 방식 (시청 시간 기반)

**응답 필드**
```
student_id, student_nickname, student_email, student_tier, student_game
completed_count, total_count, progress_percent
has_review (0|1), review_rating
has_growth_report (0|1), growth_report_id
```

**진도율 바 색상**
```
>= 80%: bg-green-500
>= 60%: bg-brand-500
< 60%: bg-amber-400
```

---

### 7.11 CoachDashboard 탭 구조

```
탭 1. 수강자 목록:
  강의 선택 → 수강자 카드 목록
  수강자 카드: 닉네임, 이메일, 티어뱃지, 진도율 바, 리뷰 여부, 성장 분석 여부
  📊 분석 작성 / 분석 재작성 버튼

탭 2. 내 강의 목록:
  GET /api/lectures/my (JWT에서 coach_id 추출, 본인 강의만)
  강의 카드: 제목, 상태 뱃지, 게임, 가격, 수강생수, 평점
  수강자 보기 / 상세 보기 / 수정 버튼
```

---

### 7.12 MyPage

- `GET /api/applications/student` 호출
- `status === 'approved'` 인 항목만 필터링하여 표시
- 탭 없음 (수강 중인 강의만 노출)
- 카드 클릭 → `/lectures/:lecture_id` 이동

---

## 8. 에러 응답 규격

모든 에러는 `{ success: false, message: "..." }` 형태

| 상황 | HTTP | 추가 필드 |
|------|------|----------|
| 이메일 중복 | 409 | `code: "EMAIL_DUPLICATE"` |
| 닉네임 중복 | 409 | `code: "NICKNAME_DUPLICATE"` |
| 토큰 없음 | 401 | - |
| 토큰 만료/위변조 | 401 | - |
| 역할 불일치 | 403 | - |
| 소유권 불일치 | 403 | - |
| 이미 수강 중 | 409 | - |
| 이미 장바구니에 담김 | 409 | - |
| 진도율 부족 (리뷰) | 403 | `code: "PROGRESS_REQUIRED", percent: N` |
| 이미 리뷰 작성 | 409 | - |
| 존재하지 않는 리소스 | 404 | - |
| 서버 내부 오류 | 500 | - |
| 존재하지 않는 API | 404 | `message: "존재하지 않는 API입니다."` |

---

## 9. useAuthStore (Zustand)

```js
{
  user: null,           // localStorage 'user' JSON
  setUser: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('token', token)
  },
  logout: () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }
}
```
> 회원가입 후 자동 로그인: `setUser(res.data.user, res.data.token)` 반드시 user와 token 분리 전달

---

## 10. 수강 신청 카드 상태 (useMyApplications)

```js
// 학생 로그인 시 /api/applications/student 1회 호출
// { [lecture_id]: status } 맵 반환
// LectureCard, LectureListPage, MainPage에서 initialStatus prop으로 전달
// LectureCard: initialStatus prop 직접 사용 (useState 금지 — 변경 시 미반영 버그)
```

---

## 11. 주요 게임 / 티어 상수 (constants/games.js)

```js
GAME_LIST = [
  { value: 'all',          label: '전체' },
  { value: 'lol',          label: '리그오브레전드' },
  { value: 'valorant',     label: '발로란트' },
  { value: 'tft',          label: '전략적팀전투' },
  { value: 'battleground', label: '배틀그라운드' },
  { value: 'overwatch2',   label: '오버워치' },
  { value: 'starcraft2',   label: '스타크래프트' },
]
// TIER_LIST: 게임별 다른 티어 목록 (lol: iron~challenger, valorant: iron~radiant 등)
```

---

## 12. 공통 UI 컴포넌트

```jsx
<EmptyState title="..." description="..." action={{ label: "...", onClick: () => {} }} />
<LoadingScreen />
<TierBadge tier="gold" tierName="골드" />
<GameBadge gameName="lol" />
<CardBadge type="할인" />       // 강의 카드 썸네일 뱃지
<StarRating rating={4.5} />
<Pagination currentPage={1} totalPages={5} onPageChange={fn} />
```

---

## 13. e2e 테스트 (Playwright)

위치: `e2e/tests/`

| 파일 | 테스트 | 수 |
|------|--------|:--:|
| tc01-signup-login-checkout.spec.js | 회원가입 → 자동로그인 → JWT 저장 → 결제 | 4 |
| tc02-protected-routes.spec.js | 비로그인 보호 라우트 8개 경로 차단 | 8 |
| tc03-student-role-guard.spec.js | 학생의 코치 전용 페이지 접근 차단 | 3 |
| tc04-cart-checkout.spec.js | 장바구니 담기 → 결제 흐름 | 3 |
| tc05-coach-dashboard.spec.js | 코치 대시보드 기능 | 4 |

**실행 방법**
```bash
# 프론트(5173) + 백엔드(3000) 서버 실행 후
cd e2e
npm install
npx playwright install chromium
npx playwright test
# 결과: 22 passed
```

---

## 14. 알려진 설계 결정 및 주의사항

| 항목 | 내용 |
|------|------|
| `/api/lectures/my` 라우트 순서 | `/:id` 보다 먼저 등록 필수 |
| `useAuthStore.setUser` | 반드시 `(user, token)` 두 인자 분리 전달 (`res.data`만 넘기면 token 미저장) |
| `LectureCard.initialStatus` | prop 직접 참조 (useState 사용 금지 — 비동기 statusMap 반영 안 되는 버그) |
| Navbar 장바구니 API 호출 | token 있을 때만 호출 (`/login`, `/register` 제외) — 401 무한루프 방지 |
| 진도율 계산 통일 | 학생 사이드바 / 코치 대시보드 / 리뷰 조건 모두 시청 시간 기반 동일 방식 적용 |
| 성장 분석 UPSERT | `(lecture_id, student_id)` 기준 기존 존재 확인 후 UPDATE or INSERT |
| 카드번호 포맷 | `input.maxLength` 제거 후 `formatCardNumber()` 함수에서 16자리 제한 |
| 이어보기 위치 | `selected?.id` useEffect에서 직접 API 호출 (`progressMap` 비동기 지연 우회) |
| 완료 기준 | 98% 이상 시청 (100% 아님 — YouTube 끝 직전 멈춤 현상 대응) |
