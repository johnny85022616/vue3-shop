import { test, expect } from '@playwright/test'

// 層級：e2e（e2e skill 決策表）——jsdom 無法真的重整瀏覽器，此行為只有真實 app 啟動
// + reload 才驗得出，故用 Playwright。
// 對應 capability：cart（openspec/specs/cart/spec.md）。
//
// Requirement 購物車狀態持久化 / Scenario 重整頁面：
//   WHEN 用戶重整瀏覽器 THEN 購物車商品仍然存在
//
// 前提：/cart 依 auth spec「受保護頁面的存取把關」需登入才能進入（未登入會被導向登入
// 頁），故先 seed 一個 FA_TOKEN cookie 使其處於「已登入」狀態——這是 auth spec 定義、
// 能合法進到 /cart 的前提，不是繞過守衛。「未登入進 /cart 會被導走」屬 auth capability
// 的 e2e，不在此。購物車資料存在 localStorage 的 'cart' key；本測試直接 seed
// localStorage 提供初始購物車（不走登入 UI / 商品 API），聚焦觀察 app 啟動與重整後購
// 物車是否仍在。
test('重整瀏覽器後購物車商品仍然存在', async ({ page }) => {
  const seededCart = [
    { id: 1, title: 'E2E 測試商品', price: 100, image: 'https://example.com/thumb.png', quantity: 2 },
  ]

  // 先設定登入憑證 cookie，讓 /cart 的守衛（requiresAuth）放行
  await page.context().addCookies([
    { name: 'FA_TOKEN', value: 'e2e-token', url: 'http://localhost:5173' },
  ])

  // 進站建立 origin，才能寫入該 origin 的 localStorage
  await page.goto('/')
  await page.evaluate((cart) => {
    localStorage.setItem('cart', JSON.stringify(cart))
  }, seededCart)

  // 進購物車頁：真實 app 啟動時應從 localStorage 讀回並顯示（Vitest 證不到這段接線）
  // CartView 同時渲染手機版與桌機版兩份內容（CSS 切換顯示），故用 visible 過濾出當前
  // viewport 實際顯示的那一份，避免 strict mode 撞到 2 個元素。
  await page.goto('/cart')
  await expect(page.getByText('E2E 測試商品').filter({ visible: true })).toBeVisible()
  await expect(page.getByText('購物車是空的')).toHaveCount(0)

  // 重整瀏覽器：購物車商品仍然存在
  await page.reload()
  await expect(page.getByText('E2E 測試商品').filter({ visible: true })).toBeVisible()
  await expect(page.getByText('購物車是空的')).toHaveCount(0)
})
