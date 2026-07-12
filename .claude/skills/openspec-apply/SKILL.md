---
name: openspec-apply
description: 在這個專案裡實作/apply openSpec change 或 capability 時，同步補齊測試並只跑對應範圍，確保每個 capability 真正符合 spec.md 的 Scenario 才算完成。
---

# openSpec apply：測試同步撰寫與範圍控制

openSpec 的 apply 階段是照 `tasks.md` 一項一項執行，但 `tasks.md` 本身通常不會列出測試任務（這個 repo 裡 archived 的 [tasks.md](../../../openspec/archived/vue3-shop-portfolio/tasks.md) 就是例子）。`spec.md`（每個 capability 一份）才是驗收標準，openSpec 官方文件也明講完成的定義包含「程式碼要通過對應 spec.md Scenario 的測試」——但 openSpec 工具本身不會幫你寫測試、不會幫你跑測試，`openspec validate --strict` 只驗證 spec 文件格式，不驗證程式碼行為。這份 skill 補上這個落差。

## Task 層級規則

照 `tasks.md` 一項一項執行的過程中：

- 完成的 task 若對應**獨立可測的邏輯單元**（composable、store action、util function，例如 `useProductList.ts`、`cart.ts` 這類），順手補一支 colocated 的 Vitest 測試（`*.test.ts`），並**只跑這一支**（`npx vitest run <path>`）通過後才把該 task 打勾。
- 純畫面搭建、沒有獨立邏輯的 task（例如「建立 XxxView.vue 骨架」）不用逐一補測試，留到 capability 層級用 e2e 涵蓋。

## Capability 層級規則

一個 capability 底下所有 task 都完成後：

1. 讀該 capability 的 `openspec/changes/<change>/specs/<capability>/spec.md`，列出所有 Requirement + Scenario。
2. 逐條核對是否有測試覆蓋：
   - 跨頁流程／路由跳轉／多步驟互動 → 補 Playwright e2e spec（判斷準則與啟動指令見 [e2e skill](../e2e/SKILL.md)）
   - 單一狀態／邏輯行為 → 補 Vitest 測試即可
3. 補齊缺漏的測試。

## 只跑對應範圍，不跑全部

- 用 `git status --short` / `git diff --name-only` 抓出這次 apply 過程中實際新增/修改的檔案，篩出裡面的測試檔（`*.test.ts`、`e2e/*.spec.ts`）。
- Vitest 只對這些檔案跑 `npx vitest run <files...>`；e2e 只對這些檔案跑 `npx playwright test <files...>`。
- **不要**在 apply 過程中跑整包 `npm test` 或 `npx playwright test`（無參數）。全量回歸測試是合併前的另一個獨立步驟，不屬於這份 skill 的範圍。

## 測試沒過時怎麼處理

- **明顯的實作 bug／glue code 問題**（selector 寫錯、參數傳錯、strict mode 選錯元素這類）：自己診斷、自己修正、修完重新跑該支測試，直到通過為止，不用逐步請示。跑完後跟使用者說明發現了什麼、怎麼修的即可。
- **牽涉到「這個行為到底該怎樣」的判斷**（測試失敗是因為 spec.md 的 Scenario 描述本身模糊、或修法會改變實際產品行為/UX，不只是修 bug）：停下來跟使用者確認，不擅自決定，因為這已經是產品判斷，不是我能單方面決定的事。

## Capability 完成前的自我檢查

- [ ] 該 capability 下 `tasks.md` 所有項目已打勾
- [ ] `spec.md` 每條 Scenario 都有對應測試，且都通過
- [ ] 這次只跑了範圍內的測試，沒有跑整包當作驗證

## 不負責的範圍

- `openspec validate --strict`（spec 文件格式檢查，跟程式碼/測試無關）
- `/verify`（改動完成後更全面的 runtime 驗證流程；這份 skill 專注在 apply 過程中的測試撰寫與範圍控制）
