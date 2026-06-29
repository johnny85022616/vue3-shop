## ADDED Requirements

### Requirement: 顯示購物車內容
系統 SHALL 顯示所有已加入的商品，包含圖片、名稱、單價、數量、小計，以及總金額。

#### Scenario: 購物車有商品
- **WHEN** 用戶進入 `/cart`
- **THEN** 顯示所有購物車商品及總金額

#### Scenario: 購物車為空
- **WHEN** 購物車沒有任何商品
- **THEN** 顯示「購物車是空的」提示與返回商品列表的連結

### Requirement: 調整商品數量
系統 SHALL 允許用戶增加或減少購物車中商品的數量。

#### Scenario: 增加數量
- **WHEN** 用戶點擊「+」
- **THEN** 該商品數量加一，小計與總金額即時更新

#### Scenario: 減少數量至零
- **WHEN** 用戶點擊「-」且數量為 1
- **THEN** 該商品從購物車移除

### Requirement: 移除商品
系統 SHALL 允許用戶從購物車移除單一商品。

#### Scenario: 點擊移除
- **WHEN** 用戶點擊某商品的移除按鈕
- **THEN** 該商品從購物車移除，總金額更新

### Requirement: 購物車狀態持久化
系統 SHALL 將購物車資料存入 localStorage，頁面重整後資料仍保留。

#### Scenario: 重整頁面
- **WHEN** 用戶重整瀏覽器
- **THEN** 購物車商品仍然存在
