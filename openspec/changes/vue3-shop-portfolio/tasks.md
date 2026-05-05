## 1. 基礎設定

- [x] 1.1 建立 Vite + Vue 3 專案，安裝 vue-router@4、pinia、axios、tailwindcss@3
- [x] 1.2 設定 tailwind.config.js content 路徑，style.css 加入 @tailwind directives
- [x] 1.3 main.js 掛載 Pinia 與 Vue Router
- [x] 1.4 App.vue 改為只放 `<RouterView />`
- [x] 1.5 建立 router/index.js，設定 5 個路由（懶載入）

## 2. API 模組

- [x] 2.1 建立 `src/api/product.js`，設定 axios instance（baseURL: dummyjson.com）
- [x] 2.2 實作 getProducts、getProductById、getCategories、getProductsByCategory、searchProducts

## 3. Pinia Store

- [x] 3.1 建立 `src/stores/cart.js`（Setup Store）
- [x] 3.2 實作 addItem（商品已存在則累加數量）
- [x] 3.3 實作 removeItem、updateQuantity
- [x] 3.4 實作 clearCart
- [x] 3.5 實作 totalPrice computed
- [x] 3.6 初始化時從 localStorage 讀取，每次變動時寫入 localStorage

## 4. Composables

- [x] 4.1 建立 `src/composables/useProductList.js`，封裝商品列表、分類、搜尋 API 與 loading/error 狀態（給 ProductListView、HomeView 使用）
- [x] 4.2 建立 `src/composables/useCart.js`，封裝購物車操作
- [x] 4.3 建立 `src/composables/useProductDetail.js`，封裝單一商品詳情 API 與 loading/error 狀態（給 ProductDetailView 使用）

## 5. 共用元件

- [x] 5.1 建立 `src/components/Navbar.vue`，包含 Logo、導覽連結、購物車 badge
- [x] 5.2 建立 `src/components/ProductCard.vue`，顯示商品圖片、名稱、價格、評分

## 6. 首頁

- [x] 6.1 建立 `src/views/HomeView.vue`，加入 Navbar
- [x] 6.2 實作 Banner 區塊
- [x] 6.3 實作分類導覽，點擊跳轉至商品列表並帶入分類參數

## 7. 商品列表頁

- [x] 7.1 建立 `src/views/ProductListView.vue`
- [x] 7.2 實作分類標籤篩選（含「全部」選項）
- [x] 7.3 實作關鍵字搜尋框
- [x] 7.4 實作載入中與錯誤狀態顯示
- [x] 7.5 商品卡片點擊跳轉至詳情頁

## 8. 商品詳情頁

- [ ] 8.1 建立 `src/views/ProductDetailView.vue`
- [ ] 8.2 從路由 params 取得 id，呼叫 API 取得商品資料
- [ ] 8.3 顯示完整商品資訊
- [ ] 8.4 實作數量選擇與「加入購物車」按鈕
- [ ] 8.5 商品不存在時導回首頁

## 9. 購物車頁

- [ ] 9.1 建立 `src/views/CartView.vue`
- [ ] 9.2 顯示購物車商品清單、小計、總金額
- [ ] 9.3 實作數量增減按鈕
- [ ] 9.4 實作移除商品按鈕
- [ ] 9.5 購物車為空時顯示提示與返回連結
- [ ] 9.6 「前往結帳」按鈕導向訂單確認頁

## 10. 訂單確認頁

- [ ] 10.1 建立 `src/views/OrderView.vue`
- [ ] 10.2 購物車為空時導回購物車頁（navigation guard）
- [ ] 10.3 顯示訂單摘要（商品、數量、總金額）
- [ ] 10.4 「確認送出」清空購物車並顯示成功訊息
