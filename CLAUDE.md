# vue3-shop

## openSpec：tasks.md 只列實作任務

`/opsx:propose` 產生 `tasks.md` 時**只列實作任務**，不要列測試任務，也不要開獨立的測試 task group。

測試何時寫、誰來跑，一律由 [`openspec-apply`](.claude/skills/openspec-apply/SKILL.md) 在 apply 階段規定——那份 skill 只在 apply 時載入，propose 讀不到，所以煞車放在這裡。tasks.md 一旦列測試就會跟它的打勾 gate 衝突。細節看那份 skill，不要在這裡複述。

## 寫測試前先讀 e2e skill

要寫或改任何測試（新增、重寫、補測試）前，**一律先載入 [`e2e`](.claude/skills/e2e/SKILL.md) skill**，依它的規範決定「這個行為該用 Playwright e2e 還是 Vitest 單元測試」，再動手。判斷關鍵、對照表、何時只跑單一 spec 等細節都在那份 skill，不要在這裡複述。跨頁流程／路由跳轉一律 e2e，勿用 Vitest 硬測。
