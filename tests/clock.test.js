"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Clock = require("../game/clock.js");

test("病房圓形時鐘使用指針呈現 3:17，沒有把時間印成數位字樣", () => {
  const hands = Clock.angles(3, 17);
  assert.ok(Math.abs(hands.hour - (3 + 17 / 60) * Math.PI / 6) < 1e-9);
  assert.ok(Math.abs(hands.minute - 17 * Math.PI / 30) < 1e-9);

  const scene = fs.readFileSync(path.join(__dirname, "../game/scene.js"), "utf8");
  assert.match(scene, /WardClock/);
  assert.match(scene, /hourHand/);
  assert.match(scene, /minuteHand/);
  assert.doesNotMatch(scene, /sign\(0,\s*2\.65,\s*-5\.76,[^\n]*3:17/);
});
