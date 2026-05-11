import { test, expect } from '@playwright/test'

const ts  = Date.now()
const pw  = 'Test1234!'

async function registerStudent(page, suffix) {
  await page.goto('/register')
  await page.getByRole('button', { name: /학생/ }).click()
  await page.getByPlaceholder('email@example.com').fill(`s_${suffix}_${ts}@test.com`)
  await page.getByPlaceholder('게임 닉네임').fill(`s_${suffix}_${ts}`)
  await page.getByPlaceholder('4자 이상').fill(pw)
  await page.getByPlaceholder('비밀번호 재입력').fill(pw)
  await page.getByRole('button', { name: '회원가입' }).click()
  await expect(page).toHaveURL('http://localhost:5173/', { timeout: 15000 })
  const user = await page.evaluate(() => JSON.parse(localStorage.getItem('user') || 'null'))
  expect(user?.role).toBe('student')
}

test.describe('TC-03. 학생이 코치 전용 페이지 접근 차단', () => {

  test('코치 대시보드 → / 리다이렉트', async ({ page }) => {
    await registerStudent(page, 'a')
    await page.goto('/coach/dashboard')
    await expect(page).toHaveURL('http://localhost:5173/', { timeout: 5000 })
  })

  test('강의 등록 페이지 → / 리다이렉트', async ({ page }) => {
    await registerStudent(page, 'b')
    await page.goto('/coach/lecture/new')
    await expect(page).toHaveURL('http://localhost:5173/', { timeout: 5000 })
  })

  test('학생 전용 페이지는 정상 접근', async ({ page }) => {
    await registerStudent(page, 'c')
    await page.goto('/mypage')
    await expect(page).toHaveURL('http://localhost:5173/mypage', { timeout: 5000 })
    await page.goto('/cart')
    await expect(page).toHaveURL('http://localhost:5173/cart', { timeout: 5000 })
    await page.goto('/growth')
    await expect(page).toHaveURL('http://localhost:5173/growth', { timeout: 5000 })
  })
})
