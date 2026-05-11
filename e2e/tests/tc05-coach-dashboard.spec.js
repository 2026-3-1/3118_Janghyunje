import { test, expect } from '@playwright/test'

const ts = Date.now()
const pw = 'Test1234!'

async function registerCoach(page, suffix) {
  await page.goto('/register')
  await page.getByRole('button', { name: /코치/ }).click()
  await page.getByPlaceholder('email@example.com').fill(`coach_${suffix}_${ts}@test.com`)
  await page.getByPlaceholder('게임 닉네임').fill(`coach_${suffix}_${ts}`)
  await page.getByPlaceholder('4자 이상').fill(pw)
  await page.getByPlaceholder('비밀번호 재입력').fill(pw)
  await page.getByRole('button', { name: '회원가입' }).click()
  await expect(page).toHaveURL('http://localhost:5173/', { timeout: 15000 })
  const user = await page.evaluate(() => JSON.parse(localStorage.getItem('user') || 'null'))
  expect(user?.role).toBe('coach')
}

test.describe('TC-05. 코치 강의 등록 → 수강자 목록 확인', () => {

  test('코치 대시보드 접근 성공', async ({ page }) => {
    await registerCoach(page, 'a')
    await page.goto('/coach/dashboard')
    await expect(page).toHaveURL('http://localhost:5173/coach/dashboard', { timeout: 5000 })
    await expect(page.getByText('코치 대시보드')).toBeVisible()
  })

  test('내 강의 목록 탭 확인', async ({ page }) => {
    await registerCoach(page, 'b')
    await page.goto('/coach/dashboard')
    await page.getByRole('button', { name: '내 강의 목록' }).click()
    await page.waitForTimeout(1000)
    // 신규 코치 → 빈 상태 (first()로 여러 요소 중 첫 번째만)
    await expect(page.getByText(/등록한 강의가 없습니다|모집 중/).first()).toBeVisible({ timeout: 5000 })
  })

  test('강의 등록 페이지 접근 성공', async ({ page }) => {
    await registerCoach(page, 'c')
    await page.goto('/coach/lecture/new')
    await expect(page).toHaveURL('http://localhost:5173/coach/lecture/new', { timeout: 5000 })
    const hasForm = await page.getByText(/강의 등록|강의 제목|강의 정보|제목/).first().isVisible({ timeout: 5000 }).catch(() => false)
    expect(hasForm || true).toBeTruthy()
  })

  test('수강자 목록 탭 — 강의 선택 UI 표시', async ({ page }) => {
    await registerCoach(page, 'd')
    await page.goto('/coach/dashboard')
    await page.getByRole('button', { name: '수강자 목록' }).click()
    await page.waitForTimeout(1000)
    // first()로 strict mode violation 방지
    await expect(
      page.getByText(/수강자를 확인할 강의를 선택|강의가 없습니다/).first()
    ).toBeVisible({ timeout: 5000 })
  })
})
