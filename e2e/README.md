# GCP E2E 테스트

Playwright 기반 e2e 테스트

## 설치

```bash
cd e2e
npm install
npx playwright install chromium
```

## 실행 전 준비

1. 백엔드 서버 실행
```bash
cd ../backend
npm run dev
```

2. 프론트엔드 서버 실행
```bash
cd ../frontend
npm run dev
```

3. DB에 테스트용 계정 생성 (TC-03, 04, 05에서 사용)
```sql
-- 학생 테스트 계정 (비밀번호: Test1234! → bcrypt 해시 필요)
-- TC-01은 테스트 실행 시 자동 생성
```

## 실행

```bash
# 전체 테스트
npm test

# UI 모드 (브라우저 직접 확인)
npm run test:ui

# 특정 파일만
npx playwright test tc01
npx playwright test tc02

# 리포트 확인
npm run test:report
```

## 테스트 파일 목록

| 파일 | 설명 |
|------|------|
| tc01-signup-login-checkout.spec.js | 회원가입 → 로그인 → 강의 결제 전체 흐름 |
| tc02-protected-routes.spec.js | 비로그인 보호 라우트 차단 확인 |
| tc03-student-role-guard.spec.js | 학생의 코치 전용 페이지 접근 차단 |
| tc04-cart-checkout.spec.js | 장바구니 담기 → 결제 흐름 |
| tc05-coach-dashboard.spec.js | 코치 대시보드 강의/수강자 관리 |
