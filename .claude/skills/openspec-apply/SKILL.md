---
name: openspec-apply
description: 在這個專案裡實作/apply openSpec change 或 capability 時，同步補齊測試並只跑對應範圍，確保每個 capability 真正符合 spec.md 的 Scenario 才算完成。
---

# openSpec apply：每個 task 打勾前的測試 gate

apply 階段照 `tasks.md` 一項一項做，但 `tasks.md` 通常不列測試任務，`spec.md`（每個 capability 一份）才是驗收標準。openSpec 工具不會幫你寫測試、不會幫你跑測試，`openspec validate --strict` 只驗 spec 文件格式、不驗程式碼行為。這份 skill 補上這個落差。

## ⛔ 這份 skill 覆蓋 apply-change 的 task 迴圈

`openspec-apply-change` 的 Step 6 是「改代碼 → 把 `- [ ]` 改成 `- [x]` → 下一個 task」，中間沒有測試步驟——這正是測試被跳過的原因。**這份 skill 覆蓋那個迴圈**：

> **把任一 task 的 `- [ ]` 改成 `- [x]`，就是這份 skill 的 gate。改勾這個動作之前，一定要先跑完下面的決策表。禁止「先打勾、之後再回頭補測試」——那等於沒有 gate。**

如果你發現自己已經把某個 task 打勾、卻還沒對它做過下表的判斷，代表 gate 被跳過了：停下來，回去補完再繼續。

**打勾一律用 Edit（局部把 `- [ ]` 改成 `- [x]`），不要用 Write 覆寫整份 `tasks.md`。** 有一支 PostToolUse hook 會在打勾當下強制提醒你自檢，但它只認得 Edit/MultiEdit 的局部改動；用 Write 整檔覆寫會讓那道兜底靜默失效。

## Task 層級：打勾前先分類，再決定動作

每做完一個 task，**在改勾之前**先判斷它屬於哪一類：

| task 類型 | 判斷準則（例子） | 打勾前必須做的事 |
| --- | --- | --- |
| **獨立可測的邏輯單元** | composable / store action / util function（`useProductList.ts`、`cart.ts` 這類） | 補一支 **colocated** 的 Vitest `*.test.ts`，`npx vitest run <path>` **只跑這一支**、通過後才打勾 |
| **純畫面骨架** | 沒有獨立邏輯的 view/元件搭建（「建立 XxxView.vue 骨架」這類） | 不逐一補，留到 capability 層級用 e2e 涵蓋，可直接打勾 |

- 邏輯單元這一類量小、單支測試跑很快，**直接在主線自己寫、自己跑、自己修**，不用開 subagent。
- 分不出來屬於哪一類（例如一個 task 同時搭畫面又帶了一小段邏輯）→ 按「有沒有可以獨立斷言的行為」判斷：有就補 Vitest，沒有就留給 e2e。真的判斷不了再問使用者，不要默默跳過。

## Capability 層級：spec.md 逐條核對，執行交給 subagent

一個 capability 底下所有 task 都打勾後：

1. 讀該 capability 的 `openspec/changes/<change>/specs/<capability>/spec.md`，列出所有 Requirement + Scenario。
2. 逐條核對是否已有測試覆蓋，缺的補上（要斷言什麼、對應哪個 Scenario 需要理解 spec 語意，**這段留在主線做**）：
   - 跨頁流程／路由跳轉／多步驟互動 → 補 Playwright e2e spec（判斷準則與啟動指令見 [e2e skill](../e2e/SKILL.md)）
   - 單一狀態／邏輯行為 → 補 Vitest 測試
3. **e2e spec 寫完後不要在主線執行**——即使只是想確認 selector 對不對、跑一次「先看看」也算違規。寫完就直接交給 subagent。（這跟 Vitest 不同：Vitest 在 task 層級允許主線自己寫自己跑；e2e 從寫完那一刻就屬於 capability 層級，執行權完全在 subagent。）
4. 這個 capability 涉及的整批測試（task 層級已通過的 + 剛補齊的）交給一個 `Agent`（`subagent_type: general-purpose`）一次執行、診斷修正到全部通過並回報。主線只讀結論，**不自己跑這一整批、也不自己先跑過任何一支再丟給 subagent 覆核**——凡 `npx playwright test` 這類指令全部由 subagent 執行，主線一次都不跑。

**為什麼驗證這段丟給 subagent**：capability 層級要跑一批測試，常常來回好幾輪、夾雜大量輸出和失敗堆疊，會塞爆主線 context，也會把主線注意力從「這次 apply 涵蓋了哪些 capability／決策」拉走。丟給 subagent，主線只讀最後結論（過了/沒過、修了什麼、卡在什麼判斷）。

subagent 每次都是全新的、不記得這次對話，prompt 必須自洽，至少包含：

- 要跑哪些測試檔案（明確路徑，見「只跑對應範圍」，別讓它自己找）
- 跑測試的指令（`npx vitest run <files...>` 或 `npx playwright test <files...>`）
- 下方「測試沒過怎麼處理」的判斷規則
- 要求回報：測試最後有沒有過、中途修了什麼 bug、卡在什麼判斷

## 只跑對應範圍，不跑全部

- 用 `git status --short` / `git diff --name-only` 抓出這次 apply 實際新增/修改的檔案，篩出測試檔（`*.test.ts`、`e2e/*.spec.ts`），把清單寫進 capability 層級 subagent 的 prompt。
- Vitest 只對這些檔案 `npx vitest run <files...>`；e2e 只對這些檔案 `npx playwright test <files...>`。
- **不要**在 apply 過程中跑整包 `npm test` 或無參數 `npx playwright test`，主線和 subagent 都不行。全量回歸是合併前另一個獨立步驟，不屬於這份 skill。

## 測試沒過怎麼處理

Task 層級（主線自己跑）與 capability 層級（subagent 執行）遵守同一套規則：

- **明顯的實作 bug／glue code 問題**（selector 寫錯、參數傳錯、strict mode 選錯元素）：自己診斷、自己修、重跑該支到通過，不用逐步請示。跑完說明發現什麼、怎麼修（subagent 則寫進回報）。
- **牽涉「這個行為到底該怎樣」的判斷**（失敗是因為 Scenario 描述本身模糊、或修法會改變產品行為/UX，不只是修 bug）：停下，不擅自決定。Task 層級主線直接用 AskUserQuestion 問；capability 層級由 subagent 把卡住的情況、原因、選項整理回報，主線收到才用 AskUserQuestion 確認。

## 發現 spec 有缺口或要變更時：文件先於代碼

兩種情況、同一套規則：

- **缺口**：`spec.md` 根本沒定義這個行為。不只測試沒過時會遇到，**寫 task 或寫測試當下也常遇到**——tasks.md 只有一句話，動手才發現有沒明講的分支（例如「未登入要不要導去登入頁」）。
- **變更**：`spec.md` 已明確定義過某行為，但實作中發現該推翻。openSpec 用 `## MODIFIED Requirements` 這種 delta 語法正式處理，正式程度更高，更不能跳過文件直接改代碼。

兩者都停下來用 AskUserQuestion 跟使用者確認，不擅自決定。決定後**先補文件、再動代碼**：

1. `spec.md`：更新對應 Requirement 的 Scenario，把確認的行為寫進去。
2. `design.md`：技術/行為面的決策，比照既有 `## Decisions` 補一條含理由。
3. `tasks.md`：原本 task 描述沒涵蓋這塊就改到能反映實際做了什麼，別讓打勾後的紀錄跟實作對不上。
4. `proposal.md`：只有跟既有描述矛盾時才改，單純補細節不用動。

文件更新完才回頭改代碼。理由：spec-driven 的精神是「先定規格、代碼照規格走」，先動代碼再補文件等於把 spec.md/design.md/tasks.md 變成事後紀錄。

## 每個 task group 完成後輸出確認表

每做完 `tasks.md` 一個 `##` group（該 group 所有項目都打勾後），輸出一張表格讓使用者確認，再繼續下一個 group。欄位固定為：**Task｜分類判斷｜有無寫測試｜有無跑測試**，逐項用 ✅ / ❌不需要 / ⚠️ 標記，把上面決策表的判斷結果**外顯**出來，不要只用一句文字帶過。這是讓使用者能一眼稽核 gate 有沒有被跳過的關卡。

## 自我檢查

**每個 task 打勾前**：
- [ ] 已對這個 task 做過上面的決策表分類
- [ ] 若是邏輯單元，已補 colocated `*.test.ts` 且 `npx vitest run <path>` 這一支通過

**每個 capability 完成前**：
- [ ] 該 capability 下 `tasks.md` 所有項目已打勾
- [ ] `spec.md` 每條 Scenario 都有對應測試且都通過（結果來自 subagent 回報，主線沒繞過 subagent 自己跑整批）
- [ ] 這次只跑範圍內的測試，沒把整包當驗證
- [ ] 整個 apply 過程主線沒執行過任何一次 `npx playwright test`（含寫完 e2e 想先確認 selector）

## 不負責的範圍

- `openspec validate --strict`（spec 文件格式檢查，跟程式碼/測試無關）
- `/verify`（改動完成後更全面的 runtime 驗證；這份 skill 專注 apply 過程中的測試撰寫與範圍控制）
