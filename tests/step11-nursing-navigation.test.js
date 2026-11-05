"use strict";

const assert = require("node:assert/strict");
const NursingNavigation = require("../game/nursing-navigation.js");

const { TARGETS } = NursingNavigation;

assert.equal(TARGETS.recordA.z, TARGETS.recordB.z);
assert.equal(TARGETS.recordB.z, TARGETS.recordC.z);
assert.ok(TARGETS.recordB.z > -1.6, "病歷 B 應與 A、C 同列，避免被桌面深處遮擋");
assert.equal(TARGETS.drawer.z, -1.2, "隱藏抽屜互動座標應對齊抽屜模型");

console.log("PASS nursing-records-are-reachable");
