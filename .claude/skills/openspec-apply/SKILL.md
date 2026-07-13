---
name: openspec-apply
description: 在這個專案裡實作/apply openSpec change 或 capability 時，同步補齊測試並只跑對應範圍，確保每個 capability 真正符合 spec.md 的 Scenario 才算完成。
---

# openSpec apply：測試同步撰寫與範圍控制

openSpec 的 apply 階段是照 `tasks.md` 一項一項執行，但 `tasks.md` 本身通常不會列出測試任務（這個 repo 裡 archived 的 [tasks.md](../../../openspec/archived/vue3-shop-portfolio/tasks.md) 就是例子）。`spec.md`（每個 capability 一份）才是驗收標準，openSpec 官方文件也明講完成的定義包含「程式碼要通過對應 spec.md Scenario 的測試」——但 openSpec 工具本身不會幫你寫測試、不會幫你跑測試，`openspec validate --strict` 只驗證 spec 文件格式，不驗證程式碼行為。這份 skill 補上這個落差。

## Task 層級規則

照 `tasks.md` 一項一項執行的過程中：

- 完成的 task 若對應**獨立可測的邏輯單元**（composable、store action、util function，例如 `useProductList.ts`、`cart.ts` 這類），順手補一支 colocated 的 Vitest 測試（`*.test.ts`），並**只跑這一支**（`npx vitest run <path>`）通過後才把該 task 打勾。這個層級量小、單支測試跑很快，直接在主線自己寫、自己跑、自己修，不用開 subagent。
- 純畫面搭建、沒有獨立邏輯的 task（例如「建立 XxxView.vue 骨架」）不用逐一補測試，留到 capability 層級用 e2e 涵蓋。

## Capability 層級規則：驗證交給 subagent

一個 capability 底下所有 task 都完成後：

1. 主線讀該 capability 的 `openspec/changes/<change>/specs/<capability>/spec.md`，列出所有 Requirement + Scenario。
2. 主線逐條核對是否已有測試覆蓋：
   - 跨頁流程／路由跳轉／多步驟互動 → 補 Playwright e2e spec（判斷準則與啟動指令見 [e2e skill](../e2e/SKILL.md)）
   - 單一狀態／邏輯行為 → 補 Vitest 測試
3. 主線補齊缺漏的測試檔案（測試要斷言什麼、對應哪個 Scenario，需要理解 spec 語意，這段留在主線做，不交給 subagent）。**e2e spec 寫完後不要在主線執行**——即使只是想確認 selector 寫得對不對、跑一次「先看看」，也算違規；寫完就直接進下一步交給 subagent 跑。這跟 Vitest 不同：Vitest 是 task 層級允許主線自己寫自己跑，e2e 從寫完的那一刻就屬於 capability 層級，執行權完全在 subagent。
4. 這個 capability 涉及的整批測試（task 層級已通過的 + 剛補齊的），交給一個 `Agent` tool 開的 subagent 一次執行、診斷修正到全部通過，並回報結果。主線只讀 subagent 的結論，**不自己跑這一整批，也不自己先跑過任何一支再丟給 subagent 覆核**——凡是 `npx playwright test` 這類指令，全部改由 subagent 執行，主線一次都不要跑。

**為什麼驗證這段丟給 subagent**：capability 層級要跑的是一批測試，過程常常要來回好幾輪、夾雜大量測試輸出和失敗堆疊，會塞爆主線 context，也會讓主線的注意力從「這次 apply 到底涵蓋了哪些 capability／決策」被拉走。丟給 subagent 執行，主線只需要讀最後的結論（過了/沒過、修了什麼、或卡在什麼判斷上）。

開 subagent 時 `subagent_type` 用 `general-purpose`（需要讀寫檔案、跑指令）。因為每次開的 subagent 都是全新的、不記得這次對話任何脈絡，prompt 必須自洽，至少要包含：

- 要跑哪些測試檔案（明確路徑，見下方「只跑對應範圍」，不要讓 subagent 自己去找該跑什麼）
- 跑測試的指令（`npx vitest run <files...>` 或 `npx playwright test <files...>`）
- 下方「測試沒過時怎麼處理」的判斷規則：明顯 bug 自己修到過，卡在產品判斷就停下回報，不要自己決定
- 要求 subagent 回報：測試最後有沒有過、如果中途修了什麼 bug、如果卡在判斷問題是什麼

## 只跑對應範圍，不跑全部

- 用 `git status --short` / `git diff --name-only` 抓出這次 apply 過程中實際新增/修改的檔案，篩出裡面的測試檔（`*.test.ts`、`e2e/*.spec.ts`），把這份清單寫進 capability 層級 subagent 的 prompt。
- Vitest 只對這些檔案跑 `npx vitest run <files...>`；e2e 只對這些檔案跑 `npx playwright test <files...>`。
- **不要**在 apply 過程中跑整包 `npm test` 或 `npx playwright test`（無參數），不管是主線還是 subagent。全量回歸測試是合併前的另一個獨立步驟，不屬於這份 skill 的範圍。

## 測試沒過時怎麼處理

Task 層級主線自己跑、Capability 層級 subagent 執行，都遵守同一套判斷規則：

- **明顯的實作 bug／glue code 問題**（selector 寫錯、參數傳錯、strict mode 選錯元素這類）：自己診斷、自己修正、修完重新跑該支測試，直到通過為止，不用逐步請示。跑完後說明發現了什麼、怎麼修的即可（subagent 則是把這些寫進回報給主線）。
- **牽涉到「這個行為到底該怎樣」的判斷**（測試失敗是因為 spec.md 的 Scenario 描述本身模糊、或修法會改變實際產品行為/UX，不只是修 bug）：停下來，不擅自決定。Task 層級主線自己遇到就直接用 AskUserQuestion 問使用者；Capability 層級由 subagent 把卡住的情況、原因、可能的選項整理清楚回報給主線，主線收到後才用 AskUserQuestion 跟使用者確認。這已經是產品判斷，不是能單方面決定的事。

## 實作過程中發現 spec 需要補齊或變更時，文件要先於代碼

這裡有兩種情況，都適用同一套規則：

- **缺口**：`spec.md` 根本沒定義這個行為。不只測試沒過時會遇到「這個行為到底該怎樣」的判斷，**寫 task 或寫測試當下也常常會遇到**：tasks.md 寫的是一句話的任務描述，實際動手做才發現有沒明講的分支（例如「未登入時要不要導去登入頁」這種）。
- **變更**：`spec.md` 已經明確定義過某個行為，但實作中發現應該要改掉（不是漏寫，是要推翻既有定義）。openSpec 本身用 `## MODIFIED Requirements` 這種 delta 語法正式處理這種情況，履行的正式程度比單純新增缺口更高，所以更不能跳過文件、直接改代碼。

不管是缺口還是變更，都要停下來用 AskUserQuestion 跟使用者確認，不擅自決定——跟上面「測試沒過時怎麼處理」同一個判斷原則。

決定下來之後，**先補文件、再動代碼**，不要先把代碼改完才回頭補文件：

1. `spec.md`：一定要更新對應 Requirement 的 Scenario，把剛確認的行為寫進去。
2. `design.md`：如果這是技術/行為面的決策（不只是文字表述問題），比照既有 `## Decisions` 的寫法補一條，含理由。
3. `tasks.md`：如果原本的 task 描述沒有涵蓋這塊新確認的行為（例如只寫「串接 cart store」，沒提到「未登入要導向登入頁」），把該 task 的描述改到能完整反映實際做了什麼——不要讓 tasks.md 打勾之後變成跟實際實作對不上的紀錄。
4. `proposal.md`：只有在這個決策跟 proposal 裡既有的描述矛盾時才需要改，單純補細節不用動。

文件更新完，才回頭去改/繼續寫程式碼。原因：openSpec 標榜的 spec-driven 精神是「先定規格、代碼照規格走」，先動代碼再回頭補文件等於把順序反過來，會讓 spec.md/design.md/tasks.md 變成「代碼寫完後的事後紀錄」而不是「代碼要對齊的依據」。

## Capability 完成前的自我檢查

- [ ] 該 capability 下 `tasks.md` 所有項目已打勾
- [ ] `spec.md` 每條 Scenario 都有對應測試，且都通過（capability 層級的執行結果來自 subagent 回報，主線沒有自己直接跑整批測試繞過 subagent）
- [ ] 這次只跑了範圍內的測試，沒有跑整包當作驗證
- [ ] 整個 apply 過程中，主線沒有執行過任何一次 `npx playwright test`（包含寫完 e2e spec 當下想先確認選好的 selector 對不對）——e2e 一律只交給 subagent 跑

## 不負責的範圍

- `openspec validate --strict`（spec 文件格式檢查，跟程式碼/測試無關）
- `/verify`（改動完成後更全面的 runtime 驗證流程；這份 skill 專注在 apply 過程中的測試撰寫與範圍控制）
