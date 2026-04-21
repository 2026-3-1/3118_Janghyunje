# GCP P1 — API 엔드포인트 명세서

## 개요

| 항목 | 내용 |
|------|------|
| Base URL | `http://localhost:3000/api` |
| 응답 형식 | JSON |
| 인증 방식 | 없음 (P1) — P2에서 JWT 적용 |
| API 문서 | http://localhost:3000/api-docs (Swagger UI) |

### 공통 응답 형식

```json
// 성공
{ "success": true, "data": { ... } }

// 실패
{ "success": false, "message": "에러 메시지" }
```

---

## 1. 인증 / 유저

### POST /api/signup — 회원가입

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "nickname": "홍길동",
  "role": "student",
  "game": "lol",
  "tier": "gold"
}
```

**응답**

| 상태코드 | 설명 |
|----------|------|
| 201 | 회원가입 성공 → `{ success: true, data: { id: 1 } }` |
| 400 | 필수 항목 누락 |
| 409 | 이메일 중복 → `code: "EMAIL_DUPLICATE"` |
| 409 | 닉네임 중복 → `code: "NICKNAME_DUPLICATE"` |

---

### POST /api/login — 로그인

**Request Body**
```json
{ "email": "user@example.com", "password": "password123" }
```

**응답 (P1)**
```json
{
  "success": true,
  "data": {
    "id": 1, "email": "user@example.com", "nickname": "홍길동",
    "role": "student", "game": "lol", "tier": "gold"
  }
}
```
> ※ P1에서는 토큰 없이 유저 정보만 반환. P2에서 `token` 필드 추가 예정.

| 상태코드 | 설명 |
|----------|------|
| 200 | 로그인 성공 |
| 400 | 필수 항목 누락 |
| 401 | 이메일 또는 비밀번호 불일치 |

---

### GET /api/users/:id — 유저 정보 조회

**Path Parameter**: `id` (유저 ID)

**응답**
```json
{
  "success": true,
  "data": {
    "id": 1, "email": "...", "nickname": "...",
    "role": "student", "game": "lol", "tier": "gold", "created_at": "..."
  }
}
```

| 상태코드 | 설명 |
|----------|------|
| 200 | 조회 성공 |
| 404 | 유저 없음 |

---

### PUT /api/users/:id — 유저 정보 수정

**Request Body**
```json
{
  "nickname": "새닉네임",
  "game": "valorant",
  "tier": "platinum",
  "password": "newpassword"  // 선택
}
```

| 상태코드 | 설명 |
|----------|------|
| 200 | 수정 성공 |

---

## 2. 강의

### GET /api/lectures — 강의 목록 조회

**Query Parameters**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| game | string | 게임 필터 (lol/valorant/overwatch2/battleground/tft/starcraft2/all) |
| tier | string | 티어 필터 |
| maxPrice | number | 최대 가격 |
| keyword | string | 제목 또는 코치명 검색 |
| coachType | string | 코치 유형 필터 |
| position | string | 포지션 필터 |
| sort | string | 정렬 (ranking/rating/price_asc/price_desc/newest) |
| coach_id | number | 특정 코치의 강의만 조회 (코치 대시보드용) |

**응답**
```json
{
  "success": true,
  "data": [
    {
      "id": 1, "title": "강의명", "game": "lol", "price": 30000,
      "original_price": null, "target_tier": "gold", "coach_nickname": "코치명",
      "coach_tier": "challenger", "rating": 4.8, "review_count": 12, "enroll_count": 35
    }
  ]
}
```

---

### POST /api/lectures — 강의 등록

**Request Body**
```json
{
  "coach_id": 2,
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

| 상태코드 | 설명 |
|----------|------|
| 201 | 등록 성공 |
| 400 | 필수 항목 누락 |

---

### GET /api/lectures/:id — 강의 상세 조회

응답: 강의 정보 + 평균 평점 + 리뷰 수 + 수강생 수 (JOIN 집계)

---

### PUT /api/lectures/:id — 강의 수정

**Request Body**: 수정할 필드 (title, description, price, original_price, target_tier, position, status)

---

### DELETE /api/lectures/:id — 강의 삭제

---

## 3. 수강 신청

### POST /api/applications — 수강 신청

**Request Body (P1)**
```json
{ "lecture_id": 1, "student_id": 3 }
```
> ※ P1에서는 student_id를 body로 전달. P2에서 JWT(req.user.id)로 교체 예정.

| 상태코드 | 설명 |
|----------|------|
| 201 | 신청 완료 |
| 403 | 본인 강의 신청 불가 |
| 404 | 강의 없음 |
| 409 | 이미 신청한 강의 |

---

### GET /api/applications/student — 학생 수강 신청 목록

**Query Parameters (P1)**: `student_id=3`
> ※ P1에서는 쿼리 파라미터로 전달. P2에서 JWT로 교체 예정.

**응답**: 수강 신청 목록 + 강의 정보 + 코치 정보 JOIN

---

### GET /api/applications/coach — 코치 신청 목록

**Query Parameters (P1)**: `coach_id=2`

**응답**: 신청 목록 + 강의 제목 + 학생 정보 JOIN

---

### PUT /api/applications/:id/approve — 수강 신청 승인

| 상태코드 | 설명 |
|----------|------|
| 200 | 승인 완료 |

---

### PUT /api/applications/:id/reject — 수강 신청 거절

---

## 4. 리뷰

### GET /api/reviews/:lectureId — 강의 리뷰 조회

**응답**: 리뷰 목록 + 학생 닉네임/티어 JOIN, 최신순 정렬

---

### POST /api/reviews — 리뷰 작성

**Request Body (P1)**
```json
{ "lecture_id": 1, "student_id": 3, "rating": 5, "comment": "좋은 강의!" }
```

| 상태코드 | 설명 |
|----------|------|
| 201 | 작성 완료 |
| 400 | 필수 항목 누락 |
| 409 | 이미 리뷰 작성함 |

---

## 5. 강의 콘텐츠

### GET /api/lectures/:lectureId/contents — 콘텐츠 목록

order_num ASC로 정렬

---

### POST /api/lectures/:lectureId/contents — 콘텐츠 등록

**Request Body**
```json
{
  "title": "1강 - 기초 이론",
  "description": "설명",
  "type": "video",
  "url": "https://www.youtube.com/watch?v=XXXXX",
  "order_num": 1
}
```
> YouTube URL → embed URL 자동 변환 (toEmbedUrl 함수)

---

### GET /api/contents/:id — 콘텐츠 단건 조회

### PUT /api/contents/:id — 콘텐츠 수정

### DELETE /api/contents/:id — 콘텐츠 삭제

---

### GET /api/contents/:id/comments — 콘텐츠 댓글 조회

### POST /api/contents/:id/comments — 댓글 작성

**Request Body (P1)**
```json
{ "user_id": 1, "comment": "좋은 강의입니다!" }
```

### DELETE /api/comments/:id — 댓글 삭제

---

## 6. 커뮤니티

### GET /api/posts — 게시글 목록

**Query Parameters**

| 파라미터 | 설명 |
|----------|------|
| category | 카테고리 필터 |
| keyword | 제목/내용 검색 |
| page | 페이지 번호 (기본 1, 페이지당 15개) |

**응답**: 게시글 목록 + 총 건수 + 페이지 정보 + 댓글 수

---

### GET /api/posts/:id — 게시글 상세 (조회수 +1)

**응답**: 게시글 + 댓글 목록 포함

---

### POST /api/posts — 게시글 작성

**Request Body (P1)**
```json
{ "user_id": 1, "category": "question", "title": "제목", "content": "내용" }
```

### PUT /api/posts/:id — 게시글 수정

### DELETE /api/posts/:id — 게시글 삭제

### POST /api/posts/:id/comments — 댓글 작성

**Request Body (P1)**
```json
{ "user_id": 1, "content": "댓글 내용" }
```

### DELETE /api/post-comments/:id — 댓글 삭제

---

## 7. 전체 엔드포인트 요약

| 메서드 | 경로 | 설명 | 인증(P1) |
|--------|------|------|----------|
| POST | /api/signup | 회원가입 | 없음 |
| POST | /api/login | 로그인 | 없음 |
| GET | /api/users/:id | 유저 조회 | 없음 |
| PUT | /api/users/:id | 유저 수정 | 없음 |
| GET | /api/lectures | 강의 목록 | 없음 |
| POST | /api/lectures | 강의 등록 | 없음 |
| GET | /api/lectures/:id | 강의 상세 | 없음 |
| PUT | /api/lectures/:id | 강의 수정 | 없음 |
| DELETE | /api/lectures/:id | 강의 삭제 | 없음 |
| POST | /api/applications | 수강 신청 | 없음 |
| GET | /api/applications/student | 학생 신청 목록 | 없음 |
| GET | /api/applications/coach | 코치 신청 목록 | 없음 |
| PUT | /api/applications/:id/approve | 승인 | 없음 |
| PUT | /api/applications/:id/reject | 거절 | 없음 |
| GET | /api/reviews/:lectureId | 리뷰 조회 | 없음 |
| POST | /api/reviews | 리뷰 작성 | 없음 |
| GET | /api/lectures/:id/contents | 콘텐츠 목록 | 없음 |
| POST | /api/lectures/:id/contents | 콘텐츠 등록 | 없음 |
| GET | /api/contents/:id | 콘텐츠 단건 | 없음 |
| PUT | /api/contents/:id | 콘텐츠 수정 | 없음 |
| DELETE | /api/contents/:id | 콘텐츠 삭제 | 없음 |
| GET | /api/contents/:id/comments | 댓글 목록 | 없음 |
| POST | /api/contents/:id/comments | 댓글 작성 | 없음 |
| DELETE | /api/comments/:id | 댓글 삭제 | 없음 |
| GET | /api/posts | 게시글 목록 | 없음 |
| POST | /api/posts | 게시글 작성 | 없음 |
| GET | /api/posts/:id | 게시글 상세 | 없음 |
| PUT | /api/posts/:id | 게시글 수정 | 없음 |
| DELETE | /api/posts/:id | 게시글 삭제 | 없음 |
| POST | /api/posts/:id/comments | 커뮤니티 댓글 | 없음 |
| DELETE | /api/post-comments/:id | 커뮤니티 댓글 삭제 | 없음 |
