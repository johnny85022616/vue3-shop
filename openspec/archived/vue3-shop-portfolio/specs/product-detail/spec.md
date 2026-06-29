## ADDED Requirements

### Requirement: 顯示商品詳情
系統 SHALL 根據路由 id 取得商品資料，並顯示完整商品資訊（圖片、名稱、價格、分類、評分、庫存、描述）。

#### Scenario: 進入商品詳情頁
- **WHEN** 用戶進入 `/products/:id`
- **THEN** 系統顯示對應商品的完整資訊

#### Scenario: 商品不存在
- **WHEN** id 對應的商品不存在
- **THEN** 導回首頁或顯示錯誤頁

### Requirement: 加入購物車
系統 SHALL 允許用戶選擇數量後將商品加入購物車。

#### Scenario: 加入購物車
- **WHEN** 用戶點擊「加入購物車」
- **THEN** 商品加入 cart store，Navbar 的購物車數量 badge 更新

#### Scenario: 商品已在購物車中
- **WHEN** 用戶再次加入相同商品
- **THEN** 購物車中該商品數量累加，不新增重複項目
