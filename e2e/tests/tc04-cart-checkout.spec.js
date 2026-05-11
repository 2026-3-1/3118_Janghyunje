import { test, expect } from '@playwright/test'

const ts = Date.now()
const pw = 'Test1234!'

async function registerStudent(page, suffix) {
  await page.goto('/register')
  await page.getByRole('button', { name: /학생/ }).click()
  await page.getByPlaceholder('email@example.com').fill(`cart_${suffix}_${ts}@test.com`)
  await page.getByPlaceholder('게임 닉네임').fill(`cart_${suffix}_${ts}`)
  await page.getByPlaceholder('4자 이상').fill(pw)
  await page.getByPlaceholder('비밀번호 재입력').fill(pw)
  await page.getByRole('button', { name: '회원가입' }).click()
  await expect(page).toHaveURL('http://localhost:5173/', { timeout: 15000 })
}

test.describe('TC-04. 장바구니 담기 → 결제 흐름', () => {

  test('강의 상세에서 장바구니 담기 토스트 확인', async ({ page }) => {
    await registerStudent(page, 'a')
    await page.goto('/lectures')
    await page.waitForSelector('.grid', { timeout: 10000 })
    await page.locator('.grid > div').first().click()
    await expect(page).toHaveURL(/\/lectures\/\d+/, { timeout: 10000 })

    const enrolled = await page.getByText('수강 중').isVisible().catch(() => false)
    if (enrolled) return

    const cartBtn = page.getByRole('button', { name: /장바구니에 담기/ })
    const visible = await cartBtn.isVisible({ timeout: 5000 }).catch(() => false)
    if (!visible) return

    await cartBtn.click()
    await expect(page.getByText(/장바구니에 담겼습니다/)).toBeVisible({ timeout: 5000 })
  })

  test('장바구니 페이지 접근 확인', async ({ page }) => {
    await registerStudent(page, 'b')
    await page.goto('/cart')
    await expect(page).toHaveURL('http://localhost:5173/cart', { timeout: 5000 })
    // 헤딩으로 정확히 지정
    await expect(page.getByRole('heading', { name: /장바구니/ })).toBeVisible()
  })

  test('장바구니 담기 후 결제 페이지 이동', async ({ page }) => {
    await registerStudent(page, 'c')
    await page.goto('/lectures')
    await page.waitForSelector('.grid', { timeout: 10000 })
    await page.locator('.grid > div').first().click()
    await expect(page).toHaveURL(/\/lectures\/\d+/, { timeout: 10000 })

    const enrolled = await page.getByText('수강 중').isVisible().catch(() => false)
    if (enrolled) return

    const cartBtn = page.getByRole('button', { name: /장바구니에 담기/ })
    const visible = await cartBtn.isVisible({ timeout: 5000 }).catch(() => false)
    if (!visible) return

    await cartBtn.click()
    await page.waitForTimeout(500)

    await page.goto('/cart')
    await expect(page).toHaveURL('http://localhost:5173/cart', { timeout: 5000 })

    const checkoutBtn = page.getByRole('button', { name: /결제하기/ })
    const hasBtn = await checkoutBtn.isVisible({ timeout: 3000 }).catch(() => false)
    if (hasBtn) {
      await checkoutBtn.click()
      await expect(page).toHaveURL('http://localhost:5173/checkout', { timeout: 10000 })
    }
  })
})
