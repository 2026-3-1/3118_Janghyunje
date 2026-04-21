# GCP P2 — API 엔드포인트 명세서

## 개요

| 항목 | 내용 |
|------|------|
| Base URL | `http://localhost:3000/api` |
| 응답 형식 | JSON |
| 인증 방식 | JWT Bearer Token |
| 토큰 전달 | `Authorization: Bearer <token>` 헤더 |
| API 문서 | http://localhost:3000/api-docs (Swagger UI) |

### 인증 레벨 정의

| 레벨 | 설명 | 미충족 시 |
|------|------|----------|
| 공개 | 누구나 접근 가능 | — |
| 로그인 | 유효한 JWT 토큰 필요 | 401 |
| 학생 전용 | 로그인 + role=student | 403 |
| 코치 전용 | 로그인 + role=coach | 403 |

### 공통 에러 응답

| 상태코드 | 상황 |
|----------|------|
| 400 | 필수 항목 누락 또는 잘못된 요청 |
| 401 | 토큰 없음 또는 유효하지 않은 토큰 |
| 403 | 권한 없음 (역할 불일치 또는 본인 아님) |
| 404 | 리소스 없음 |
| 409 | 중복 (이메일/닉네임/신청/리뷰) |
| 500 | 서버 오류 |

---

## 1. 인증 / 유저

### POST /api/signup — 회원가입 `공개`

P1과 동일.

---

### POST /api/login — 로그인 `공개`

**Request Body**
```json
{ "email": "user@example.com", "password": "password123" }
```

**응답 (P2 변경)**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1, "email": "user@example.com", "nickname": "홍길동",
      "role": "student", "game": "lol", "tier": "gold"
    }
  }
}
```

> P1 대비 변경: `data` 구조가 `{ token, user }` 로 변경됨.
> 토큰 유효기간: 7일 (`JWT_EXPIRES_IN=7d`)

**JWT Payload**
```json
{ "id": 1, "role": "student", "iat": 1234567890, "exp": 1235172690 }
```

---

### GET /api/users/:id — 유저 정보 조회 `로그인`

**Headers**: `Authorization: Bearer <token>`

---

### PUT /api/users/:id — 유저 정보 수정 `로그인 + 본인`

**Headers**: `Authorization: Bearer <token>`

> P2 추가 검증: `req.user.id !== Number(req.params.id)` 이면 403

---

## 2. 강의

### GET /api/lectures — 강의 목록 `공개`

P1과 동일한 Query Parameters.

---

### POST /api/lectures — 강의 등록 `코치 전용`

**Headers**: `Authorization: Bearer <token>` (role=coach 필요)

**Request Body (P2 변경)**
```json
{
  "title": "강의 제목",
  "description": "강의 설명",
  "game": "lol",
  "price": 30000,
  "original_price": 40000,
  "target_tier": "gold",
  "position": "mid",
  "coach_type": "pro_player"
}
```

> P1 대비 변경: `coach_id` 필드 제거 → 서버에서 `req.user.id` 사용

---

### GET /api/lectures/:id — 강의 상세 `공개`

---

### PUT /api/lectures/:id — 강의 수정 `코치 전용`

**Headers**: `Authorization: Bearer <token>` (role=coach 필요)

---

### DELETE /api/lectures/:id — 강의 삭제 `코치 전용`

**Headers**: `Authorization: Bearer <token>` (role=coach 필요)

---

## 3. 수강 신청

### POST /api/applications — 수강 신청 `학생 전용`

**Headers**: `Authorization: Bearer <token>` (role=student 필요)

**Request Body (P2 변경)**
```json
{ "lecture_id": 1 }
```

> P1 대비 변경: `student_id` 제거 → 서버에서 `req.user.id` 사용

| 상태코드 | 설명 |
|----------|------|
| 201 | 신청 완료 |
| 401 | 비로그인 |
| 403 | 코치가 신청 시도 / 본인 강의 신청 |
| 404 | 강의 없음 |
| 409 | 이미 신청한 강의 |

---

### GET /api/applications/student — 학생 수강 신청 목록 `학생 전용`

**Headers**: `Authorization: Bearer <token>` (role=student 필요)

> P1 대비 변경: `?student_id=` 쿼리 파라미터 제거 → `req.user.id` 사용

---

### GET /api/applications/coach — 코치 신청 목록 `코치 전용`

**Headers**: `Authorization: Bearer <token>` (role=coach 필요)

> P1 대비 변경: `?coach_id=` 쿼리 파라미터 제거 → `req.user.id` 사용

---

### PUT /api/applications/:id/approve — 수강 신청 승인 `코치 전용`

**Headers**: `Authorization: Bearer <token>` (role=coach 필요)

> P2 추가 검증: 해당 신청이 본인 강의의 것인지 서버에서 확인 후 처리

| 상태코드 | 설명 |
|----------|------|
| 200 | 승인 완료 |
| 403 | 본인 강의가 아닌 신청 처리 시도 |
| 404 | 신청 내역 없음 |

---

### PUT /api/applications/:id/reject — 수강 신청 거절 `코치 전용`

(approve와 동일한 구조)

---

## 4. 리뷰

### GET /api/reviews/:lectureId `공개`

P1과 동일.

---

### POST /api/reviews — 리뷰 작성 `학생 전용`

**Headers**: `Authorization: Bearer <token>` (role=student 필요)

**Request Body (P2 변경 예정)**
```json
{ "lecture_id": 1, "rating": 5, "comment": "좋은 강의!" }
```

> 현재 P2 코드에서 reviewController는 student_id를 아직 body로 받음 → 추후 req.user.id로 교체 예정

---

## 5. 강의 콘텐츠

### GET /api/lectures/:lectureId/contents `로그인`

### POST /api/lectures/:lectureId/contents `코치 전용`

### GET /api/contents/:id `로그인`

### PUT /api/contents/:id `코치 전용`

### DELETE /api/contents/:id `코치 전용`

### GET /api/contents/:id/comments `로그인`

### POST /api/contents/:id/comments `로그인`

### DELETE /api/comments/:id `로그인`

---

## 6. 커뮤니티

### GET /api/posts `공개`

### GET /api/posts/:id `공개`

### POST /api/posts `로그인`

### PUT /api/posts/:id `로그인`

### DELETE /api/posts/:id `로그인`

### POST /api/posts/:id/comments `로그인`

### DELETE /api/post-comments/:id `로그인`

---

## 7. 전체 엔드포인트 요약 (P2)

| 메서드 | 경로 | 설명 | 인증 레벨 |
|--------|------|------|-----------|
| POST | /api/signup | 회원가입 | 공개 |
| POST | /api/login | 로그인 + 토큰 발급 | 공개 |
| GET | /api/users/:id | 유저 조회 | 로그인 |
| PUT | /api/users/:id | 유저 수정 (본인만) | 로그인 |
| GET | /api/lectures | 강의 목록 | 공개 |
| POST | /api/lectures | 강의 등록 | 코치 전용 |
| GET | /api/lectures/:id | 강의 상세 | 공개 |
| PUT | /api/lectures/:id | 강의 수정 | 코치 전용 |
| DELETE | /api/lectures/:id | 강의 삭제 | 코치 전용 |
| POST | /api/applications | 수강 신청 | 학생 전용 |
| GET | /api/applications/student | 학생 신청 목록 | 학생 전용 |
| GET | /api/applications/coach | 코치 신청 목록 | 코치 전용 |
| PUT | /api/applications/:id/approve | 승인 (본인 강의만) | 코치 전용 |
| PUT | /api/applications/:id/reject | 거절 (본인 강의만) | 코치 전용 |
| GET | /api/reviews/:lectureId | 리뷰 조회 | 공개 |
| POST | /api/reviews | 리뷰 작성 | 학생 전용 |
| GET | /api/lectures/:id/contents | 콘텐츠 목록 | 로그인 |
| POST | /api/lectures/:id/contents | 콘텐츠 등록 | 코치 전용 |
| GET | /api/contents/:id | 콘텐츠 단건 | 로그인 |
| PUT | /api/contents/:id | 콘텐츠 수정 | 코치 전용 |
| DELETE | /api/contents/:id | 콘텐츠 삭제 | 코치 전용 |
| GET | /api/contents/:id/comments | 댓글 목록 | 로그인 |
| POST | /api/contents/:id/comments | 댓글 작성 | 로그인 |
| DELETE | /api/comments/:id | 댓글 삭제 | 로그인 |
| GET | /api/posts | 게시글 목록 | 공개 |
| POST | /api/posts | 게시글 작성 | 로그인 |
| GET | /api/posts/:id | 게시글 상세 | 공개 |
| PUT | /api/posts/:id | 게시글 수정 | 로그인 |
| DELETE | /api/posts/:id | 게시글 삭제 | 로그인 |
| POST | /api/posts/:id/comments | 커뮤니티 댓글 | 로그인 |
| DELETE | /api/post-comments/:id | 커뮤니티 댓글 삭제 | 로그인 |
