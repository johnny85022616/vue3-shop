# product-list Specification

## Purpose

商品列表能力：從 DummyJSON API 取得商品並以卡片列表呈現，支援依分類篩選與關鍵字搜尋，並處理載入中、載入失敗與無結果等狀態。

## Requirements

### Requirement: 顯示商品列表
系統 SHALL 從 DummyJSON API 取得商品並以卡片形式顯示，每張卡片包含商品圖片、名稱、價格與評分。

#### Scenario: 進入商品列表頁
- **WHEN** 用戶進入 `/products`
- **THEN** 系統顯示商品卡片列表，並呈現載入中狀態直到資料回傳

#### Scenario: 商品載入失敗
- **WHEN** API 呼叫失敗
- **THEN** 系統顯示錯誤提示訊息

### Requirement: 依分類篩選商品
系統 SHALL 允許用戶選擇分類，篩選後只顯示該分類的商品。

#### Scenario: 選擇分類
- **WHEN** 用戶點選某個分類標籤
- **THEN** 商品列表更新為該分類的商品

#### Scenario: 選擇「全部」
- **WHEN** 用戶點選「全部」分類
- **THEN** 顯示所有商品

### Requirement: 搜尋商品
系統 SHALL 提供關鍵字搜尋，使用者在搜尋框輸入關鍵字並按 Enter 後，列表 SHALL 更新為符合該關鍵字的商品。

#### Scenario: 輸入搜尋關鍵字並送出
- **WHEN** 用戶在搜尋框輸入文字並按 Enter
- **THEN** 商品列表更新為符合關鍵字的結果

#### Scenario: 搜尋無結果
- **WHEN** 搜尋結果為空
- **THEN** 顯示「找不到符合的商品」提示
