# GCP P2 — 데이터베이스 설계

## 1. 개요

P2의 DB 스키마는 P1과 동일하다. JWT 인증 구현은 DB 스키마 변경 없이 애플리케이션 레이어에서 처리된다.

| 항목 | 내용 |
|------|------|
| DBMS | MySQL 8.x |
| DB명 | game_coaching_platform |
| 스키마 변경 | 없음 (P1과 동일) |

## 2. 테이블 구조 (P1과 동일)

P1 ERD 및 테이블 상세 참조 → `PRD_P1/03_database.md`

테이블 목록:
- `users`
- `lectures`
- `applications`
- `reviews`
- `lecture_contents`
- `comments`
- `posts`
- `post_comments`

## 3. P2에서 달라진 데이터 처리

### 사용자 식별 방식 변경

P1에서는 `student_id`, `coach_id`를 HTTP 요청(body/query)으로 전달했다. P2에서는 JWT 토큰의 payload에서 추출한다.

#### applications (수강 신청)

```sql
-- P1: student_id를 body로 받아서 INSERT
INSERT INTO applications (lecture_id, student_id) VALUES (?, ?)
-- lecture_id: req.body.lecture_id
-- student_id: req.body.student_id  ← 클라이언트가 직접 전달

-- P2: JWT payload에서 추출
-- student_id: req.user.id  ← 서버가 토큰에서 직접 추출
```

#### applications 조회 (학생)

```sql
-- P1: WHERE a.student_id = req.query.student_id
-- P2: WHERE a.student_id = req.user.id
```

#### applications 조회 (코치)

```sql
-- P1: WHERE l.coach_id = req.query.coach_id
-- P2: WHERE l.coach_id = req.user.id
```

### 소유권 검증 쿼리 추가

P2에서는 승인/거절 처리 시 해당 신청이 요청자의 강의인지 서버에서 검증한다.

```sql
-- 신청 건의 coach_id 조회 후 req.user.id와 비교
SELECT l.coach_id
FROM applications a
JOIN lectures l ON a.lecture_id = l.id
WHERE a.id = :applicationId
```

### 유저 정보 수정 시 본인 확인

```javascript
// authController.js updateUser
if (req.user.id !== Number(req.params.id))
  return 403  // 본인 외 수정 불가
```

## 4. 향후 P2+ 확장 고려 (현재 미구현)

### Refresh Token (예정)

만약 Refresh Token 구현 시 아래 테이블 추가를 고려한다.

```sql
CREATE TABLE refresh_tokens (
  id         INT PRIMARY KEY AUTO_INCREMENT,
  user_id    INT NOT NULL,
  token      VARCHAR(500) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 학생 성장 분석 (예정)

기존 `applications`, `reviews` 테이블 데이터를 집계하여 제공할 예정이므로 별도 테이블 불필요.
