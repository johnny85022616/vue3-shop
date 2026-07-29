---
name: e2e
description: 啟動 vue3-shop 的 dev server 並執行 Playwright e2e 測試；也用來判斷一項變更該用 e2e 還是 Vitest 單元測試驗證。
---

# vue3-shop e2e 測試

## 啟動流程

直接執行 `npx playwright test`。[playwright.config.ts](../../../playwright.config.ts) 設定了 `webServer`，會自動偵測 `http://localhost:5173` 是否已有 server 在跑（有的話沿用，沒有則自動啟動 `npm run dev` 並等待 ready），測試結束後也會自行處理，不需要手動起停 dev server。

- 設定是 `headless: false, slowMo: 800`：會跳出真實瀏覽器視窗、慢速播放。在沒有 GUI 的環境（純 CLI/遠端 sandbox）下可能無法執行，執行前先確認當下環境是否支援。

## 何時用 e2e，何時 Vitest 就夠

判斷的核心切線不是「這是不是 function/computed」，而是**這個行為能不能在 jsdom（模擬瀏覽器的假環境）裡驗證出來，不需要真實瀏覽器、不需要真的跨頁跳轉**——能就用 Vitest（jsdom），不能才需要 Playwright。

jsdom 這一側再依「要不要 mount 元件」分成兩層——**純邏輯 unit** 與 **component test**。兩者都跑在 Vitest/jsdom，對 [openspec-apply](../openspec-apply/SKILL.md) 而言**同屬 `unit` tag**（那份 skill 的 `unit` 定義就是「能在 jsdom 驗證的行為」，涵蓋這兩層）；這裡分層只是把成本與寫法講清楚，不改變 tag 歸屬。

| 層級 | 變更類型 | 用什麼驗證 | 原因 |
|---|---|---|---|
| **純邏輯 unit** | 不需 mount 任何元件就能驗的純邏輯：單一 function／computed／store getter（如 `useCartStore` 的 `totalPrice`、`useProductList` 的分頁邏輯），或不依賴生命周期的 composable。碰到 async / 打 API 的 store action 也在這層，但**要 mock 掉網路層**（`vi.mock`），斷言「拿到資料後 state 怎麼變、loading/error 三態」 | Vitest（jsdom），直接呼叫、不 mount | 純資料進出，最快最穩 |
| **component test** | 要 mount 單一元件才驗得出、但**不跨頁**的行為：<br>・依賴生命週期（`onMounted`）或 `provide-inject` 的 composable<br>・狀態／API 驅動的 DOM 與樣式變化（如 `v-if` 顯隱、收藏後愛心變紅）<br>・元件互動後的 state／DOM 結果 | Vitest（jsdom）+ `@vue/test-utils` mount，`trigger` 後斷言 DOM/class 或 state 結果 | 需渲染環境但仍在 jsdom、免真瀏覽器；比純邏輯重 |
| **e2e** | 跨頁流程／路由跳轉／多個 view + store 互動（如未登入導去登入頁再導回、加入購物車 → 結帳 → 送出訂單）。注意：router guard 的**判斷邏輯**（給假 auth state、斷言算出的 redirect target）可留在純邏輯 unit；只有「真的跳過去成不成功」才升 e2e | Playwright e2e | 只有在真實導航與元件互相配合下才觀察得到，jsdom 測不出來 |
| **不用測** | 純視覺／版面調整，且**沒有條件邏輯**（Tailwind class、排版、字體、配色微調這種不由狀態或資料決定的） | 都不用，直接開瀏覽器肉眼確認 | 沒有邏輯可斷言；但若樣式/顯示由狀態或資料驅動，不算這類，歸上面 component test |

**分不出來時的預設傾向**：有可獨立斷言的行為，就往成本低的那層寫（純邏輯 unit ＞ component test），只有真的需要跨頁協作才升 e2e。真的判斷不了再問使用者，不要默默跳過。

**已被既有 spec 涵蓋的改動**：只跑對應那一支 spec，不用跑全部，保持回饋速度快。

## 現況

- 目前只有一支 spec：[cart.spec.ts](../../../e2e/cart.spec.ts)（cart 持久化：已登入狀態下加入商品，重整瀏覽器後購物車仍在）。這是專案第一支 e2e。
