## Context

全新獨立作品集專案，位於 `/Users/johnny_chang/Desktop/Project/vue3-shop`。
已完成基礎建置：Vite 4 專案骨架、安裝 vue-router@4、pinia、axios、tailwindcss@3。
已建立：`main.js`（掛載 Pinia + Router）、`App.vue`、`router/index.js`。

## Goals / Non-Goals

**Goals:**
- 展示 Vue 3 Composition API + Setup Store 的掌握
- 完整購物流程：瀏覽 → 詳情 → 加入購物車 → 結帳
- 購物車狀態以 localStorage 手動持久化（不依賴套件）
- 使用 composables 封裝業務邏輯，展示程式碼組織能力
- Tailwind CSS 刻 UI，不使用 component library

**Non-Goals:**
- 登入 / 會員系統
- 真實後端 / 金流串接
- TypeScript
- 單元測試

## Decisions

### 1. Pinia Setup Store 而非 Options Store
採用 Setup Store（`defineStore('id', () => { ... })`），風格與 Vue 3 Composition API 一致，面試官能直觀看出對 Composition API 的熟悉度。

### 2. localStorage 手動持久化
購物車資料在 store 初始化時從 localStorage 讀取，每次變動時手動 `localStorage.setItem`。不引入 `pinia-plugin-persistedstate`，可在面試中說明「理解底層機制」。

### 3. composables 封裝 API 呼叫
- `useProduct()`：封裝商品列表、詳情、搜尋等 API 呼叫，並管理 loading / error 狀態
- `useCart()`：封裝購物車操作邏輯（加入、移除、更新數量）

### 4. Axios instance 集中管理
`src/api/product.js` 建立統一的 axios instance（baseURL 設為 DummyJSON），所有 API 呼叫從此模組 export，方便日後維護。

### 5. 路由結構
| 路徑 | 頁面 |
|------|------|
| `/` | HomeView |
| `/products` | ProductListView |
| `/products/:id` | ProductDetailView |
| `/cart` | CartView |
| `/order` | OrderView |

所有頁面元件採 lazy import（`() => import(...)`），實現 code splitting。

## Risks / Trade-offs

- **DummyJSON API 不穩定** → 僅作品展示用途，可接受；必要時可改用本地 mock 資料
- **Node 16 限制** → 部分套件需鎖定舊版（tailwindcss@3、vite@4），已確認相容
- **無 TypeScript** → 降低開發摩擦，但缺乏型別保護；面試前可補充說明取捨原因
