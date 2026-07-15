#!/usr/bin/env node
/**
 * openspec-apply 測試 gate 的強制兜底。
 *
 * 觸發：PostToolUse（Edit / MultiEdit）。
 * 判斷：被改的檔是 openspec/changes/.../tasks.md，且這次改動讓 `- [x]` 的數量增加
 *       （代表有 task 從 `- [ ]` 被打勾成 `- [x]`）。
 * 動作：注入一段提醒，強迫模型在打勾當下確認有沒有補測試——不管它當下有沒有在想測試的事。
 *
 * 任何例外都靜默 exit 0，絕不擋住正常流程。
 */

let input = "";
process.stdin.on("data", (c) => (input += c));
process.stdin.on("end", () => {
  try {
    const data = JSON.parse(input || "{}");
    const ti = data.tool_input || {};
    const filePath = ti.file_path || "";

    // 只管 openspec change 的 tasks.md，archived 的不算
    if (!/openspec\/changes\/.*tasks\.md$/.test(filePath)) return exit0();

    const countChecked = (s) => (String(s || "").match(/- \[x\]/gi) || []).length;
    const boxNewlyChecked = (oldS, newS) => countChecked(newS) > countChecked(oldS);

    let hit = false;
    if (data.tool_name === "Edit") {
      hit = boxNewlyChecked(ti.old_string, ti.new_string);
    } else if (data.tool_name === "MultiEdit" && Array.isArray(ti.edits)) {
      hit = ti.edits.some((e) => boxNewlyChecked(e.old_string, e.new_string));
    }
    // Write（整檔覆寫）沒有 old 內容可比對，無法判斷是「新打勾」還是「原本就打勾」，
    // 為避免每次寫檔都誤觸，這裡不處理。

    if (!hit) return exit0();

    const reminder = [
      "⛔ openspec-apply gate 觸發：你剛把 openspec tasks.md 的一個 task 打勾（- [ ] → - [x]）。",
      "",
      "打勾前應已通過決策表判斷：",
      "・若這個 task 是「獨立可測的邏輯單元」（composable / store action / util，如 useProductList.ts、cart.ts）",
      "  → 必須已補 colocated 的 *.test.ts，並用 `npx vitest run <path>` 只跑這一支、通過。",
      "・若是「純畫面骨架」（無獨立邏輯的 view/元件搭建）→ 免補，留給 capability 層級 e2e。",
      "",
      "如果你是先打勾、還沒補/跑測試：現在立刻補測試並跑過，再繼續下一個 task。不要把它留到之後。",
      "細節見 .claude/skills/openspec-apply/SKILL.md。",
    ].join("\n");

    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "PostToolUse",
          additionalContext: reminder,
        },
      })
    );
    return exit0();
  } catch (_e) {
    return exit0();
  }
});

function exit0() {
  process.exit(0);
}
