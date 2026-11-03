"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const Opening = require("../game/opening.js");

test("醒來開場先呈現主角甦醒，再揭示床上相同人物的 NO.02", () => {
  const opening = Opening.create();
  const wake = Opening.advance(opening);
  assert.match(wake.text, /病床上醒來/);
  assert.equal(wake.done, false);

  const reveal = Opening.advance(wake.state);
  assert.match(reveal.text, /長相完全相同/);
  assert.match(reveal.text, /NO\.02/);
  assert.equal(reveal.done, false);

  const start = Opening.advance(reveal.state);
  assert.equal(start.done, true);
  assert.equal(start.state.started, true);
});