"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = file => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

test("互動訊息與重要物品使用畫面中央的無障礙對話框", () => {
  const html = read("game/index.html");
  const css = read("game/style.css");
  const scene = read("game/scene.js");
  assert.match(html, /id="interaction-dialog"[^>]*role="dialog"[^>]*aria-modal="true"/);
  assert.match(html, /id="interaction-dialog-title"/);
  assert.match(html, /id="interaction-dialog-close"/);
  assert.match(html, /id="interaction-dialog-content"/);
  assert.match(css, /#interaction-dialog[^\n]*place-items:\s*center/);
  assert.match(scene, /function showDialog\(/);
  assert.match(scene, /notifyPopup\(/);
});

test("E 互動不會自動開右側筆記，密碼表單改在中央對話框使用", () => {
  const html = read("game/index.html");
  const scene = read("game/scene.js");
  const block = (source, start, end) => {
    const a = source.indexOf(start), b = source.indexOf(end, a + start.length);
    assert.ok(a >= 0 && b > a, `找不到函式區塊：${start}`);
    return source.slice(a, b);
  };
  assert.match(html, /id="pin-form-slot"/);
  assert.match(html, /id="toggle-notebook"/);
  assert.doesNotMatch(block(scene, "function inspect(", "function click("), /openNotebook/);
  assert.doesNotMatch(block(scene, "function click(", "box\(0,-\.12"), /openNotebook/);
  assert.doesNotMatch(block(scene, "function activate(", "function advance("), /if\(notebookPanel\.hidden\)openNotebook/);
  assert.match(scene, /interactionDialogContent\.append\(pinForm\)/);
  assert.match(scene, /e\.key\s*===\s*"Escape"[\s\S]*closeInteractionDialog/);
});

test("病歷紙片內容在中央提示以大字顯示", () => {
  const css = read("game/style.css");
  assert.match(css, /#interaction-dialog\[data-kind="fragment"\].*font-size:\s*clamp\(1\.3rem/);
});
