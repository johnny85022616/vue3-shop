# vue3-shop

## openSpec：tasks.md 只列實作任務

`/opsx:propose` 產生 `tasks.md` 時**只列實作任務**，不要列測試任務，也不要開獨立的測試 task group。

測試何時寫、誰來跑，一律由 [`openspec-apply`](.claude/skills/openspec-apply/SKILL.md) 在 apply 階段規定——那份 skill 只在 apply 時載入，propose 讀不到，所以煞車放在這裡。tasks.md 一旦列測試就會跟它的打勾 gate 衝突。細節看那份 skill，不要在這裡複述。
