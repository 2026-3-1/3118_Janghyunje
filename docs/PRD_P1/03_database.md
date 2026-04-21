# GCP P1 — 데이터베이스 설계

## 1. 개요

| 항목 | 내용 |
|------|------|
| DBMS | MySQL 8.x |
| DB명 | game_coaching_platform |
| 접속 | localhost:3306 |
| ORM | 없음 (순수 SQL, mysql2 라이브러리) |

## 2. ERD (Entity Relationship Diagram)

```
users
  ├── 1:N → lectures       (coach_id)
  ├── 1:N → applications   (student_id)
  ├── 1:N → reviews        (student_id)
  ├── 1:N → posts          (user_id)
  ├── 1:N → post_comments  (user_id)
  └── 1:N → comments       (user_id)

lectures
  ├── 1:N → applications   (lecture_id)
  ├── 1:N → reviews        (lecture_id)
  └── 1:N → lecture_contents (lecture_id)

lecture_contents
  └── 1:N → comments       (content_id)

posts
  └── 1:N → post_comments  (post_id)
```

## 3. 테이블 상세

### 3.1 users

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | 사용자 고유 ID |
| email | VARCHAR(100) | UNIQUE, NOT NULL | 이메일 (로그인 ID) |
| password | VARCHAR(255) | NOT NULL | bcrypt 해시 비밀번호 |
| nickname | VARCHAR(50) | UNIQUE, NOT NULL | 닉네임 |
| role | ENUM('student','coach') | DEFAULT 'student' | 사용자 역할 |
| game | VARCHAR(50) | NULL | 주 게임 |
| tier | VARCHAR(50) | NULL | 게임 티어 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 가입일 |

### 3.2 lectures

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | 강의 고유 ID |
| coach_id | INT | FK → users.id | 코치 ID |
| title | VARCHAR(200) | NOT NULL | 강의 제목 |
| description | TEXT | NULL | 강의 설명 |
| game | VARCHAR(50) | NOT NULL | 게임 종류 (lol/valorant/overwatch2/battleground/tft/starcraft2) |
| price | INT | NOT NULL | 강의 가격 (원) |
| original_price | INT | NULL | 원래 가격 (할인 전, NULL이면 할인 없음) |
| target_tier | VARCHAR(50) | NULL | 대상 티어 |
| position | VARCHAR(50) | NULL | 포지션 (lol 전용 등) |
| coach_type | VARCHAR(50) | NULL | 코치 유형 (pro_player/streamer/coach 등) |
| status | ENUM('active','inactive','closed') | DEFAULT 'active' | 강의 상태 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 등록일 |

### 3.3 applications (수강 신청)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | 신청 고유 ID |
| lecture_id | INT | FK → lectures.id | 강의 ID |
| student_id | INT | FK → users.id | 학생 ID |
| status | ENUM('pending','approved','rejected') | DEFAULT 'pending' | 신청 상태 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 신청일 |
| UNIQUE KEY | (lecture_id, student_id) | — | 중복 신청 방지 |

### 3.4 reviews

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | 리뷰 고유 ID |
| lecture_id | INT | FK → lectures.id | 강의 ID |
| student_id | INT | FK → users.id | 학생 ID |
| rating | TINYINT | NOT NULL (1~5) | 별점 |
| comment | TEXT | NULL | 리뷰 내용 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 작성일 |
| UNIQUE KEY | (lecture_id, student_id) | — | 중복 리뷰 방지 |

### 3.5 lecture_contents (강의 자료)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | 콘텐츠 고유 ID |
| lecture_id | INT | FK → lectures.id | 강의 ID |
| title | VARCHAR(200) | NOT NULL | 콘텐츠 제목 |
| description | TEXT | NULL | 콘텐츠 설명 |
| type | ENUM('video','file','link') | DEFAULT 'video' | 콘텐츠 타입 |
| url | TEXT | NOT NULL | YouTube embed URL 또는 링크 |
| order_num | INT | DEFAULT 0 | 정렬 순서 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 등록일 |

### 3.6 comments (강의 콘텐츠 댓글)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | 댓글 고유 ID |
| content_id | INT | FK → lecture_contents.id | 콘텐츠 ID |
| user_id | INT | FK → users.id | 작성자 ID |
| comment | TEXT | NOT NULL | 댓글 내용 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 작성일 |

### 3.7 posts (커뮤니티 게시글)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | 게시글 고유 ID |
| user_id | INT | FK → users.id | 작성자 ID |
| category | VARCHAR(50) | DEFAULT 'question' | 카테고리 (question/tip/free 등) |
| title | VARCHAR(200) | NOT NULL | 제목 |
| content | TEXT | NOT NULL | 내용 |
| view_count | INT | DEFAULT 0 | 조회수 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 작성일 |

### 3.8 post_comments (커뮤니티 댓글)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | 댓글 고유 ID |
| post_id | INT | FK → posts.id | 게시글 ID |
| user_id | INT | FK → users.id | 작성자 ID |
| content | TEXT | NOT NULL | 댓글 내용 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 작성일 |

## 4. 시드 데이터 구성

`seed.sql` 파일로 초기 더미 데이터 삽입

| 테이블 | 건수 | 내용 |
|--------|------|------|
| users | 15명 | 코치 5명 + 학생 10명 |
| lectures | 10개 | 각 게임별 강의 |
| applications | 20개 | 학생별 수강 신청 |
| reviews | 15개 | 별점 및 후기 |

## 5. 커넥션 풀 설정

```javascript
mysql.createPool({
  connectionLimit: 10,
  waitForConnections: true,
})
```

## 6. 주요 쿼리 패턴

### 강의 목록 조회 (JOIN + 집계)
```sql
SELECT l.*, u.nickname AS coach_nickname, u.tier AS coach_tier,
       COALESCE(AVG(r.rating), 0)  AS rating,
       COUNT(DISTINCT r.id)         AS review_count,
       COUNT(DISTINCT a.id)         AS enroll_count
FROM lectures l
JOIN users u ON l.coach_id = u.id
LEFT JOIN reviews r ON r.lecture_id = l.id
LEFT JOIN applications a ON a.lecture_id = l.id AND a.status = 'approved'
WHERE l.status = 'active'
GROUP BY l.id, u.nickname, u.tier
ORDER BY enroll_count DESC
```

### 중복 방지
- applications: `UNIQUE KEY (lecture_id, student_id)` → `ER_DUP_ENTRY` → 409 응답
- reviews: `UNIQUE KEY (lecture_id, student_id)` → `ER_DUP_ENTRY` → 409 응답
