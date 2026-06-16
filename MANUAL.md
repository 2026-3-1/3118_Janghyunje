# GCP (Game Coaching Platform) 운영 매뉴얼

> 작성일: 2026년 6월  
> 작성자: 18 장현제  
> 대상: 교강사 및 운영자

---

## 1. 서비스 접속 정보

| 항목 | 정보 |
|------|------|
| **일반 서비스 URL** | http://3.38.183.204 |
| **결제 포함 전체 URL** | https://shirt-legwork-grime.ngrok-free.dev |
| **관리자 로그인 페이지** | https://shirt-legwork-grime.ngrok-free.dev/gcp-admin-2026 |
| **관리자 이메일** | jhj122329@gmail.com |
| **관리자 비밀번호** | 1234 |
| **관리자 접근 키** | gcp-admin-secret-2026 |
| **GitHub 저장소** | https://github.com/2026-3-1/3118_Janghyunje |

> **참고**: 결제 기능은 토스페이먼츠 정책상 HTTPS 환경에서만 작동합니다.  
> 결제 테스트는 반드시 ngrok URL(https://shirt-legwork-grime.ngrok-free.dev)로 접속하세요.

---

## 2. 테스트 계정

| 역할 | 이메일 | 비밀번호 | 비고 |
|------|--------|----------|------|
| 학생 | test125@naver.com | 1234 | 수강 신청, 결제, 환불 가능 |
| 코치 | coach1@example.com | 1234 | 강의 등록, 수강자 관리 가능 |
| 관리자 | jhj122329@gmail.com | 1234 | 관리자 접근 키 필요 |

---

## 3. 주요 기능 확인 방법

### 3-1. 회원가입 / 로그인
1. 서비스 URL 접속 → 우측 상단 **회원가입** 버튼 클릭
2. 역할(학생/코치) 선택 후 이메일, 닉네임, 비밀번호 입력
3. 가입 완료 후 로그인

### 3-2. 강의 수강 신청 및 결제
1. ngrok URL로 접속 (결제는 HTTPS 필요)
2. 강의 목록에서 강의 선택 → **바로 결제하기** 클릭
3. 토스페이먼츠 결제창에서 카드/카카오페이/PAYCO 중 선택
4. 결제 완료 후 자동으로 수강 신청 처리됨
5. **내 수강** 메뉴에서 수강 중인 강의 확인 가능

### 3-3. 결제 내역 및 환불
1. **내 수강** 메뉴 → 우측 상단 **결제 내역** 버튼 클릭
2. 결제 내역 목록에서 **환불 신청** 버튼 클릭
3. 수강 진도율이 **30% 미만**인 경우에만 환불 가능
4. 환불 사유 입력 후 신청 완료
5. 환불 내역은 관리자 페이지 **환불 내역** 탭에서 확인 가능

### 3-4. 코치 팔로우 및 신규 강의 알림 (이메일)
1. 강의 상세 페이지에서 코치 프로필 옆 **+ 팔로우** 버튼 클릭
2. 알림 이메일 설정 방법:
   - 로그인 후 우측 상단 닉네임 클릭 → **프로필** 이동
   - **알림 설정** 섹션에서 알림받을 이메일 입력 후 저장
3. 팔로우한 코치가 새 강의를 등록하면 등록한 이메일로 알림 수신
4. 그 외 Q&A 답변, 성장 분석 작성 시에도 이메일 알림 수신

### 3-5. 강의 등록 (코치)
1. 코치 계정으로 로그인 → **수강 관리** → **강의 등록** 버튼 클릭
2. 강의 정보 입력 (제목, 설명, 게임, 수강료 등)
3. **다음 단계** 클릭 후 YouTube URL로 강의 영상 추가
4. 최소 1개 이상의 강의 자료 추가 후 **등록 완료**

### 3-6. 성장 분석 (코치)
1. 코치 대시보드 → **수강자 목록** → 강의 선택
2. 수강자 목록에서 **분석 작성** 버튼 클릭
3. 제목과 내용 작성 후 **작성 완료**
4. 해당 학생에게 이메일 알림 발송됨

### 3-7. 관리자 대시보드
1. https://shirt-legwork-grime.ngrok-free.dev/gcp-admin-2026 접속
2. **관리자 접근 키**: `gcp-admin-secret-2026` 입력
3. **이메일**: jhj122329@gmail.com / **비밀번호**: 1234
4. 로그인 후 다음 기능 확인 가능:

| 탭 | 기능 |
|----|------|
| 대시보드 | 전체 회원/강의/수강/리뷰 통계 |
| 회원 관리 | 전체 회원 조회, 활성화/비활성화 |
| 강의 관리 | 강의 상태 변경 (활성/비활성) |
| 리뷰 관리 | 부적절한 리뷰 삭제 |
| 환불 내역 | 전체 환불 신청 이력 조회 |

---

## 4. 보안 기능 확인

### 4-1. SQL Injection 방어
- `backend/src/middleware/validators.js`에서 express-validator로 입력값 검증
- 모든 DB 쿼리는 Prepared Statement 사용

### 4-2. Rate Limiting
- IP당 15분에 100회 요청 제한
- 초과 시 429 Too Many Requests 응답
- `backend/src/index.js`에서 확인 가능

### 4-3. JWT 인증
- 로그인 시 JWT 토큰 발급 (유효기간 7일)
- 모든 보호된 API는 Authorization 헤더 필요

### 4-4. 관리자 접근 제어
- 관리자 로그인 URL이 일반 사용자에게 노출되지 않음 (`/gcp-admin-2026`)
- 관리자 접근 키 + 이메일 + 비밀번호 3중 인증

---

## 5. 로그 확인 방법

### EC2 서버 접속
```bash
ssh ec2-user@3.38.183.204
# 비밀번호 입력
```

### 로그 확인 명령어
```bash
# 실시간 로그 확인
pm2 logs backend

# 최근 50줄 확인
pm2 logs backend --lines 50

# 로그 파일 직접 확인
cat /home/ec2-user/.pm2/logs/backend-out.log   # 일반 로그
cat /home/ec2-user/.pm2/logs/backend-error.log  # 에러 로그
```

### 로그 예시
```
[06:43:01] info: POST /admin/login 200 66ms {"ip":"127.0.0.1","userId":2}
[06:43:05] info: GET /admin/refunds 200 2ms {"ip":"127.0.0.1","userId":2}
[06:43:07] warn: POST /cart 404 2ms {"ip":"127.0.0.1","userId":1}
```

---

## 6. 배치 작업 (스케줄러)

### 코드 위치
`backend/src/utils/scheduler.js`

### 배치 작업 목록

| 작업명 | 실행 시각 | 내용 |
|--------|-----------|------|
| 장바구니 정리 | 매일 자정 (00:00) | 30일 이상 된 장바구니 항목 자동 삭제 |
| 강의 비활성화 | 매일 새벽 3시 (03:00) | 1년 이상 수강생 없는 강의 자동 비활성화 |
| 주간 통계 | 매주 월요일 오전 9시 | 주간 통계 로그 기록 |

### 배치 실행 횟수 확인
```bash
# EC2 접속 후

# 장바구니 정리 실행 횟수 확인
pm2 logs backend --lines 5000 | grep "장바구니 정리"

# 강의 비활성화 실행 횟수 확인
pm2 logs backend --lines 5000 | grep "강의 정리"

# 주간 통계 실행 횟수 확인
pm2 logs backend --lines 5000 | grep "주간 통계"

# 스케줄러 시작 횟수 (서버 재시작 횟수)
pm2 logs backend --lines 5000 | grep "스케줄러 시작"
```

---

## 7. 서버 운영 명령어

```bash
# EC2 접속
ssh ec2-user@3.38.183.204

# 서버 상태 확인
pm2 status

# 백엔드 재시작
pm2 restart backend

# ngrok 실행 (결제용 HTTPS 터널)
ngrok http 80 --log=stdout &

# nginx 상태 확인
sudo systemctl status nginx

# nginx 재시작
sudo systemctl restart nginx

# MariaDB 상태 확인
sudo systemctl status mariadb
```

---

## 8. 자주 발생하는 문제 해결

| 문제 | 원인 | 해결 방법 |
|------|------|-----------|
| 결제창이 안 열림 | HTTP 환경 | ngrok URL(https://...)로 접속 |
| ngrok 연결 끊김 | 서버 재시작 등 | EC2 접속 후 `ngrok http 80 --log=stdout &` 재실행 |
| 관리자 로그인 실패 | 접근 키 오류 | 접근 키: `gcp-admin-secret-2026` 확인 |
| 서버 응답 없음 | PM2 중단 | `pm2 restart backend` 실행 |
| 강의 목록이 비어있음 | Mock 모드 활성화 | EC2에서 프론트 빌드 시 `.env.production` 확인 |
