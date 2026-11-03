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

test("時鐘面清楚可辨，分針比時針長，時針比分針寬", () => {
  assert.ok(Clock.faceRadius >= 0.34);
  assert.ok(Clock.minuteLength - Clock.hourLength >= 0.08);
  assert.ok(Clock.hourWidth > Clock.minuteWidth);
  const scene = fs.readFileSync(path.join(__dirname, "../game/scene.js"), "utf8");
  assert.match(scene, /CircleGeometry/);
  assert.match(scene, /TorusGeometry/);
  assert.match(scene, /minuteColor/);
});

test("時鐘有 1 到 12 的數字、60 格刻度與完整外框", () => {
  assert.deepEqual(Clock.numerals, ["12", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"]);
  assert.equal(Clock.minuteTickCount, 60);
  const scene = fs.readFileSync(path.join(__dirname, "../game/scene.js"), "utf8");
  assert.match(scene, /clockDialTexture/);
  assert.match(scene, /fillText/);
  assert.match(scene, /TorusGeometry/);
});
