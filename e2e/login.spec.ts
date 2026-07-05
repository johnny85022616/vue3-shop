import { test, expect } from '@playwright/test'

test('登出狀態下前往購物車，自動跳登入，登入後返回購物車', async ({ page, context }) => {
  await context.clearCookies()

  await page.goto('/cart')
  await expect(page).toHaveURL(/\/login\?redirect=/)

  await page.click('button[type="submit"]')
  await expect(page).toHaveURL('/cart')

  await page.pause()
})
