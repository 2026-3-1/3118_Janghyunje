# GCP P2 — PRD 목차

Game Coaching Platform Phase 2 요구사항 명세서

| 파일 | 내용 |
|------|------|
| [requirements.md](./requirements.md) | 유저 스토리 + 수용 기준 (AC) |
| [security-outline.md](./security-outline.md) | 인증/인가 설계 개요, 역할 모델 |
| [auth-spec.md](./auth-spec.md) | JWT 토큰 규격, 헤더, 에러 코드 |
| [threat-model.md](./threat-model.md) | STRIDE 위협 모델, 대응 현황 |
| [e2e-cases.md](./e2e-cases.md) | e2e 테스트 케이스 5개 |
| [observability.md](./observability.md) | 로그/에러 처리, 향후 모니터링 계획 |
| [perf-notes.md](./perf-notes.md) | 성능 개선 전/후 기록 |
| [01_overview.md](./01_overview.md) | P2 목표, P1 대비 변경사항 |
| [02_architecture.md](./02_architecture.md) | JWT 인증 흐름, 미들웨어 체인 |
| [03_database.md](./03_database.md) | DB 변경사항 (cart, progress, growth_reports) |
| [04_api_endpoints.md](./04_api_endpoints.md) | 전체 API + 인증 레벨 |
| [05_auth_security.md](./05_auth_security.md) | 미들웨어 코드, 보안 설계 |
| [06_features.md](./06_features.md) | P1 대비 변경된 기능 명세 |

## P2 핵심 구현 내용

- JWT Bearer 토큰 인증
- RBAC (학생/코치 역할 기반 접근 제어)
- 결제 페이지 + 자동 수강 승인
- 장바구니 (담기/결제/수량 뱃지)
- 영상 이어보기 (YouTube IFrame API + 진도율 저장)
- 실제 시청 시간 기반 진도율
- 다음 강의 자동 이동 모달 (10초 카운트다운)
- 리뷰 작성 조건 — 60% 이상 수강
- 성장 분석 (코치 작성 / 수강자 열람)
- 코치 대시보드 수강자 목록 (진도율·리뷰·분석 현황)
- PrivateRoute / RoleRoute 라우트 보호
