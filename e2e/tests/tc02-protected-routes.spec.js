import { test, expect } from '@playwright/test'

test.describe('TC-02. 비로그인 사용자 보호 라우트 접근 차단', () => {

  test.beforeEach(async ({ page }) => {
    // 로그아웃 상태 보장
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    })
  })

  const protectedRoutes = [
    { path: '/mypage',          name: '마이페이지' },
    { path: '/cart',            name: '장바구니' },
    { path: '/growth',          name: '성장 분석' },
    { path: '/profile',         name: '프로필' },
    { path: '/community/write', name: '커뮤니티 글쓰기' },
  ]

  for (const route of protectedRoutes) {
    test(`${route.name} (${route.path}) → /login 리다이렉트`, async ({ page }) => {
      await page.goto(route.path)
      await expect(page).toHaveURL(/login/)
    })
  }

  const coachRoutes = [
    { path: '/coach/dashboard',    name: '코치 대시보드' },
    { path: '/coach/lecture/new',  name: '강의 등록' },
  ]

  for (const route of coachRoutes) {
    test(`${route.name} (${route.path}) → /login 리다이렉트`, async ({ page }) => {
      await page.goto(route.path)
      await expect(page).toHaveURL(/login/)
    })
  }

  test('공개 페이지는 정상 접근 가능', async ({ page }) => {
    await page.goto('/lectures')
    await expect(page).toHaveURL('/lectures')
    await expect(page.getByText(/개의 강의/)).toBeVisible()
  })
})
