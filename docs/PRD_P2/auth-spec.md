# GCP P2 — 인증 명세서 (Auth Spec)

## 1. 토큰 발급

### 엔드포인트
```
POST /api/login
```

### Request
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Response (성공 200)
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
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

### JWT Payload
```json
{
  "id": 1,
  "role": "student",
  "iat": 1713300000,
  "exp": 1713904800
}
```

| 필드 | 설명 |
|------|------|
| id | users.id (PK) |
| role | student 또는 coach |
| iat | 발급 시각 (Unix timestamp) |
| exp | 만료 시각 (iat + 7일) |

---

## 2. 토큰 사용

### 요청 헤더
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Axios 자동 첨부 (프론트엔드)
```javascript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
```

---

## 3. 에러 응답 규격

| 상황 | 상태코드 | 응답 body |
|------|----------|-----------|
| 토큰 없음 | 401 | `{ success: false, message: "로그인이 필요합니다." }` |
| 토큰 만료/위변조 | 401 | `{ success: false, message: "유효하지 않은 토큰입니다." }` |
| 역할 불일치 | 403 | `{ success: false, message: "접근 권한이 없습니다." }` |
| 본인 아닌 리소스 | 403 | `{ success: false, message: "본인 ... 만 가능합니다." }` |
| 이메일 중복 | 409 | `{ success: false, code: "EMAIL_DUPLICATE", message: "..." }` |
| 닉네임 중복 | 409 | `{ success: false, code: "NICKNAME_DUPLICATE", message: "..." }` |

---

## 4. 환경변수

```env
JWT_SECRET=your_secret_key_here      # 최소 32자 권장
JWT_EXPIRES_IN=7d                     # 7일
```

---

## 5. 보안 고려사항

| 항목 | 현재 상태 | 권장 사항 |
|------|----------|----------|
| 토큰 저장 | localStorage | httpOnly Cookie (XSS 방어) |
| Refresh Token | 미구현 | 구현 시 DB 저장 + 만료 관리 |
| HTTPS | 개발환경 미적용 | 운영 시 필수 |
| Rate Limiting | 미적용 | 로그인 시도 횟수 제한 권장 |
| 비밀번호 | bcrypt salt=10 | 적절한 수준 |
