#!/usr/bin/env node
/**
 * openspec-apply 測試 gate（PreToolUse 強制關卡）。
 *
 * 觸發：PreToolUse（Edit / MultiEdit）。
 * 命中條件：被改的檔是 openspec/changes/.../tasks.md（archived 不算），
 *          且這次 Edit 讓某個 task 從 `- [ ]` 變 `- [x]`（新打勾）。
 *
 * 對每個「新打勾的 task 行」檢查它自己那行上的判定 tag：
 *   <!-- 判定:unit｜測試:<路徑> -->  → hook 自己跑 `npx vitest run <路徑>`，綠才 allow、紅/檔案不存在則 deny
 *   <!-- 判定:e2e-deferred -->        → allow（測試延到 capability 階段的 e2e）
 *   <!-- 判定:ui-skeleton -->         → allow（純畫面骨架，無獨立邏輯）
 *   沒有 tag / tag 無法辨識            → deny
 *
 * deny = 回傳 PreToolUse 的 permissionDecision:"deny"，harness 會擋下這個 Edit（框維持 - [ ]），
 *        並把理由回饋給模型。
 *
 * 設計邊界：hook 只做「機械」把關（tag 存在、unit 測試跑綠）。它「不」判斷判定誠不誠實
 *          （例如把該 unit 的硬標 e2e-deferred）——那屬語意問題，交給 capability 階段的
 *          審覆蓋 reviewer + diff coverage，不在這支 hook 的責任範圍。
 *
 * 非預期例外（解析錯誤等）一律 allow，不因 hook 自身 bug 卡住正常流程；
 * 但明確的 deny 條件（沒 tag、測試紅）該擋就擋。
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

let input = "";
process.stdin.on("data", (c) => (input += c));
process.stdin.on("end", () => {
  try {
    const data = JSON.parse(input || "{}");
    const toolName = data.tool_name;
    const ti = data.tool_input || {};
    const filePath = ti.file_path || "";

    // 判斷 1：不是 Edit / MultiEdit（例如 Write、Read）→ 這 gate 不管，放行
    if (toolName !== "Edit" && toolName !== "MultiEdit") return allow();
    // 判斷 2：被改的檔不是 openspec change 的 tasks.md → 與打勾無關，放行
    if (!/openspec\/changes\/.*tasks\.md$/.test(filePath)) return allow();
    // 判斷 3：檔在 archive 目錄（已封存的 change）→ 不再把關，放行
    if (/openspec\/changes\/archive/.test(filePath)) return allow();

    // 收集這次 Edit 的 (old, new) 片段
    const pairs = [];
    if (toolName === "Edit") {
      pairs.push({ oldS: ti.old_string || "", newS: ti.new_string || "" });
    } else if (Array.isArray(ti.edits)) {
      for (const e of ti.edits) pairs.push({ oldS: e.old_string || "", newS: e.new_string || "" });
    }

    // 找出這次「新打勾」的 task 行（在 new 是 [x]、但在 old 不是 [x]）
    const newlyChecked = [];
    for (const { oldS, newS } of pairs) {
      const oldMap = checkedMap(oldS);
      for (const t of taskLines(newS)) {
        // 判斷 4：這行在 new 是打勾 [x]，且在 old 不是打勾 → 才算「這次新打勾」，
        //         排除本來就已打勾（只是被一起改到）的行，避免重複把關
        if (t.checked && oldMap[t.num] !== true) newlyChecked.push(t);
      }
    }
    // 判斷 5：這次 Edit 沒有任何新打勾（純改內文、取消打勾等）→ 無需把關,放行
    if (newlyChecked.length === 0) return allow();

    const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
    const problems = [];

    for (const t of newlyChecked) {
      const tag = parseTag(t.line);
      // 判斷 6：打勾那行完全沒有 <!-- 判定:... --> tag → deny，要求先分類補 tag
      if (!tag) {
        problems.push(
          `・Task ${t.num}：缺判定 tag。先跑決策表分類，在打勾那行補上 ` +
            `<!-- 判定:unit｜測試:<路徑> --> 或 <!-- 判定:e2e-deferred --> 或 <!-- 判定:ui-skeleton --> 再打勾。`
        );
        continue;
      }
      // 判斷 7：tag 是 unit → 需要有對應測試檔且跑綠才放行
      if (tag.kind === "unit") {
        // 判斷 7a：標了 unit 卻沒填測試路徑 → deny
        if (!tag.testPath) {
          problems.push(`・Task ${t.num}：判定為 unit 但沒指定測試檔（格式：判定:unit｜測試:<路徑>）。`);
          continue;
        }
        const abs = path.isAbsolute(tag.testPath) ? tag.testPath : path.join(projectDir, tag.testPath);
        // 判斷 7b：測試檔路徑不存在（還沒寫測試）→ deny
        if (!fs.existsSync(abs)) {
          problems.push(`・Task ${t.num}：判定 unit，但測試檔不存在：${tag.testPath}（請先寫測試）。`);
          continue;
        }
        // 判斷 7c：實跑 vitest。指令正常結束(exit 0)=綠=放行；throw=紅→進 catch deny
        try {
          execSync(`npx vitest run ${JSON.stringify(tag.testPath)}`, {
            cwd: projectDir,
            stdio: "pipe",
            timeout: 120000,
            encoding: "utf8",
          });
        } catch (err) {
          const out = ((err.stdout || "") + "\n" + (err.stderr || "") + "\n" + (err.message || ""))
            .trim()
            .slice(-1800);
          problems.push(`・Task ${t.num}：測試未通過（${tag.testPath}）。請修到綠再打勾。\n${out}`);
        }
      } else if (tag.kind === "e2e-deferred" || tag.kind === "ui-skeleton") {
        // 判斷 8：tag 是 e2e-deferred / ui-skeleton → 合法的「此刻不寫單元測試」狀態，
        //         放行(不進 problems)。誠實與否交給 capability 階段審查。
      } else {
        // 判斷 9：有 tag 但值不在允許清單內（拼錯、用了未定義的類別）→ deny
        problems.push(`・Task ${t.num}：判定 tag 無法辨識（${tag.raw}）。允許值：unit / e2e-deferred / ui-skeleton。`);
      }
    }

    // 判斷 10：只要有任一 task 不合格 → deny 整次 Edit（打勾不落地，框維持 - [ ]）；
    //          全部通過才走到最後的 allow()
    if (problems.length > 0) {
      return deny(
        "⛔ openspec-apply gate：以下 task 未滿足打勾條件，已擋下這次打勾（框維持 - [ ]）。\n\n" +
          problems.join("\n") +
          "\n\n處理完再重送打勾。細節見 .claude/skills/openspec-apply/SKILL.md。"
      );
    }
    return allow();
  } catch (_e) {
    // hook 自身非預期錯誤：放行，不拿自己的 bug 卡住流程
    return allow();
  }
});

// 解析所有 task 行：回傳 [{ num, checked, line }]
function taskLines(s) {
  const out = [];
  for (const line of String(s || "").split("\n")) {
    // 判斷 A：這行是不是 task 行（符合 `- [ ] 1.2` 這種格式）；不符則整行略過。
    //         括號內是 x/X 才算已打勾，空白算未打勾
    const m = line.match(/- \[( |x|X)\]\s*(\d+(?:\.\d+)*)/);
    if (m) out.push({ checked: m[1].toLowerCase() === "x", num: m[2], line });
  }
  return out;
}

// taskNum -> 是否已打勾（同一 num 多次出現時，只要有一個 [x] 就視為已打勾）
function checkedMap(s) {
  const map = {};
  // 判斷 B：同一個 task num 在片段裡出現多次時，只要有一行是 [x] 就記為 true（true 不被後面覆蓋掉）
  for (const t of taskLines(s)) map[t.num] = map[t.num] === true ? true : t.checked;
  return map;
}

// 從一行文字解析 <!-- 判定:... --> tag
function parseTag(line) {
  const m = line.match(/<!--\s*判定\s*[:：]\s*([^>]*?)\s*-->/);
  // 判斷 C：這行有沒有 <!-- 判定:... --> 註解；沒有回 null（對應主流程判斷 6 的 deny）
  if (!m) return null;
  const raw = m[1].trim();
  const parts = raw.split(/[｜|]/).map((x) => x.trim()); // 分隔符全形｜或半形|
  const kindRaw = (parts[0] || "").toLowerCase();
  // 判斷 D：第一段是 unit → 再從後面各段找「測試:<路徑>」抽出 testPath（找不到則為 null）
  if (kindRaw === "unit") {
    let testPath = null;
    for (const p of parts.slice(1)) {
      const tm = p.match(/測試\s*[:：]\s*(.+)$/);
      if (tm) testPath = tm[1].trim();
    }
    return { kind: "unit", testPath, raw };
  }
  // 判斷 E：其餘兩種合法類別直接對應回傳
  if (kindRaw === "e2e-deferred") return { kind: "e2e-deferred", raw };
  if (kindRaw === "ui-skeleton") return { kind: "ui-skeleton", raw };
  // 判斷 F：有 tag 但類別字串不認得 → kind:"unknown"（對應主流程判斷 9 的 deny）
  return { kind: "unknown", raw };
}

function allow() {
  process.exit(0);
}

function deny(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: reason,
      },
    })
  );
  process.exit(0);
}
