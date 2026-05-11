# GCP P2 — 위협 모델 (Threat Model / STRIDE)

## 1. STRIDE 분석

STRIDE는 보안 위협을 6가지로 분류하는 모델이다.

| 위협 | 설명 | GCP에서의 위험 |
|------|------|----------------|
| **S**poofing (신원 위장) | 다른 사용자로 위장 | 타인의 토큰 탈취 후 API 호출 |
| **T**ampering (데이터 변조) | 전송 데이터 변조 | JWT payload 위변조 시도 |
| **R**epudiation (부인) | 행위를 부인 | 결제/수강 기록 조작 주장 |
| **I**nformation Disclosure (정보 노출) | 민감 정보 유출 | 비밀번호, 토큰 노출 |
| **D**enial of Service (서비스 거부) | 서비스 마비 | 로그인 무한 시도 |
| **E**levation of Privilege (권한 상승) | 권한 탈취 | 학생이 코치 API 호출 |

---

## 2. 위협별 대응 현황

### S — 신원 위장
| 위협 | 대응 | 상태 |
|------|------|------|
| 토큰 없이 API 호출 | authenticate 미들웨어 → 401 | ✅ 완료 |
| 만료된 토큰 사용 | jwt.verify() 실패 → 401 | ✅ 완료 |
| 타인 ID로 정보 수정 | `req.user.id === req.params.id` 서버 검증 | ✅ 완료 |

### T — 데이터 변조
| 위협 | 대응 | 상태 |
|------|------|------|
| JWT payload 위변조 | HS256 서명 검증 → 위변조 시 401 | ✅ 완료 |
| SQL Injection | mysql2 Prepared Statement 사용 | ✅ 완료 |
| 요청 body 조작 | 서버에서 req.user.id 직접 추출 (body 신뢰 안 함) | ✅ 완료 |

### I — 정보 노출
| 위협 | 대응 | 상태 |
|------|------|------|
| 비밀번호 평문 저장 | bcrypt(salt=10) 해시 | ✅ 완료 |
| 응답에 비밀번호 포함 | `password` 필드 제거 후 응답 | ✅ 완료 |
| localStorage 토큰 탈취 (XSS) | 현재 미대응 | ⚠️ 미완료 |

### E — 권한 상승
| 위협 | 대응 | 상태 |
|------|------|------|
| 학생이 코치 API 호출 | `authorize('coach')` 미들웨어 → 403 | ✅ 완료 |
| 코치가 타인 강의 수정 | 소유권 검증 → 403 | ✅ 완료 |
| 비수강자가 콘텐츠 접근 | authenticate 미들웨어 필수 | ✅ 완료 |

### D — 서비스 거부
| 위협 | 대응 | 상태 |
|------|------|------|
| 로그인 무한 시도 | 미적용 | ⚠️ 미완료 |

---

## 3. 잔존 위험 및 향후 대응

| 위험 | 심각도 | 향후 대응 |
|------|--------|----------|
| localStorage XSS 취약점 | 중간 | httpOnly Cookie로 전환 |
| Rate Limiting 미적용 | 낮음 | express-rate-limit 패키지 적용 |
| HTTPS 미적용 (개발환경) | 높음 | 운영 배포 시 SSL 인증서 적용 |
| Refresh Token 미구현 | 낮음 | P3에서 구현 예정 |
