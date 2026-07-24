# product-detail Specification

## Purpose

商品詳情能力：依路由 id 取得並展示單一商品的完整資訊，允許用戶選擇數量後將商品加入購物車，並在商品不存在時導回或顯示錯誤。

## Requirements

### Requirement: 顯示商品詳情
系統 SHALL 根據路由 id 取得商品資料，並顯示完整商品資訊（圖片、名稱、價格、分類、評分、庫存、描述）。

#### Scenario: 進入商品詳情頁
- **WHEN** 用戶進入 `/products/:id`
- **THEN** 系統顯示對應商品的完整資訊

#### Scenario: 商品不存在
- **WHEN** id 對應的商品不存在
- **THEN** 導回首頁或顯示錯誤頁

### Requirement: 加入購物車
系統 SHALL 允許用戶在商品詳情頁選擇數量後，觸發加入購物車流程（加入前的登入把關由 auth 能力規範，加入後的合併與持久化由 cart 能力規範）。

#### Scenario: 選擇數量並加入
- **WHEN** 已通過登入把關的用戶選擇數量並點擊「加入購物車」
- **THEN** 依所選數量觸發加入購物車，Navbar 的購物車數量 badge 更新
