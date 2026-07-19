## Context

本商店是 Vue 3.3 + Pinia + vue-router 的 SPA。購物車已經建立了收藏清單所需的所有模式：

- **狀態 + 持久化**：`src/stores/cart.ts` 是 setup 風格的 Pinia store（`defineStore('cart', () => {...})`），會自行從 localStorage 初始化，並透過 `watch(items, ..., { deep: true })` 自動寫回。它由一個薄薄的 composable `src/composables/useCart.ts` 以 `storeToRefs` 包裝。
- **登入把關動作**：`src/views/ProductDetailView.vue` 的 `handleAddToCart` 以 `hasFaToken()`（cookie-based，來自 `src/utils/auth.ts`）檢查登入；若為 false 則執行 `router.push({ name: 'Login', query: { redirect: route.fullPath } })` 並 return；否則呼叫 `addItem`。
- **資料形狀**：`Product` = `{ id, title, description, category, price, rating, thumbnail, images[] }`。購物車持久化的是精簡後的 `CartItem` = `{ id, title, price, image, quantity }`（注意 `image` 由 `thumbnail` 映射而來）。

收藏清單沿用這些模式，而非另立新的做法。

## Goals / Non-Goals

**Goals:**
- 可從商品卡片與商品詳情頁切換收藏開／關。
- 以專屬 `wishlist` key 將收藏持久化於 localStorage，且未登入也能運作。
- 提供 `/wishlist` 頁面可檢視與移除收藏。
- 每個收藏項目的加入購物車按鈕，完全沿用既有的登入把關 + 導向流程。

**Non-Goals:**
- 伺服器端／依帳號同步的收藏（收藏維持在裝置本機的 localStorage）。
- 將收藏清單頁本身擋在登入之後（只有加入購物車動作需把關）。
- 收藏清單上的數量選擇（加入購物車固定數量 1，與卡片層級加入一致）。
- 任何既有資料的合併或遷移。

## Decisions

**1. 收藏清單儲存完整的 `Product` 物件，而非精簡形狀。**
收藏清單頁需要渲染商品細節（圖片、標題、價格），也需要一個夠完整的物件交給 `addItem`。購物車用的是精簡的 `CartItem`，但收藏切換的來源（`ProductCard`、`ProductDetailView`）本來就已握有完整的 `Product`。儲存完整的 `Product` 能讓切換的呼叫端保持簡單，也讓加入購物車動作擁有 `addItem` 所需的一切。*考慮過的替代方案：* 儲存像 `CartItem` 的精簡形狀——因為會迫使加入購物車前重新抓取或重塑資料、並使切換呼叫端複雜化而否決。

**2. 新增 Pinia store `wishlist.ts` + composable `useWishlist.ts`，完全複製購物車慣例。**
setup 風格 store，`ref<Product[]>([])`，`initializeWishlist()` 於 try/catch 內讀取 `localStorage.getItem('wishlist')`，以及 `watch(items, ..., { deep: true })` 寫回。Actions：`toggleItem(product)`、`addToWishlist(product)`、`removeItem(id)`、`isFavorite(id)`（computed 回傳的 helper 或 getter）、`clearWishlist()`。`useWishlist` composable 以 `storeToRefs` 曝露響應式狀態並解構 actions，比照 `useCart`。*考慮過的替代方案：* 通用的 localStorage 工具函式——為與既有「各 store 自管持久化」模式一致而否決。

**3. 收藏清單頁路由「不」設 `requiresAuth`。**
收藏是裝置本機的、登出時也可使用，因此 `/wishlist` 是公開路由。只有各項目的加入購物車動作才做 `hasFaToken()` 檢查。*考慮過的替代方案：* 將路由標為 `requiresAuth: true`，透過全域守衛免費取得導向——因為那會錯誤地擋住登出使用者檢視自己的收藏而否決。

**4. 收藏清單的加入購物車完全沿用 `handleAddToCart` 的邏輯。**
在 `WishlistView.vue`：`if (!hasFaToken()) { router.push({ name: 'Login', query: { redirect: route.fullPath } }); return } addItem({ ...product, quantity: 1 })`。因為 `route.fullPath` 是 `/wishlist`，登入後的 redirect 會把使用者帶回收藏清單頁。此行為與商品詳情頁流程一致，滿足「相同加入購物車流程」的需求。

**5. 收藏控制項的擺放位置。**
- `ProductCard.vue`：疊在圖片上的愛心切換；其點擊處理必須用 `.stop`，因為卡片根節點有導向詳情頁的 `@click`。
- `ProductDetailView.vue`：放在既有「加入購物車」按鈕旁（該 view 已 import `hasFaToken`、`useRoute`、`useRouter`）。
- `Navbar.vue`：收藏清單入口，選用的數量徽章可比照既有購物車徽章模式。

## Risks / Trade-offs

- **[收藏不跨裝置／帳號同步]** → 接受；與購物車既有的裝置本機模式一致，並讓範圍維持精簡。伺服器同步可作為後續變更。
- **[localStorage 中儲存完整 `Product` 物件會增加負載]** → 在一般收藏清單規模下風險低；可接受，且與購物車既有的逐項儲存方式一致。
- **[cookie-based 認證不具響應性]** → 加入購物車的檢查在點擊當下讀取 `hasFaToken()`，因此永遠是最新的；把關本身不需要響應式認證狀態。若導覽列的收藏徽章需對登入／登出響應，則沿用 `Navbar.vue` 既有的 `watch(route.fullPath, ...)` 重新同步模式。
- **[收藏清單中的商品資料過時]** → 已儲存商品的價格可能與即時目錄不同步。此範圍下接受；收藏清單反映的是收藏當下的商品。
