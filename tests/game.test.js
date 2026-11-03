"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Game = require("../game/game.js");

test("藥瓶依正確時間順序排列時推出 317", () => {
  assert.equal(Game.deriveCode(["A", "B", "C"]), "317");
  assert.equal(Game.deriveCode(["C", "B", "A"]), null);
  assert.equal(Game.deriveCode(["A", "A", "C"]), null);
});

test("錯誤密碼有逐次回饋，且仍可重新嘗試", () => {
  let state = Game.createInitialState();

  let result = Game.submitCode(state, "731");
  state = result.state;
  assert.equal(state.attempts, 1);
  assert.match(result.message, /記憶資料不完整/);
  assert.equal(state.drawerUnlocked, false);

  result = Game.submitCode(state, "000");
  state = result.state;
  assert.equal(state.attempts, 2);
  assert.match(result.message, /每一次都是這樣/);

  result = Game.submitCode(state, "999");
  state = result.state;
  assert.equal(state.attempts, 3);
  assert.match(result.message, /仍可繼續嘗試/);

  result = Game.submitCode(state, "317");
  assert.equal(result.state.drawerUnlocked, true);
  assert.equal(result.state.doorOpen, false);
});

test("抽屜工具只能拆開藥瓶 C 並取得門禁卡", () => {
  let state = Game.createInitialState();

  assert.equal(Game.takeTool(state).state.tool, false);

  state = Game.submitCode(state, "317").state;
  state = Game.takeTool(state).state;
  assert.equal(state.tool, true);

  assert.equal(Game.openBottle(state, "A").state.keycard, false);
  state = Game.openBottle(state, "C").state;
  assert.equal(state.keycard, true);
});

test("病房門只有在取得門禁卡後才能開啟", () => {
  let state = Game.createInitialState();

  assert.equal(Game.openDoor(state).state.doorOpen, false);

  state = Game.submitCode(state, "317").state;
  state = Game.takeTool(state).state;
  state = Game.openBottle(state, "C").state;
  const result = Game.openDoor(state);

  assert.equal(result.state.doorOpen, true);
  assert.equal(result.state.ended, true);
});
