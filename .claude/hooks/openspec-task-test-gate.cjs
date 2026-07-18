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

    if (toolName !== "Edit" && toolName !== "MultiEdit") return allow();
    if (!/openspec\/changes\/.*tasks\.md$/.test(filePath)) return allow();
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
        if (t.checked && oldMap[t.num] !== true) newlyChecked.push(t);
      }
    }
    if (newlyChecked.length === 0) return allow();

    const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
    const problems = [];

    for (const t of newlyChecked) {
      const tag = parseTag(t.line);
      if (!tag) {
        problems.push(
          `・Task ${t.num}：缺判定 tag。先跑決策表分類，在打勾那行補上 ` +
            `<!-- 判定:unit｜測試:<路徑> --> 或 <!-- 判定:e2e-deferred --> 或 <!-- 判定:ui-skeleton --> 再打勾。`
        );
        continue;
      }
      if (tag.kind === "unit") {
        if (!tag.testPath) {
          problems.push(`・Task ${t.num}：判定為 unit 但沒指定測試檔（格式：判定:unit｜測試:<路徑>）。`);
          continue;
        }
        const abs = path.isAbsolute(tag.testPath) ? tag.testPath : path.join(projectDir, tag.testPath);
        if (!fs.existsSync(abs)) {
          problems.push(`・Task ${t.num}：判定 unit，但測試檔不存在：${tag.testPath}（請先寫測試）。`);
          continue;
        }
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
        // 合法的「此刻不寫單元測試」狀態，放行。誠實與否交給 capability 階段審查。
      } else {
        problems.push(`・Task ${t.num}：判定 tag 無法辨識（${tag.raw}）。允許值：unit / e2e-deferred / ui-skeleton。`);
      }
    }

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
    const m = line.match(/- \[( |x|X)\]\s*(\d+(?:\.\d+)*)/);
    if (m) out.push({ checked: m[1].toLowerCase() === "x", num: m[2], line });
  }
  return out;
}

// taskNum -> 是否已打勾（同一 num 多次出現時，只要有一個 [x] 就視為已打勾）
function checkedMap(s) {
  const map = {};
  for (const t of taskLines(s)) map[t.num] = map[t.num] === true ? true : t.checked;
  return map;
}

// 從一行文字解析 <!-- 判定:... --> tag
function parseTag(line) {
  const m = line.match(/<!--\s*判定\s*[:：]\s*([^>]*?)\s*-->/);
  if (!m) return null;
  const raw = m[1].trim();
  const parts = raw.split(/[｜|]/).map((x) => x.trim()); // 分隔符全形｜或半形|
  const kindRaw = (parts[0] || "").toLowerCase();
  if (kindRaw === "unit") {
    let testPath = null;
    for (const p of parts.slice(1)) {
      const tm = p.match(/測試\s*[:：]\s*(.+)$/);
      if (tm) testPath = tm[1].trim();
    }
    return { kind: "unit", testPath, raw };
  }
  if (kindRaw === "e2e-deferred") return { kind: "e2e-deferred", raw };
  if (kindRaw === "ui-skeleton") return { kind: "ui-skeleton", raw };
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
