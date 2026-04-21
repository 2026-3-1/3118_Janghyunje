# GCP (Game Coaching Platform) — P2 프로젝트 개요

## 1. 프로젝트 정보

| 항목 | 내용 |
|------|------|
| 프로젝트명 | Game Coaching Platform (GCP) |
| 버전 | P2 (Phase 2) |
| 개발 시작 | 2026년 4월 17일~ |
| 개발자 | 18 장현제 |
| 이전 버전 | P1 (기본 기능 완성) |

## 2. P2 목표

P1에서 의도적으로 제외했던 **보안 · 고도화 기능**을 구현한다.

### P2 핵심 변경사항

| 분류 | P1 | P2 |
|------|-----|-----|
| 로그인 응답 | 유저 정보만 반환 | JWT 토큰 발급 |
| API 인증 | 없음 | Bearer 토큰 필수 |
| 역할 제어 | 없음 | RBAC (학생/코치 구분) |
| 라우트 보호 | 없음 | PrivateRoute / RoleRoute |
| student_id 전달 | Body/Query로 직접 전달 | JWT(req.user.id)에서 추출 |
| 코치 권한 검증 | 없음 | 본인 강의만 수정/삭제 가능 |
| 성장 분석 | 없음 | 수강 기록 기반 분석 페이지 |

## 3. P2 구현 범위

### 완료
- [x] JWT 토큰 발급 (로그인 시 `token` + `user` 반환)
- [x] `authenticate` 미들웨어 (Authorization: Bearer)
- [x] `authorize(...roles)` RBAC 미들웨어
- [x] 전체 라우트 보호 적용 (공개/로그인/학생전용/코치전용)
- [x] `req.user.id`로 student_id, coach_id, user_id 추출 (body/query 제거)
- [x] 승인/거절 시 본인 강의 여부 서버 검증
- [x] 강의/콘텐츠/게시글/댓글 소유권 검증 (본인 것만 수정/삭제)
- [x] 리뷰 작성 시 수강 승인 여부 검증
- [x] 프론트엔드 PrivateRoute / RoleRoute
- [x] useAuthStore token 저장
- [x] Axios interceptor — 401 자동 처리
- [x] 학생 성장 분석 (GET /api/growth)
- [x] 성장 분석 페이지 (/growth) — 수강 현황, 게임별 분포, 월별 추이, 만족도, 티어 분포
- [x] Navbar 성장 분석 링크 (학생 전용)

### 제외 (범위 축소)
- [ ] AI 강의 추천 — 삭제
- [ ] Refresh Token — 향후 과제

## 4. 기술 스택 (P1과 동일, 추가된 것)

| 추가 항목 | 내용 |
|----------|------|
| jsonwebtoken | JWT 발급 및 검증 |
| JWT_SECRET | .env에 저장 |
| JWT_EXPIRES_IN | 7d (7일) |

## 5. 보안 개선 포인트

1. **인증**: 모든 민감 API에 Bearer 토큰 필수
2. **인가**: 학생/코치 역할에 따른 API 접근 제어
3. **소유권 검증**: 강의·콘텐츠·게시글·댓글 수정/삭제 시 본인 소유인지 서버에서 확인
4. **수강 검증**: 리뷰 작성 시 수강 승인 여부 확인
5. **프론트 가드**: 라우트 레벨에서 비인가 접근 차단
6. **토큰 만료**: 401 응답 시 자동 로그아웃 처리
