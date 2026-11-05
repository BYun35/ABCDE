"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const Opening = require("../game/opening.js");

test("醒來開場先呈現主角甦醒，再揭示床上相同人物的 NO.02", () => {
  assert.ok(Opening.wakeDuration >= 3.5, "第一段文字至少停留 3.5 秒");
  assert.ok(Opening.totalDuration - Opening.wakeDuration >= 3.5, "第二段文字至少停留 3.5 秒");
  assert.ok(Opening.totalDuration >= 7, "開場至少 7 秒");
  const opening = Opening.start(Opening.create());
  const wake = Opening.tick(opening, 3.49);
  assert.equal(wake.phase, "wake");
  assert.match(wake.text, /病床上醒來/);
  assert.ok(wake.progress > 0 && wake.progress < 1);
  assert.equal(wake.done, false);

  const reveal = Opening.tick(wake.state, 0.01);
  assert.equal(reveal.phase, "reveal");
  assert.match(reveal.text, /長相完全相同/);
  assert.match(reveal.text, /NO\.02/);
  assert.equal(reveal.done, false);

  const readableReveal = Opening.tick(reveal.state, 3.49);
  assert.equal(readableReveal.phase, "reveal");
  assert.equal(readableReveal.done, false);

  const finish = Opening.tick(readableReveal.state, 0.01);
  assert.equal(finish.done, true);
  assert.equal(finish.state.started, false);
});
