"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const Opening = require("../game/opening.js");

test("醒來開場先呈現主角甦醒，再揭示床上相同人物的 NO.02", () => {
  const opening = Opening.start(Opening.create());
  const wake = Opening.tick(opening, 0.9);
  assert.equal(wake.phase, "wake");
  assert.match(wake.text, /病床上醒來/);
  assert.ok(wake.progress > 0 && wake.progress < 1);
  assert.equal(wake.done, false);

  const reveal = Opening.tick(wake.state, 1);
  assert.equal(reveal.phase, "reveal");
  assert.match(reveal.text, /長相完全相同/);
  assert.match(reveal.text, /NO\.02/);
  assert.equal(reveal.done, false);

  const finish = Opening.tick(reveal.state, 1.7);
  assert.equal(finish.done, true);
  assert.equal(finish.state.started, false);
});
