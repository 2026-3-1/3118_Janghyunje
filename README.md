# GCP - Game Coaching Platform

게임 실력 향상을 원하는 학생과 코치를 연결해주는 게임 강의 매칭 웹 플랫폼

---

## 배포 정보

| 항목 | 주소 |
|------|------|
| 서비스 URL | http://3.38.183.204 |
| 결제 포함 전체 기능 | https://shirt-legwork-grime.ngrok-free.dev |
| 관리자 페이지 | https://shirt-legwork-grime.ngrok-free.dev/gcp-admin-2026 |
| GitHub | https://github.com/2026-3-1/3118_Janghyunje |

---

## 기술 스택

- **Frontend**: React (Vite), Zustand, Tailwind CSS
- **Backend**: Node.js, Express, JWT, PM2
- **Database**: MariaDB
- **Infra**: AWS EC2, Nginx, ngrok (HTTPS)
- **결제**: 토스페이먼츠
- **CI/CD**: GitHub Actions, Docker

---

## 개발 단계

- **P1**: 기본 CRUD, 프론트엔드/백엔드 구축
- **P2**: JWT 인증, RBAC 역할 기반 접근 제어
- **P3**: 결제, 팔로우, 관리자 대시보드, 스케줄러, 보안, 배포

---

## 로컬 실행

```bash
# 백엔드
cd backend
npm install
npm run dev

# 프론트엔드 (새 터미널)
cd frontend
npm install
npm run dev
```

자세한 운영 매뉴얼은 `MANUAL.md` 참고
