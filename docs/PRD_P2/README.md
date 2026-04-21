# GCP P2 — PRD 목차

Game Coaching Platform Phase 2 요구사항 명세서

| 파일 | 내용 |
|------|------|
| [01_overview.md](./01_overview.md) | P2 목표, P1 대비 변경사항, 구현 범위 |
| [02_architecture.md](./02_architecture.md) | JWT 인증 흐름, 미들웨어 체인, 라우트 보호 구조 |
| [03_database.md](./03_database.md) | P2 DB 변경사항, 소유권 검증 쿼리, 향후 확장 계획 |
| [04_api_endpoints.md](./04_api_endpoints.md) | 전체 REST API 명세 + 인증 레벨 표시 |
| [05_auth_security.md](./05_auth_security.md) | JWT 설계, authenticate/authorize 미들웨어, 보안 고려사항 |
| [06_features.md](./06_features.md) | P1 대비 변경된 기능 명세 |

## P2 핵심 특징

- JWT Bearer 토큰 인증
- RBAC (학생/코치 역할 기반 접근 제어)
- 프론트엔드 PrivateRoute / RoleRoute 라우트 보호
- 서버에서 소유권 검증 (본인 강의/본인 정보만 수정 가능)
- student_id, coach_id를 클라이언트에서 전달하지 않고 JWT에서 추출
