# GCP (Game Coaching Platform) — PRD P1
## Product Requirements Document — Phase 1

| 항목 | 내용 |
|------|------|
| 작성자 | 18 장현제 |
| 버전 | 1.0 |
| 작성일 | 2026년 5월 8일 |
| 단계 | P1 — 기초/개인 서비스 (인증 없음) |

---

## 1. 서비스 개요

### 1.1 한 줄 정의
게임 실력 향상을 원하는 학생과 코치를 연결해주는 게임 강의 매칭 웹 플랫폼

### 1.2 목표
- 학생: 원하는 게임·티어·코치 스타일로 맞춤 강의 탐색 및 수강
- 코치: 본인 실력을 강의로 개설하고 수강자를 관리

### 1.3 벤치마킹
GIGS (https://gigs.op.gg) — 게임 코칭 강의 제공 플랫폼

---

## 2. 기술 스택

| 영역 | 기술 | 비고 |
|------|------|------|
| 프론트엔드 | React 18 | Vite 기반 |
| 상태 관리 | Zustand | useAuthStore, useLectureStore 등 |
| 스타일링 | Tailwind CSS | 다크모드 dark: 유틸리티 |
| 라우팅 | React Router v6 | PrivateRoute, RoleRoute 포함 |
| 백엔드 | Node.js + Express | MVC 패턴 |
| 데이터베이스 | MySQL 8 | 순수 SQL (ORM 없음) |
| API 문서화 | Swagger UI | /api-docs |

---

## 3. 사용자 역할

| 역할 | 설명 | 주요 권한 |
|------|------|----------|
| student | 강의를 탐색·신청·수강하는 학습자 | 강의 조회, 신청, 리뷰 작성 |
| coach | 강의를 개설·운영하는 강사 | 강의 CRUD, 콘텐츠 관리 |

---

## 4. 데이터베이스 스키마

### users
| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | 사용자 ID |
| email | VARCHAR(255) | NOT NULL, UNIQUE | 이메일 (로그인 ID) |
| password | VARCHAR(255) | NOT NULL | bcrypt 해시 저장 (P2) |
| nickname | VARCHAR(100) | NOT NULL | 닉네임 |
| role | ENUM | NOT NULL | student / coach |
| game | VARCHAR(50) | | 주 게임 |
| tier | VARCHAR(50) | | 현재 티어 |
| created_at | TIMESTAMP | DEFAULT NOW | 가입일 |

### lectures
| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INT | PK | 강의 ID |
| coach_id | INT | FK → users.id | 코치 |
| title | VARCHAR(255) | NOT NULL | 강의 제목 |
| description | TEXT | | 강의 설명 |
| game | VARCHAR(50) | NOT NULL | 게임 종류 |
| price | INT | NOT NULL DEFAULT 0 | 수강료 |
| original_price | INT | | 정가 (할인 전) |
| target_tier | VARCHAR(50) | | 대상 티어 |
| position | VARCHAR(50) | | 포지션 |
| coach_type | VARCHAR(50) | | 코치 유형 |
| status | ENUM | DEFAULT 'active' | active / inactive |
| created_at | TIMESTAMP | DEFAULT NOW | 등록일 |

### applications
| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INT | PK | 신청 ID |
| lecture_id | INT | FK → lectures.id | 강의 |
| student_id | INT | FK → users.id | 학생 |
| status | ENUM | DEFAULT 'pending' | pending / approved / rejected |
| created_at | TIMESTAMP | DEFAULT NOW | 신청일 |
| | | UNIQUE(lecture_id, student_id) | 중복 신청 방지 |

### reviews
| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INT | PK | 리뷰 ID |
| lecture_id | INT | FK → lectures.id | 강의 |
| student_id | INT | FK → users.id | 학생 |
| rating | TINYINT | 1~5 CHECK | 별점 |
| comment | TEXT | | 후기 내용 |
| created_at | TIMESTAMP | DEFAULT NOW | 작성일 |
| | | UNIQUE(lecture_id, student_id) | 중복 작성 방지 |

### lecture_contents
| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INT | PK | 콘텐츠 ID |
| lecture_id | INT | FK → lectures.id | 강의 |
| title | VARCHAR(255) | NOT NULL | 콘텐츠 제목 |
| description | TEXT | | 설명 |
| type | ENUM | NOT NULL | video / material |
| url | VARCHAR(500) | NOT NULL | YouTube embed URL 또는 자료 링크 |
| order_num | INT | DEFAULT 0 | 순서 |
| created_at | TIMESTAMP | DEFAULT NOW | 등록일 |

### comments (강의 콘텐츠 댓글)
| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INT | PK | 댓글 ID |
| content_id | INT | FK → lecture_contents.id | 콘텐츠 |
| user_id | INT | FK → users.id | 작성자 |
| comment | TEXT | NOT NULL | 내용 |
| created_at | TIMESTAMP | DEFAULT NOW | 작성일 |

### posts (커뮤니티 게시글)
| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INT | PK | 게시글 ID |
| user_id | INT | FK → users.id | 작성자 |
| category | ENUM | NOT NULL | question / tip |
| title | VARCHAR(255) | NOT NULL | 제목 |
| content | TEXT | NOT NULL | 내용 |
| view_count | INT | DEFAULT 0 | 조회수 |
| created_at | TIMESTAMP | DEFAULT NOW | 작성일 |
| updated_at | TIMESTAMP | ON UPDATE NOW | 수정일 |

### post_comments (커뮤니티 댓글)
| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INT | PK | 댓글 ID |
| post_id | INT | FK → posts.id | 게시글 |
| user_id | INT | FK → users.id | 작성자 |
| content | TEXT | NOT NULL | 내용 |
| created_at | TIMESTAMP | DEFAULT NOW | 작성일 |

---

## 5. API 엔드포인트

> P1은 인증 없이 운영 (P2에서 JWT 추가)

### 인증
| Method | Path | 설명 |
|--------|------|------|
| POST | /api/signup | 회원가입 |
| POST | /api/login | 로그인 |
| GET | /api/users/:id | 사용자 정보 조회 |
| PUT | /api/users/:id | 사용자 정보 수정 |

### 강의
| Method | Path | 설명 |
|--------|------|------|
| GET | /api/lectures | 강의 목록 (필터: game, tier, maxPrice, keyword, coachType, position, sort) |
| GET | /api/lectures/:id | 강의 상세 (평점, 리뷰수, 수강자수 집계 포함) |
| POST | /api/lectures | 강의 등록 (코치) |
| PUT | /api/lectures/:id | 강의 수정 (코치, 본인만) |
| DELETE | /api/lectures/:id | 강의 삭제 (코치, 본인만) |

### 수강 신청
| Method | Path | 설명 |
|--------|------|------|
| POST | /api/applications | 수강 신청 |
| GET | /api/applications/student | 학생 신청 목록 |
| GET | /api/applications/coach | 코치 받은 신청 목록 |

### 리뷰
| Method | Path | 설명 |
|--------|------|------|
| GET | /api/reviews/:lectureId | 리뷰 목록 |
| POST | /api/reviews | 리뷰 작성 |

### 강의 콘텐츠
| Method | Path | 설명 |
|--------|------|------|
| GET | /api/lectures/:lectureId/contents | 콘텐츠 목록 |
| POST | /api/lectures/:lectureId/contents | 콘텐츠 등록 (코치) |
| GET | /api/contents/:id | 콘텐츠 단건 조회 |
| PUT | /api/contents/:id | 콘텐츠 수정 (코치, 본인만) |
| DELETE | /api/contents/:id | 콘텐츠 삭제 (코치, 본인만) |
| GET | /api/contents/:id/comments | 댓글 목록 |
| POST | /api/contents/:id/comments | 댓글 작성 |
| DELETE | /api/comments/:id | 댓글 삭제 (본인만) |

### 커뮤니티
| Method | Path | 설명 |
|--------|------|------|
| GET | /api/posts | 게시글 목록 |
| GET | /api/posts/:id | 게시글 상세 |
| POST | /api/posts | 게시글 작성 |
| PUT | /api/posts/:id | 게시글 수정 (본인만) |
| DELETE | /api/posts/:id | 게시글 삭제 (본인만) |
| POST | /api/posts/:id/comments | 댓글 작성 |
| DELETE | /api/post-comments/:id | 댓글 삭제 (본인만) |

---

## 6. 프론트엔드 라우팅

| 경로 | 컴포넌트 | 접근 |
|------|----------|------|
| / | MainPage | 공개 |
| /lectures | LectureListPage | 공개 |
| /lectures/:id | LectureDetailPage | 공개 |
| /login | LoginPage | 공개 |
| /register | RegisterPage | 공개 |
| /community | CommunityPage | 공개 |
| /community/:id | CommunityDetailPage | 공개 |
| /mypage | MyPage | PrivateRoute |
| /profile | ProfilePage | PrivateRoute |
| /community/write | CommunityWritePage | PrivateRoute |
| /community/edit/:id | CommunityWritePage | PrivateRoute |
| /lectures/:id/contents | LectureContentPage | PrivateRoute |
| /cart | CartPage | PrivateRoute |
| /checkout | CheckoutPage | PrivateRoute |
| /growth | GrowthPage | PrivateRoute |
| /coach/dashboard | CoachDashboard | RoleRoute(coach) |
| /coach/lecture/new | LectureRegisterPage | RoleRoute(coach) |
| /coach/lecture/edit/:id | LectureRegisterPage | RoleRoute(coach) |
| /lectures/:id/manage | LectureContentManagePage | RoleRoute(coach) |

---

## 7. 주요 기능 상세

### 7.1 강의 목록 필터·검색
- 게임 카테고리 탭: 전체 / LOL / 발로란트 / TFT / 배그 / 오버워치 / 스타크래프트
- 조건 필터: 티어 선택, 최대 가격 슬라이더, 코치 유형, 포지션
- 키워드 검색: 강의 제목 + 코치 닉네임 동시 검색
- 정렬: 랭킹순(기본), 평점순, 가격 낮은순, 가격 높은순, 최신순
- 페이지네이션: 10개/페이지

### 7.2 강의 상세
- 강의 정보, 코치 프로필, 별점/리뷰수/수강자수 표시
- 최근 본 강의 localStorage 저장 (최대 5개, 메인 페이지 노출)
- 수강 상태에 따른 버튼 분기: 신청 / 결제하기 / 수강 중

### 7.3 강의 콘텐츠 (인프런 스타일)
- 코치 자료 관리 페이지: YouTube URL 입력 → embed URL 자동 변환
- 학생 시청 페이지: 좌측 사이드바(목록) + YouTube 플레이어 + 댓글

### 7.4 커뮤니티
- 카테고리: question(질문), tip(팁)
- 게시글 목록 페이지네이션 (15개/페이지)
- 조회수 카운트, 본인 게시글만 수정·삭제

### 7.5 다크 모드
- 우측 상단 토글 버튼으로 라이트/다크 전환
- Tailwind CSS dark: 유틸리티 클래스 적용
- localStorage 퍼시스트 (새로고침 후에도 유지)

---

## 8. 마이그레이션 파일

| 파일 | 내용 |
|------|------|
| schema.sql | users, lectures, applications, reviews |
| migration_community.sql | posts, post_comments |
| migration_contents.sql | lecture_contents, comments |
| seed.sql | 더미 데이터 (유저 15명, 강의 10개 등) |
