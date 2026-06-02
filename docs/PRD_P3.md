# GCP (Game Coaching Platform) — P3 기획서
## Phase 3: 운영형 / 외부연동 / 관측성 / 관리자

| 항목 | 내용 |
|------|------|
| 작성자 | 18 장현제 |
| 작성일 | 2026년 6월 |
| 단계 | P3 — 운영형 서비스 |

---

## 1. P3 개요

P1(기초), P2(인증/권한)에서 구축한 플랫폼에 **운영·관리 기능**과 **외부 연동**, **보안 강화**, **성능 최적화**를 추가한다.

### P3에서 구현할 항목 전체

| 분류 | 항목 | 우선순위 |
|------|------|--------|
| P2 미구현 보완 | 관리자(admin) 기능 | ⭐ 필수 |
| P2 미구현 보완 | 강의별 질의응답 게시판 | ⭐ 필수 |
| 운영 | 구조화 로그 + 헬스체크 | ⭐ 필수 |
| 운영 | Docker + 배포 자동화(CI/CD) | ⭐ 필수 |
| 외부 연동 | 이메일 알림 (nodemailer) | ⭐ 필수 |
| 보안 | SQL Injection / XSS 방어 | ⭐ 필수 |
| 성능 | DB 인덱스 + 슬로우 쿼리 개선 | ⭐ 필수 |
| 성능 | 프론트 렌더링 최적화 | 권장 |
| 외부 연동 | 디스코드 Webhook 알림 | 권장 |
| 외부 연동 | 스케줄러 (배치 작업) | 권장 |
| 운영 | 모니터링 (Sentry 또는 로그 기반) | 권장 |
| 결제 | 실제 결제 모듈 연동 (포트원 등) | 선택 |

---

## 2. P2 미구현 보완

### 2.1 관리자(admin) 기능

#### 2.1.1 역할 추가
```sql
-- users.role에 admin 추가
ALTER TABLE users MODIFY COLUMN role ENUM('student', 'coach', 'admin') NOT NULL DEFAULT 'student';
```

#### 2.1.2 관리자 전용 라우트
```
/admin                → AdminDashboard     RoleRoute(admin)
/admin/users          → AdminUsersPage     RoleRoute(admin)
/admin/lectures       → AdminLecturesPage  RoleRoute(admin)
/admin/reviews        → AdminReviewsPage   RoleRoute(admin)
/admin/reports        → AdminReportsPage   RoleRoute(admin)
```

#### 2.1.3 관리자 기능 목록

**회원 관리**
- 전체 회원 목록 조회 (검색: 닉네임/이메일/역할)
- 회원 상세 정보 조회
- 회원 강제 탈퇴 (소프트 삭제: is_active = 0)
- 코치 인증 승인/거절 (향후 코치 인증 시스템 추가 시)

**강의 관리**
- 전체 강의 목록 조회 (게임/상태/코치 필터)
- 강의 숨김 처리 (status = 'inactive')
- 강의 강제 삭제
- 신고된 강의 처리

**리뷰 관리**
- 전체 리뷰 조회
- 부적절한 리뷰 삭제

**통계 대시보드**
- 오늘/이번 주/이번 달 가입자 수
- 총 강의 수 / 활성 강의 수
- 총 수강 신청 수
- 게임별 강의 분포 차트

#### 2.1.4 관리자 API

| Method | Path | 설명 |
|--------|------|------|
| GET | /api/admin/stats | 대시보드 통계 |
| GET | /api/admin/users | 전체 회원 목록 |
| GET | /api/admin/users/:id | 회원 상세 |
| PUT | /api/admin/users/:id/deactivate | 회원 비활성화 |
| GET | /api/admin/lectures | 전체 강의 목록 |
| PUT | /api/admin/lectures/:id/status | 강의 상태 변경 |
| DELETE | /api/admin/lectures/:id | 강의 강제 삭제 |
| GET | /api/admin/reviews | 전체 리뷰 목록 |
| DELETE | /api/admin/reviews/:id | 리뷰 삭제 |

---

### 2.2 강의별 질의응답 게시판

코치와 수강생 사이의 강의 전용 Q&A 게시판 (기존 커뮤니티와 별도).

#### 2.2.1 DB 스키마
```sql
-- migration_p3.sql
CREATE TABLE qna_posts (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  lecture_id INT NOT NULL,
  user_id    INT NOT NULL,               -- 작성자 (학생 또는 코치)
  title      VARCHAR(255) NOT NULL,
  content    TEXT NOT NULL,
  is_solved  TINYINT(1) DEFAULT 0,       -- 답변 완료 여부
  view_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE
);

CREATE TABLE qna_comments (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  post_id    INT NOT NULL,
  user_id    INT NOT NULL,
  content    TEXT NOT NULL,
  is_answer  TINYINT(1) DEFAULT 0,       -- 코치가 채택한 답변
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id)  REFERENCES qna_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)  REFERENCES users(id)     ON DELETE CASCADE
);
```

#### 2.2.2 접근 권한
- **질문 작성**: 해당 강의 수강 승인된 학생 + 코치 본인
- **답변 작성**: 해당 강의 수강 승인된 학생 + 코치 본인
- **답변 채택**: 코치 본인만 (is_answer = 1, is_solved = 1)
- **조회**: 해당 강의 수강 승인된 학생 + 코치 본인

#### 2.2.3 API

| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /api/lectures/:lectureId/qna | authenticate | Q&A 목록 |
| POST | /api/lectures/:lectureId/qna | authenticate | 질문 작성 |
| GET | /api/qna/:id | authenticate | Q&A 상세 |
| PUT | /api/qna/:id | authenticate | 질문 수정 (본인만) |
| DELETE | /api/qna/:id | authenticate | 질문 삭제 (본인/코치) |
| POST | /api/qna/:id/comments | authenticate | 답변 작성 |
| PUT | /api/qna/:id/solve/:commentId | authenticate, authorize('coach') | 답변 채택 |
| DELETE | /api/qna-comments/:id | authenticate | 답변 삭제 (본인만) |

#### 2.2.4 프론트엔드 라우트
```
/lectures/:lectureId/qna          → LectureQnAPage     PrivateRoute
/lectures/:lectureId/qna/:postId  → LectureQnADetail   PrivateRoute
```

- LectureContentPage 사이드바 하단에 "💬 Q&A" 탭 추가
- 강의 상세 페이지에서도 수강 승인된 학생/코치에게 Q&A 버튼 노출

---

## 3. 보안 강화

### 3.1 SQL Injection 방어
현재 Prepared Statement 사용 중이나 추가 검증 레이어 추가.

```js
// 입력값 검증 미들웨어 (express-validator)
import { body, param, query, validationResult } from 'express-validator'

// 예: 강의 등록 검증
body('title').trim().notEmpty().isLength({ max: 255 })
body('price').isInt({ min: 0 })
body('game').isIn(['lol','valorant','tft','battleground','overwatch2','starcraft2'])
```

### 3.2 XSS 방어
```js
// helmet 미들웨어 적용
import helmet from 'helmet'
app.use(helmet())

// DOMPurify로 프론트 입력값 sanitize
import DOMPurify from 'dompurify'
const clean = DOMPurify.sanitize(userInput)
```

### 3.3 Rate Limiting
```js
import rateLimit from 'express-rate-limit'

// 로그인 시도 제한
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15분
  max: 10,                    // 최대 10회
  message: { success: false, message: '너무 많은 로그인 시도입니다. 15분 후 다시 시도해주세요.' }
})
app.use('/api/login', loginLimiter)

// 전체 API 제한
const globalLimiter = rateLimit({ windowMs: 60 * 1000, max: 100 })
app.use('/api', globalLimiter)
```

---

## 4. 외부 연동

### 4.1 이메일 알림 (nodemailer)

**발송 시점**
| 이벤트 | 수신자 | 내용 |
|--------|--------|------|
| 결제 완료 | 학생 | 수강 신청 확인 메일 |
| Q&A 답변 등록 | 질문 작성자 | 코치가 답변을 달았습니다 |
| 성장 분석 작성 | 학생 | 새 성장 분석 리포트가 도착했습니다 |

```js
// emailService.js
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
})

export const sendEnrollmentEmail = async (to, lectureTitle) => {
  await transporter.sendMail({
    from: `"GCP" <${process.env.EMAIL_USER}>`,
    to,
    subject: `[GCP] "${lectureTitle}" 수강 신청이 완료됐습니다`,
    html: `<h2>수강 신청 완료</h2><p>${lectureTitle} 강의를 수강할 수 있습니다.</p>`
  })
}
```

**환경변수 추가**
```
EMAIL_USER=your@gmail.com
EMAIL_PASS=app_password
```

### 4.2 디스코드 Webhook 알림 (선택)

```js
// discordService.js
export const notifyDiscord = async (message) => {
  await fetch(process.env.DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: message })
  })
}

// 사용 예: 신규 강의 등록 시
notifyDiscord(`📚 새 강의 등록: ${title} (코치: ${nickname})`)
```

### 4.3 스케줄러 (node-cron)

```js
import cron from 'node-cron'

// 매일 자정: 30일 이상 비활성 장바구니 정리
cron.schedule('0 0 * * *', async () => {
  await pool.query(
    'DELETE FROM cart_items WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)'
  )
  console.log('[CRON] 만료 장바구니 정리 완료')
})

// 매주 월요일 9시: 미완료 강의 수강자에게 알림 이메일
cron.schedule('0 9 * * 1', async () => {
  // 진도율 50% 미만 수강자 조회 후 독려 이메일 발송
})
```

---

## 5. 운영

### 5.1 구조화 로그

```js
// logger.js (winston)
import winston from 'winston'

export const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ]
})

// 요청 로그 미들웨어
app.use((req, res, next) => {
  logger.info({ method: req.method, path: req.path, ip: req.ip })
  next()
})
```

### 5.2 헬스체크
```js
// 이미 구현됨
GET /health → { status: 'ok', uptime: process.uptime(), timestamp: Date.now() }
```

### 5.3 Docker + CI/CD

**Dockerfile (backend)**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "src/index.js"]
```

**docker-compose.yml**
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports: ["3000:3000"]
    env_file: ./backend/.env
    depends_on: [db]
  db:
    image: mysql:8
    environment:
      MYSQL_DATABASE: game_coaching_platform
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
    volumes: [mysql_data:/var/lib/mysql]
volumes:
  mysql_data:
```

**GitHub Actions (.github/workflows/deploy.yml)**
```yaml
name: Deploy to EC2
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to EC2
        uses: appleboy/ssh-action@v0.1.10
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ec2-user
          key: ${{ secrets.EC2_KEY }}
          script: |
            cd ~/3118_Janghyunje
            git pull origin main
            cd frontend && npm install && npm run build
            cd ../backend && npm install
            pm2 restart all
```

---

## 6. 성능 최적화

### 6.1 DB 인덱스 추가
```sql
-- migration_p3_index.sql
-- 강의 목록 조회 자주 사용되는 컬럼
ALTER TABLE lectures ADD INDEX idx_game (game);
ALTER TABLE lectures ADD INDEX idx_status (status);
ALTER TABLE lectures ADD INDEX idx_price (price);
ALTER TABLE lectures ADD INDEX idx_coach_id (coach_id);

-- 수강 신청 조회
ALTER TABLE applications ADD INDEX idx_student_id (student_id);
ALTER TABLE applications ADD INDEX idx_lecture_id (lecture_id);

-- 진도율 조회
ALTER TABLE content_progress ADD INDEX idx_user_lecture (user_id, lecture_id);

-- 리뷰 조회
ALTER TABLE reviews ADD INDEX idx_lecture_id (lecture_id);

-- Q&A 조회
ALTER TABLE qna_posts ADD INDEX idx_lecture_id (lecture_id);
```

### 6.2 프론트엔드 최적화
- React.lazy + Suspense로 페이지 코드 스플리팅
- 강의 목록 이미지 lazy loading
- Zustand persist로 강의 목록 캐싱 (5분)
- API 응답 캐싱 (react-query 또는 SWR 도입 검토)

---

## 7. P3 DB 스키마 추가

### migration_p3.sql
```sql
-- Q&A 게시판
CREATE TABLE qna_posts (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  lecture_id INT NOT NULL,
  user_id    INT NOT NULL,
  title      VARCHAR(255) NOT NULL,
  content    TEXT NOT NULL,
  is_solved  TINYINT(1) DEFAULT 0,
  view_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE
);

CREATE TABLE qna_comments (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  post_id    INT NOT NULL,
  user_id    INT NOT NULL,
  content    TEXT NOT NULL,
  is_answer  TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id)  REFERENCES qna_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)  REFERENCES users(id)     ON DELETE CASCADE
);

-- 관리자 역할 추가
ALTER TABLE users MODIFY COLUMN role ENUM('student','coach','admin') NOT NULL DEFAULT 'student';

-- users 비활성화 컬럼 추가
ALTER TABLE users ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1;
ALTER TABLE users ADD INDEX idx_role (role);
ALTER TABLE users ADD INDEX idx_is_active (is_active);
```

---

## 8. P3 전체 API 목록 (신규)

### 관리자
| Method | Path | 설명 |
|--------|------|------|
| GET | /api/admin/stats | 대시보드 통계 |
| GET | /api/admin/users | 전체 회원 목록 |
| GET | /api/admin/users/:id | 회원 상세 |
| PUT | /api/admin/users/:id/deactivate | 회원 비활성화 |
| PUT | /api/admin/users/:id/activate | 회원 활성화 |
| GET | /api/admin/lectures | 전체 강의 목록 |
| PUT | /api/admin/lectures/:id/status | 강의 상태 변경 |
| DELETE | /api/admin/lectures/:id | 강의 강제 삭제 |
| GET | /api/admin/reviews | 전체 리뷰 목록 |
| DELETE | /api/admin/reviews/:id | 리뷰 삭제 |

### Q&A
| Method | Path | 설명 |
|--------|------|------|
| GET | /api/lectures/:lectureId/qna | Q&A 목록 |
| POST | /api/lectures/:lectureId/qna | 질문 작성 |
| GET | /api/qna/:id | Q&A 상세 |
| PUT | /api/qna/:id | 질문 수정 |
| DELETE | /api/qna/:id | 질문 삭제 |
| POST | /api/qna/:id/comments | 답변 작성 |
| PUT | /api/qna/:id/solve/:commentId | 답변 채택 |
| DELETE | /api/qna-comments/:id | 답변 삭제 |

---

## 9. P3 프론트엔드 라우트 (신규)

| 경로 | 페이지 | 보호 |
|------|--------|------|
| /admin | AdminDashboard | RoleRoute(admin) |
| /admin/users | AdminUsersPage | RoleRoute(admin) |
| /admin/lectures | AdminLecturesPage | RoleRoute(admin) |
| /admin/reviews | AdminReviewsPage | RoleRoute(admin) |
| /lectures/:lectureId/qna | LectureQnAPage | PrivateRoute |
| /lectures/:lectureId/qna/:postId | LectureQnADetailPage | PrivateRoute |

---

## 10. 개발 우선순위 및 일정

| 주차 | 작업 |
|------|------|
| 1주차 | Q&A 게시판 (백엔드 API + DB) |
| 1주차 | 관리자 기능 (백엔드 API + DB) |
| 2주차 | Q&A 프론트엔드 구현 |
| 2주차 | 관리자 페이지 프론트엔드 구현 |
| 3주차 | 보안 강화 (helmet, rate-limit, express-validator) |
| 3주차 | 이메일 알림 (nodemailer) |
| 4주차 | 구조화 로그 (winston) |
| 4주차 | DB 인덱스 + 성능 최적화 |
| 5주차 | Docker + CI/CD (GitHub Actions) |
| 5주차 | 스케줄러 + 디스코드 Webhook (선택) |
| 6주차 | 최종 테스트 + 배포 + 포트폴리오 정리 |
