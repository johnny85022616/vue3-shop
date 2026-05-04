## Why

建立一個 Vue 3 電商作品集專案，作為面試展示用途。透過實作完整的購物流程，展示 Vue 3 Composition API、Vue Router、Pinia 狀態管理的掌握程度，並搭配 DummyJSON 公開 API 模擬真實電商資料。

## What Changes

- **新增** 首頁（Banner + 分類導覽）
- **新增** 商品列表頁（分類篩選、搜尋、分頁）
- **新增** 商品詳情頁（商品資訊、加入購物車）
- **新增** 購物車頁（商品管理、數量調整、小計計算）
- **新增** 訂單確認頁（結帳摘要、清空購物車）
- **新增** 共用 Navbar 元件（導覽列 + 購物車數量 badge）
- **新增** API 模組（封裝 DummyJSON 呼叫）
- **新增** Pinia cart store（購物車狀態 + localStorage 持久化）
- **新增** composables（`useProduct`、`useCart`）

## Capabilities

### New Capabilities

- `product-list`: 商品列表，支援分類篩選與關鍵字搜尋
- `product-detail`: 商品詳情展示與加入購物車
- `cart`: 購物車狀態管理，含數量調整、移除、小計與 localStorage 持久化
- `order-summary`: 訂單確認頁，展示選購商品並完成結帳流程

### Modified Capabilities

（無，此為全新專案）

## Impact

- **新專案**：`/Users/johnny_chang/Desktop/Project/vue3-shop`
- **技術棧**：Vue 3、Vue Router 4、Pinia、Axios、Tailwind CSS 3、Vite 4
- **外部依賴**：DummyJSON API（`https://dummyjson.com`）
- **不影響**任何現有專案
