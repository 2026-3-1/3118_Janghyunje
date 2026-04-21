# GCP (Game Coaching Platform) — P2 요구사항 체크리스트
작성자: 18 장현제
작성일: 2026년 4월 21일

---

## 1. 인증 (Authentication)

- [x] JWT 토큰 발급 — 로그인 시 `{ token, user }` 반환
- [x] JWT Secret 환경변수 관리 (`.env` JWT_SECRET, JWT_EXPIRES_IN)
- [x] 토큰 유효기간 설정 (7일)
- [x] 비밀번호 bcrypt 해시 저장
- [x] 이메일 중복 체크 (EMAIL_DUPLICATE 코드 반환)
- [x] 닉네임 중복 체크 (NICKNAME_DUPLICATE 코드 반환)

---

## 2. 인가 / 접근 제어 (Authorization & RBAC)

- [x] `authenticate` 미들웨어 — Authorization: Bearer 토큰 검증
- [x] `authorize(...roles)` 미들웨어 — 역할 기반 접근 제어
- [x] 학생 전용 API 보호 (수강 신청, 리뷰 작성 등)
- [x] 코치 전용 API 보호 (강의 등록/수정/삭제, 신청 승인/거절 등)
- [x] 로그인 필요 API 보호 (프로필, 마이페이지, 커뮤니티 작성 등)
- [x] 공개 API 유지 (강의 목록/상세, 커뮤니티 조회 등)

---

## 3. 소유권 검증 (Ownership Validation)

- [x] 강의 수정/삭제 — 본인 강의만 가능
- [x] 수강 신청 승인/거절 — 본인 강의의 신청만 처리 가능
- [x] 유저 정보 수정 — 본인 계정만 수정 가능
- [x] 게시글 수정/삭제 — 본인 게시글만 가능
- [x] 댓글 삭제 — 본인 댓글만 가능
- [x] 콘텐츠 등록/수정/삭제 — 본인 강의 콘텐츠만 가능

---

## 4. 사용자 ID 추출 방식 변경 (P1 → P2)

- [x] 수강 신청 — `student_id` body 제거 → `req.user.id`
- [x] 수강 신청 목록(학생) — `?student_id=` 쿼리 제거 → `req.user.id`
- [x] 수강 신청 목록(코치) — `?coach_id=` 쿼리 제거 → `req.user.id`
- [x] 강의 등록 — `coach_id` body 제거 → `req.user.id`
- [x] 리뷰 작성 — `student_id` body 제거 → `req.user.id`
- [x] 게시글 작성/댓글 — `user_id` body 제거 → `req.user.id`
- [x] 콘텐츠 댓글 — `user_id` body 제거 → `req.user.id`

---

## 5. 프론트엔드 라우트 보호

- [x] `PrivateRoute` 컴포넌트 — 비로그인 시 /login 리다이렉트
- [x] `RoleRoute` 컴포넌트 — 역할 불일치 시 / 리다이렉트
- [x] 마이페이지 (/mypage) — PrivateRoute 적용
- [x] 프로필 (/profile) — PrivateRoute 적용
- [x] 장바구니 (/cart) — PrivateRoute 적용
- [x] 성장 분석 (/growth) — PrivateRoute 적용
- [x] 커뮤니티 글쓰기 (/community/write) — PrivateRoute 적용
- [x] 강의 시청 (/lectures/:id/contents) — PrivateRoute 적용
- [x] 코치 대시보드 (/coach/dashboard) — RoleRoute(coach) 적용
- [x] 강의 등록 (/coach/lecture/new) — RoleRoute(coach) 적용
- [x] 강의 수정 (/coach/lecture/edit/:id) — RoleRoute(coach) 적용
- [x] 강의 자료 관리 (/lectures/:id/manage) — RoleRoute(coach) 적용

---

## 6. Axios 인증 처리

- [x] 요청 interceptor — localStorage token → Authorization 헤더 자동 첨부
- [x] 응답 interceptor — 401 수신 시 localStorage 초기화 + /login 이동
- [x] 로그인/회원가입 페이지에서는 401 리다이렉트 방지 (무한루프 방지)

---

## 7. 장바구니 기능

- [x] DB 테이블 생성 (`cart_items`)
- [x] GET /api/cart — 내 장바구니 목록 조회
- [x] POST /api/cart — 강의 장바구니 추가
- [x] DELETE /api/cart/:lectureId — 장바구니 단건 삭제
- [x] DELETE /api/cart — 장바구니 전체 비우기
- [x] 본인 강의 담기 방지
- [x] 이미 수강 신청한 강의 담기 방지
- [x] 장바구니 페이지 UI (전체선택, 가격 합계, 일괄 수강 신청)
- [x] 강의 상세 페이지에 장바구니 담기 버튼 추가
- [x] Navbar 장바구니 아이콘 + 수량 뱃지

---

## 8. 영상 진도율 / 이어보기

- [x] DB 테이블 생성 (`content_progress`)
- [x] POST /api/progress — 진도 저장 (watched_sec, duration_sec, completed)
- [x] GET /api/progress/:lectureId — 강의 전체 진도율 조회
- [x] GET /api/progress/:lectureId/content/:contentId — 단일 콘텐츠 진도 조회
- [x] YouTube IFrame API 연동 (window.YT.Player)
- [x] 재생 중 5초마다 자동 저장
- [x] 일시정지/종료 시 즉시 저장
- [x] 이어보기 — 마지막 시청 위치에서 재생 시작
- [x] 사이드바에 진도바 및 이어보기 시간 표시
- [x] 완료(80% 이상) 시 ✓ 표시

---

## 9. 리뷰 작성 조건 강화

- [x] 수강 승인(approved) 상태 확인
- [x] 강의 60% 이상 수강 시에만 리뷰 작성 가능
- [x] 미달 시 현재 진도율 안내 메시지 반환
- [x] 강의 콘텐츠 없는 경우 조건 예외 처리

---

## 10. 성장 분석 (코치 작성 / 수강자 열람)

- [x] DB 테이블 생성 (`growth_reports`)
- [x] POST /api/growth/reports — 코치 작성
- [x] PUT /api/growth/reports/:id — 코치 수정
- [x] DELETE /api/growth/reports/:id — 코치 삭제
- [x] GET /api/growth/reports — 수강자: 본인 분석 목록 조회
- [x] GET /api/growth/coach/reports — 코치: 내가 작성한 목록 조회
- [x] GET /api/growth/reports/:id — 단건 조회 (코치·수강자만 열람)
- [x] 본인 강의 수강자에게만 작성 가능 (서버 검증)
- [x] 수강자 열람 페이지 UI (/growth)
- [x] 코치 대시보드에서 분석 작성 모달

---

## 11. 코치 대시보드 고도화

- [x] GET /api/lectures/my — 본인 강의만 조회 (전체 목록과 분리)
- [x] 수강자 목록 탭 추가
- [x] 강의별 수강자 목록 조회 (GET /api/applications/lecture/:lectureId)
- [x] 수강자별 진도율 표시
- [x] 수강자별 리뷰 작성 여부 표시
- [x] 수강자별 성장 분석 작성 여부 표시
- [x] 다른 코치 강의 노출 버그 수정

---

## 12. PRD 문서화

- [x] PRD_P1 작성 (6개 파일: overview, architecture, database, api_endpoints, features, README)
- [x] PRD_P2 작성 (7개 파일: overview, architecture, database, api_endpoints, auth_security, features, README)

---

## 미완성 항목

- [ ] Refresh Token — 토큰 만료 시 자동 재발급
- [ ] AI 강의 추천 — 삭제 결정 (범위 축소)
