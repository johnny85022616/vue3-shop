# auth Specification

## Purpose

登入與存取把關能力：管理使用者登入狀態，對需登入的頁面與「加入購物車」動作做未登入導轉（帶 redirect），登入後返回原頁，並提供登出。此能力跨頁共用，供 cart、product-detail 等能力的加入購物車流程引用。

## Requirements

### Requirement: 使用者登入
系統 SHALL 提供登入頁，使用者完成登入後取得登入狀態，並持久於瀏覽器，使後續請求視為已登入。

#### Scenario: 登入成功
- **WHEN** 使用者在登入頁送出登入
- **THEN** 系統記錄為已登入狀態，並持久於瀏覽器

### Requirement: 受保護頁面的存取把關
系統 SHALL 對需登入的頁面（`/cart`、`/order`）做存取把關；未登入時 SHALL 導向登入頁，並於 query 帶上指向原目標頁的 `redirect`。

#### Scenario: 未登入進入購物車
- **WHEN** 未登入的使用者直接進入 `/cart`
- **THEN** 系統導向登入頁，並帶上 `redirect=/cart`

#### Scenario: 未登入進入訂單頁
- **WHEN** 未登入的使用者直接進入 `/order`
- **THEN** 系統導向登入頁，並帶上 `redirect=/order`

#### Scenario: 已登入正常進入
- **WHEN** 已登入的使用者進入受保護頁面
- **THEN** 系統正常顯示該頁，不導向登入頁

### Requirement: 加入購物車動作的登入把關
系統 SHALL 在使用者觸發「加入購物車」時，若未登入則不執行加入，改為導向登入頁並帶上可返回原頁的 `redirect`。此把關供所有加入購物車的入口（商品詳情頁、收藏清單頁等）共用。

#### Scenario: 未登入時加入購物車
- **WHEN** 未登入的使用者觸發加入購物車
- **THEN** 系統不將商品加入購物車
- **AND** 導向登入頁，並帶上指向原頁的 `redirect`

#### Scenario: 已登入時加入購物車
- **WHEN** 已登入的使用者觸發加入購物車
- **THEN** 系統執行加入購物車流程，不導向登入頁

### Requirement: 登入後返回原頁
系統 SHALL 在登入成功後，依 `redirect` 導回原頁；`redirect` 不存在或無效（非單一字串路徑）時 SHALL 導向首頁。

#### Scenario: 依 redirect 返回
- **WHEN** 使用者經把關導向登入頁（帶 `redirect`）並完成登入
- **THEN** 系統導回 `redirect` 指定的原頁

#### Scenario: 無 redirect 時回首頁
- **WHEN** 使用者在無 `redirect` 的情況下完成登入
- **THEN** 系統導向首頁

#### Scenario: redirect 無效時回首頁
- **WHEN** `redirect` 為非單一字串路徑（例如陣列）
- **THEN** 系統導向首頁

### Requirement: 登出
系統 SHALL 提供登出，清除登入狀態，使系統回到未登入狀態。

#### Scenario: 執行登出
- **WHEN** 已登入的使用者執行登出
- **THEN** 系統清除登入狀態，後續視為未登入

#### Scenario: 於受保護頁面登出
- **WHEN** 使用者在需登入的頁面執行登出
- **THEN** 系統清除登入狀態並導向首頁
