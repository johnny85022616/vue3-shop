---
name: e2e
description: 啟動 vue3-shop 的 dev server 並執行 Playwright e2e 測試；也用來判斷一項變更該用 e2e 還是 Vitest 單元測試驗證。
---

# vue3-shop e2e 測試

## 啟動流程

直接執行 `npx playwright test`。[playwright.config.ts](../../../playwright.config.ts) 設定了 `webServer`，會自動偵測 `http://localhost:5173` 是否已有 server 在跑（有的話沿用，沒有則自動啟動 `npm run dev` 並等待 ready），測試結束後也會自行處理，不需要手動起停 dev server。

- 設定是 `headless: false, slowMo: 800`：會跳出真實瀏覽器視窗、慢速播放。在沒有 GUI 的環境（純 CLI/遠端 sandbox）下可能無法執行，執行前先確認當下環境是否支援。

## 何時用 e2e，何時 Vitest 就夠

判斷的關鍵不是「這是不是 function/computed」，而是**這個行為能不能在 jsdom（模擬瀏覽器的假環境）裡驗證出來，不需要真實瀏覽器、不需要真的跨頁跳轉**——能就用 Vitest，不能才需要 Playwright。

| 變更類型 | 用什麼驗證 | 原因 |
|---|---|---|
| 不需要真實瀏覽器/跨頁就能驗證的行為：單一 function／computed／store getter 邏輯（如 `useCartStore` 的 `totalPrice`、`useProductList` 的分頁邏輯），或單頁內由狀態／API 回傳值驅動的顯示/樣式變化（`v-if`、條件 class，例如收藏後愛心變紅、某個 key 決定區塊顯示/隱藏），或單一元件 mount 起來就能斷言的互動（`@click` 有沒有呼叫對的 action、`.stop` 有沒有阻止事件冒泡到父層而誤觸導航） | Vitest 單元測試（後兩者需搭配 `@vue/test-utils` mount component 斷言 DOM/class、或用 spy 驗 `$router.push`／action 呼叫） | 邏輯可在 jsdom 裡獨立驗證，不需真實瀏覽器，跑得快 |
| 跨頁流程／路由跳轉／多個 view + store 互動（如未登入時導去登入頁再導回、加入購物車 → 結帳 → 送出訂單） | Playwright e2e | 這類行為只有在真實導航與元件互相配合下才能觀察到，Vitest 的 jsdom 環境測不出來 |
| 純視覺／版面調整，且**沒有條件邏輯**（Tailwind class、排版、字體大小、配色微調這種不是由狀態或資料決定的調整） | 都不用，直接開瀏覽器肉眼確認 | 沒有邏輯可斷言，e2e/Vitest 都測不出「好不好看」；但若樣式/顯示是由狀態或資料驅動，不算這類，見上面第一行 |
| 改動剛好落在既有 spec 涵蓋的流程內 | 只跑對應那一支 spec，不用跑全部 | 保持回饋速度快 |

## 現況

- 目前只有一支 spec：[cart.spec.ts](../../../e2e/cart.spec.ts)（cart 持久化：已登入狀態下加入商品，重整瀏覽器後購物車仍在）。這是專案第一支 e2e。
