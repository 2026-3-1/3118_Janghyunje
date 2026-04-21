# GCP P1 — 시스템 아키텍처

## 1. 전체 구조

```
┌─────────────────────────────────────────────────────────┐
│                     클라이언트 (Browser)                  │
│  React + Vite  ·  Zustand  ·  Tailwind CSS  ·  Axios   │
│  http://localhost:5173                                   │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP REST (Axios)
                        │ /api/*
┌───────────────────────▼─────────────────────────────────┐
│                   백엔드 서버                              │
│  Node.js + Express  ·  http://localhost:3000             │
│                                                          │
│  ┌──────────┐  ┌─────────────┐  ┌───────────────────┐   │
│  │  Routes  │→ │ Controllers │→ │   DB Pool (mysql2) │   │
│  └──────────┘  └─────────────┘  └─────────┬─────────┘   │
│                                            │              │
│  ┌──────────────────────────────────────────┐            │
│  │  Middleware: errorHandler · notFound     │            │
│  └──────────────────────────────────────────┘            │
│                                                          │
│  /api-docs  →  Swagger UI                                │
└───────────────────────┬─────────────────────────────────┘
                        │ mysql2 Connection Pool
┌───────────────────────▼─────────────────────────────────┐
│                  MySQL 데이터베이스                        │
│  game_coaching_platform  ·  localhost:3306               │
│  users / lectures / applications / reviews               │
│  lecture_contents / comments / posts / post_comments     │
└─────────────────────────────────────────────────────────┘
```

## 2. 프론트엔드 구조

```
frontend/src/
├── App.jsx              # 라우터 설정 (React Router v6)
├── main.jsx             # 앱 진입점
├── index.css            # 전역 스타일
├── pages/               # 페이지 컴포넌트
│   ├── MainPage.jsx
│   ├── LectureListPage.jsx
│   ├── LectureDetailPage.jsx
│   ├── LectureContentPage.jsx       # 수강생 강의 시청
│   ├── LectureContentManagePage.jsx # 코치 자료 관리
│   ├── LectureRegisterPage.jsx
│   ├── LectureEditPage.jsx
│   ├── MyPage.jsx
│   ├── ProfilePage.jsx
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── CoachDashboard.jsx
│   ├── CommunityPage.jsx
│   ├── CommunityDetailPage.jsx
│   └── CommunityWritePage.jsx
├── components/          # 재사용 컴포넌트
│   ├── layout/          # Navbar, Footer
│   ├── ui/              # GameBadge, TierBadge, LoadingScreen, EmptyState
│   └── GameTabs.jsx
├── store/               # Zustand 전역 상태
│   ├── useAuthStore.js  # 로그인 상태 (user, token)
│   ├── useLectureStore.js
│   └── useThemeStore.js # 다크/라이트 모드
├── services/            # API 통신 레이어
│   ├── api.js           # Axios 인스턴스 (baseURL, interceptor)
│   └── lectureService.js
├── mocks/               # 개발용 Mock 데이터
│   └── mockLectures.js
└── constants/           # 상수 정의
```

### 라우팅 구조 (P1 — 보호 없음)

| 경로 | 페이지 | 접근 |
|------|--------|------|
| `/` | 메인 | 공개 |
| `/lectures` | 강의 목록 | 공개 |
| `/lectures/:id` | 강의 상세 | 공개 |
| `/lectures/:id/contents` | 강의 시청 | 공개 (P1 미보호) |
| `/lectures/:id/manage` | 자료 관리 | 공개 (P1 미보호) |
| `/mypage` | 내 수강 | 공개 (P1 미보호) |
| `/profile` | 프로필 | 공개 (P1 미보호) |
| `/login` | 로그인 | 공개 |
| `/register` | 회원가입 | 공개 |
| `/coach/dashboard` | 코치 대시보드 | 공개 (P1 미보호) |
| `/coach/lecture/new` | 강의 등록 | 공개 (P1 미보호) |
| `/coach/lecture/edit/:id` | 강의 수정 | 공개 (P1 미보호) |
| `/community` | 커뮤니티 | 공개 |
| `/community/:id` | 게시글 상세 | 공개 |
| `/community/write` | 글 작성 | 공개 (P1 미보호) |

## 3. 백엔드 구조

```
backend/src/
├── index.js             # 서버 진입점 (Express, CORS, Swagger, 라우터 연결)
├── swagger.js           # Swagger 설정
├── routes/
│   └── index.js         # 전체 라우트 정의
├── controllers/         # 비즈니스 로직
│   ├── authController.js
│   ├── lectureController.js
│   ├── applicationController.js
│   ├── reviewController.js
│   ├── communityController.js
│   └── contentController.js
├── middleware/
│   └── errorHandler.js  # 에러 핸들러, 404 처리 (P1: JWT 미들웨어 주석 처리)
└── db/
    └── index.js         # mysql2 커넥션 풀
```

### MVC 패턴

```
Request → Routes → Controllers → DB Pool → MySQL
                ↓
           Middleware (errorHandler)
                ↓
           Response (JSON)
```

## 4. 데이터 흐름

### Mock 모드 (VITE_USE_MOCK=true)
```
React 컴포넌트 → lectureService.js → mockLectures.js (정적 데이터)
```

### 실제 API 모드 (VITE_USE_MOCK=false)
```
React 컴포넌트 → lectureService.js → api.js (Axios) → Express → MySQL
```

### Axios Interceptor (P1)
```javascript
// 요청: localStorage에서 token 조회 후 Authorization 헤더 자동 첨부
// 응답: 401 수신 시 localStorage token 제거 + /login 리다이렉트
// (P1에서는 토큰이 없으므로 실질적으로 동작하지 않음)
```

## 5. CORS 설정

```javascript
// 허용 Origin: http://localhost:5173 (Vite 개발 서버)
app.use(cors({ origin: 'http://localhost:5173' }))
```
