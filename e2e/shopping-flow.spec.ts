import { test, expect } from '@playwright/test'

test('購物主線流程：瀏覽商品 → 加入購物車 → 結帳 → 送出訂單', async ({ page, context }) => {
  await context.clearCookies()

  // 1. 前往商品列表，點擊第一個商品（ProductCard 是 div + click 導轉，不是 <a>）
  await page.goto('/products')
  await page.waitForSelector('.product-card')
  await page.locator('.product-card').first().click()
  await expect(page).toHaveURL(/\/products\/\d+/)

  // 2. 點加入購物車 → 未登入，自動跳至登入頁
  await page.getByRole('button', { name: '加入購物車' }).click()
  await expect(page).toHaveURL(/\/login\?redirect=/)

  // 3. 登入 → 自動返回單品頁（Navbar 也有一個「登入」按鈕，需限定送出按鈕避免 strict mode 衝突）
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/products\/\d+/)

  // 4. 再次點加入購物車 → 出現成功提示
  await page.getByRole('button', { name: '加入購物車' }).click()
  await expect(page.getByText('已加入購物車 ✓')).toBeVisible()

  // 5. 前往購物車
  await page.goto('/cart')
  await expect(page.getByText('前往結帳')).toBeVisible()

  // 6. 前往訂單確認頁
  await page.getByText('前往結帳').click()
  await expect(page).toHaveURL('/order')

  // 7. 確認送出
  await page.getByRole('button', { name: '確認送出' }).click()
  await expect(page.getByText('訂單已送出')).toBeVisible()
})
