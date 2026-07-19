## Why

目前購物者沒有辦法把「有興趣但還沒要買」的商品先存起來，每次回訪都得重新搜尋。收藏清單（Wishlist）讓使用者可以把商品加入書籤、之後再回來看、想買時再放進購物車——這是提升回訪率與轉換率的低摩擦做法。

## What Changes

- 為商品加上**收藏切換**（收藏／取消收藏），同時出現在商品卡片（列表）與商品詳情頁。
- 將收藏狀態存進 **localStorage**，讓收藏在重新整理後仍保留，且不需登入（沿用既有購物車的持久化慣例）。
- 新增**收藏清單頁**（`/wishlist`），列出所有已收藏的商品，並可**逐項移除**。
- 每個收藏項目提供**加入購物車**按鈕。按下時沿用既有的加入購物車流程：以 `hasFaToken()` 檢查登入，若未登入則帶著 `redirect` query 導向登入頁。
- 在導覽列加入收藏清單入口與（選用的）數量徽章（沿用既有購物車徽章樣式）。

## Capabilities

### New Capabilities
- `wishlist`: 收藏商品（切換開／關）、檢視收藏清單、移除項目、以 localStorage 持久化收藏，以及在既有登入把關的加入購物車流程下，把已收藏商品加入購物車。

### Modified Capabilities
<!-- openspec/specs/ 中沒有既有規格，無須修改。 -->

## Impact

- **新增檔案**：`src/stores/wishlist.ts`、`src/composables/useWishlist.ts`、`src/views/WishlistView.vue`（若抽出收藏切換元件則另計）。
- **修改檔案**：`src/components/ProductCard.vue`（收藏切換覆蓋層）、`src/views/ProductDetailView.vue`（收藏切換按鈕）、`src/components/Navbar.vue`（導覽入口／徽章）、`src/router/index.ts`（新增 `/wishlist` 路由）。
- **重用、不修改**：`src/utils/auth.ts`（`hasFaToken`）、`Login` 路由與 `redirect` query 流程、`src/composables/useCart.ts`（`addItem`）。
- **儲存**：新增 localStorage key `wishlist`（與 `cart` 分開）。
- **相依套件**：不新增——沿用既有 Vue 3 / Pinia / vue-router 技術棧。
