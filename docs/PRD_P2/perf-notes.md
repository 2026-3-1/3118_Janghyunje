# GCP P2 — 성능 개선 기록 (Performance Notes)

## 1. DB 쿼리 개선

### 강의 목록 조회 (getLectures)

**개선 전**
```sql
-- 전체 강의를 가져온 후 애플리케이션 레벨에서 필터링
SELECT * FROM lectures
```

**개선 후**
```sql
-- WHERE 조건을 SQL 레벨에서 처리
SELECT l.*, u.nickname AS coach_nickname,
       AVG(r.rating) AS rating,
       COUNT(DISTINCT a.id) AS enroll_count
FROM lectures l
JOIN users u ON l.coach_id = u.id
LEFT JOIN reviews r ON r.lecture_id = l.id
LEFT JOIN applications a ON a.lecture_id = l.id AND a.status = 'approved'
WHERE l.status = 'active'
  AND l.game = ?          -- 파라미터 바인딩
  AND l.price <= ?
GROUP BY l.id
ORDER BY enroll_count DESC
```

효과: 불필요한 데이터 전송 감소, 집계를 DB에서 처리

---

### 수강자 목록 조회 (getLectureStudents)

**개선 전 (문제)**
- 같은 학생이 여러 번 신청한 중복 행 반환

**개선 후**
```sql
-- student_id 기준 GROUP BY로 중복 제거
FROM (
  SELECT MIN(id) AS id, student_id, lecture_id, status, created_at
  FROM applications
  WHERE lecture_id = ? AND status = 'approved'
  GROUP BY student_id
) a
```

---

### 진도율 계산 개선

**개선 전**
- 완료된 콘텐츠 개수 기준 (1/2 = 50%)

**개선 후**
- 실제 시청 시간 기반 비율 계산
```javascript
const totalDuration = items.reduce((s, i) => s + Number(i.duration_sec), 0)
const totalWatched  = items.reduce((s, i) => s + Math.min(Number(i.watched_sec), Number(i.duration_sec)), 0)
const percent = Math.round((totalWatched / totalDuration) * 100)
```

효과: 영상 길이에 따른 가중치 적용으로 정확한 진도율 표시

---

## 2. 프론트엔드 렌더링 개선

### 강의 카드 수강 상태 표시

**개선 전 (문제)**
- `useState(initialStatus)` 로 초기화 → prop 변경 시 state 미반영
- 수강 중 → 신청 버튼 깜빡임 현상 발생

**개선 후**
- `initialStatus` prop 직접 사용 → statusMap 로드 후 즉시 반영

---

### 무한 새로고침 버그 수정

**문제**
- Navbar에서 비로그인 상태에 `/cart` API 호출 → 401 → Axios interceptor → /login 강제 이동 → 무한루프

**수정**
```javascript
// 토큰 있을 때만 cart API 호출
const token = localStorage.getItem('token')
if (!user || !token) { setCartCount(0); return }

// /login, /register 페이지에서는 401 리다이렉트 안 함
if (err.response?.status === 401) {
  const path = window.location.pathname
  if (path !== '/login' && path !== '/register') {
    window.location.href = '/login'
  }
}
```

---

## 3. 향후 개선 예정 (P3)

| 항목 | 방법 |
|------|------|
| DB 인덱스 추가 | `applications(lecture_id, student_id)`, `content_progress(user_id, lecture_id)` |
| 페이지네이션 | 강의 목록 LIMIT/OFFSET → cursor 방식 |
| 프론트 코드 스플리팅 | React.lazy() + Suspense |
| 이미지 최적화 | 강의 썸네일 WebP 변환 |
