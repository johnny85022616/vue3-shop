## 1. 收藏清單 store 與 composable

- [ ] 1.1 建立 `src/stores/wishlist.ts` 為 setup 風格的 Pinia store（`defineStore('wishlist', () => {...})`），持有 `ref<Product[]>([])`，比照 `src/stores/cart.ts` 慣例。
- [ ] 1.2 新增 `initializeWishlist()`，於 try/catch 內讀取 `localStorage.getItem('wishlist')`（遺失／損毀時為空），並以 `watch(items, ..., { deep: true })` 寫回 `wishlist` key；於 store 設定時呼叫 `initializeWishlist()`。
- [ ] 1.3 實作 actions／helpers：`isFavorite(id)`、`addToWishlist(product)`、`removeItem(id)`、`toggleItem(product)`、`clearWishlist()`，以及 `itemCount` computed。
- [ ] 1.4 建立 `src/composables/useWishlist.ts`，以 `storeToRefs` 包裝 store 狀態並解構 actions，比照 `src/composables/useCart.ts`。

## 2. 路由與導覽

- [ ] 2.1 在 `src/router/index.ts` 新增 `/wishlist` 路由（name `'Wishlist'`、lazy-import `WishlistView.vue`、`meta.title`／`description`），且**不**設 `requiresAuth`。
- [ ] 2.2 在 `src/components/Navbar.vue` 新增收藏清單入口，選用的數量徽章比照既有購物車徽章模式。

## 3. 商品介面上的收藏切換

- [ ] 3.1 在 `src/components/ProductCard.vue` 加上愛心收藏切換覆蓋層，綁定 `isFavorite`／`toggleItem`，點擊處理使用 `.stop` 以免觸發卡片導向詳情頁。
- [ ] 3.2 在 `src/views/ProductDetailView.vue` 的「加入購物車」按鈕旁加上收藏切換，綁定 `isFavorite`／`toggleItem`。

## 4. 收藏清單頁

- [ ] 4.1 建立 `src/views/WishlistView.vue`，從 `useWishlist` 列出已收藏商品（圖片、標題、價格），清單為空時顯示空狀態訊息。
- [ ] 4.2 每個項目加上移除控制項，呼叫 `removeItem(id)`。
- [ ] 4.3 每個項目加上加入購物車按鈕，其處理檢查 `hasFaToken()`；未登入則 `router.push({ name: 'Login', query: { redirect: route.fullPath } })` 並 return；否則透過 `useCart` 執行 `addItem({ ...product, quantity: 1 })`。
