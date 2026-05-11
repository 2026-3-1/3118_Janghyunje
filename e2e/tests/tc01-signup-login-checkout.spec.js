import { test, expect } from '@playwright/test'

const timestamp = Date.now()
const testPw    = 'Test1234!'

// 회원가입 + 자동로그인 헬퍼
async function registerStudent(page, suffix) {
  const email = `s_${suffix}_${timestamp}@test.com`
  const nick  = `s_${suffix}_${timestamp}`
  await page.goto('/register')
  await page.getByRole('button', { name: /학생/ }).click()
  await page.getByPlaceholder('email@example.com').fill(email)
  await page.getByPlaceholder('게임 닉네임').fill(nick)
  await page.getByPlaceholder('4자 이상').fill(testPw)
  await page.getByPlaceholder('비밀번호 재입력').fill(testPw)
  await page.getByRole('button', { name: '회원가입' }).click()
  await expect(page).toHaveURL('http://localhost:5173/', { timeout: 15000 })
  return { email, nick }
}

test.describe('TC-01. 회원가입 → 로그인 → 강의 결제 흐름 (학생)', () => {

  test('회원가입 성공 및 자동 로그인', async ({ page }) => {
    await registerStudent(page, 'reg')
    // 자동로그인 후 token 저장 확인
    const token = await page.evaluate(() => localStorage.getItem('token'))
    expect(token).toBeTruthy()
    const user = await page.evaluate(() => JSON.parse(localStorage.getItem('user') || 'null'))
    expect(user?.role).toBe('student')
  })

  test('로그인 후 JWT 토큰 localStorage 저장 확인', async ({ page }) => {
    const { email } = await registerStudent(page, 'login')
    // 로그아웃 후 재로그인
    await page.evaluate(() => { localStorage.removeItem('token'); localStorage.removeItem('user') })
    await page.goto('/login')
    await page.getByPlaceholder('email@example.com').fill(email)
    await page.getByPlaceholder('비밀번호 입력').fill(testPw)
    await page.getByRole('button', { name: '로그인' }).click()
    await expect(page).toHaveURL('http://localhost:5173/', { timeout: 10000 })
    const token = await page.evaluate(() => localStorage.getItem('token'))
    expect(token).toBeTruthy()
    const user = await page.evaluate(() => JSON.parse(localStorage.getItem('user') || 'null'))
    expect(user?.role).toBe('student')
  })

  test('강의 상세에서 결제 페이지로 이동', async ({ page }) => {
    await registerStudent(page, 'checkout')
    await page.goto('/lectures')
    await page.waitForSelector('.grid', { timeout: 10000 })

    // 첫 강의 클릭
    await page.locator('.grid > div').first().click()
    await expect(page).toHaveURL(/\/lectures\/\d+/, { timeout: 10000 })

    // 이미 수강 중이면 다른 강의로
    const enrolled = await page.getByText('수강 중').isVisible().catch(() => false)
    if (!enrolled) {
      // "💳 바로 결제하기" 버튼
      await page.getByRole('button', { name: /바로 결제하기/ }).click()
      await expect(page).toHaveURL('http://localhost:5173/checkout', { timeout: 10000 })
      await expect(page.getByText('결제하기').first()).toBeVisible()
    }
  })

  test('결제 완료 후 마이페이지에 수강 중 표시', async ({ page }) => {
    await registerStudent(page, 'pay')
    await page.goto('/lectures')
    await page.waitForSelector('.grid', { timeout: 10000 })
    await page.locator('.grid > div').first().click()
    await expect(page).toHaveURL(/\/lectures\/\d+/, { timeout: 10000 })

    const enrolled = await page.getByText('수강 중').isVisible().catch(() => false)
    if (enrolled) return // 이미 수강 중이면 스킵

    await page.getByRole('button', { name: /바로 결제하기/ }).click()
    await expect(page).toHaveURL('http://localhost:5173/checkout', { timeout: 10000 })

    await page.getByRole('checkbox').click()
    await page.getByRole('button', { name: /원 결제하기/ }).click()
    await expect(page.getByText('결제 완료!')).toBeVisible({ timeout: 10000 })

    await page.getByRole('button', { name: '내 수강 목록' }).click()
    await expect(page).toHaveURL('http://localhost:5173/mypage', { timeout: 10000 })
    await expect(page.getByText('수강 중').first()).toBeVisible()
  })
})
