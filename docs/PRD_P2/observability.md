# GCP P2 — 모니터링 및 관측성 (Observability)

## 1. 현재 구현 상태

### 로깅
- Express 서버에서 `console.error(err)` 로 에러 출력
- 모든 컨트롤러 try-catch → `errorHandler` 미들웨어로 전달

```javascript
// middleware/errorHandler.js
export const errorHandler = (err, req, res, next) => {
  console.error(err)  // 서버 콘솔 출력
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '서버 오류가 발생했습니다.',
  })
}
```

### 헬스체크
- 현재 미구현 (P3 예정)

---

## 2. 에러 코드 규격

| 코드 | HTTP | 설명 |
|------|------|------|
| EMAIL_DUPLICATE | 409 | 이메일 중복 |
| NICKNAME_DUPLICATE | 409 | 닉네임 중복 |
| PROGRESS_REQUIRED | 403 | 진도율 부족 (리뷰 불가) |
| ER_DUP_ENTRY | 409 | DB 중복 키 (수강 신청 중복 등) |

---

## 3. 향후 개선 계획 (P3)

### 구조화 로그
```javascript
// 예시 — JSON 형태 로그
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  level: 'error',
  method: req.method,
  path: req.path,
  userId: req.user?.id,
  message: err.message,
}))
```

### 헬스체크 엔드포인트
```javascript
// GET /health
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})
```

### Sentry 연동 (예정)
```javascript
import * as Sentry from '@sentry/node'
Sentry.init({ dsn: process.env.SENTRY_DSN })
app.use(Sentry.Handlers.errorHandler())
```
