"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const L2 = require("../game/level2.js");

test("第二關開始時所有隱藏道具與結尾都未解鎖", () => {
  const state = L2.createInitialState();
  assert.equal(state.cassetteFound, false);
  assert.equal(state.tapePlayed, false);
  assert.equal(state.drawerUnlocked, false);
  assert.equal(state.elevatorCard, false);
  assert.equal(state.complete, false);
  assert.match(L2.openDrawer(state).message, /還沒解鎖/);
  assert.equal(L2.openDrawer(state).state.elevatorCard, false);
  assert.match(L2.readFile(state).message, /抽屜還沒打開/);
  assert.match(L2.takeElevatorCard(state).message, /抽屜還沒打開/);
  assert.match(L2.useElevator(state).message, /需要電梯卡/);
});

test("選錯病歷可以重試，選 B 才取得錄音帶", () => {
  let state = L2.createInitialState();
  let result = L2.chooseRecord(state, "A");
  assert.match(result.message, /簽署時間與值班表不一致/);
  assert.equal(result.state.cassetteFound, false);
  result = L2.chooseRecord(result.state, "C");
  assert.match(result.message, /簽署時間與值班表不一致/);
  assert.equal(result.state.cassetteFound, false);
  result = L2.chooseRecord(result.state, "B");
  assert.match(result.message, /錄音帶/);
  assert.equal(result.state.cassetteFound, true);
});

test("沒有取得錄音帶時不能播放，取得後可重播完整錄音文字", () => {
  const state = L2.createInitialState();
  assert.match(L2.playTape(state).message, /還沒有錄音帶/);
  const found = L2.chooseRecord(state, "B").state;
  const played = L2.playTape(found);
  assert.equal(played.state.tapePlayed, true);
  for (const clue of ["原始個體的記憶不能保留", "二月十七日正式啟動", "NO. 02 不得知道自己的真實身分"]) {
    assert.ok(played.message.includes(clue), `錄音缺少內容：${clue}`);
  }
  assert.equal(L2.playTape(played.state).state.tapePlayed, true);
});

test("錄音未播放前無法輸入日期，日期錯誤回饋不同且可重試", () => {
  let state = L2.createInitialState();
  assert.match(L2.submitDate(state, "0217").message, /先播放錄音/);
  state = L2.playTape(L2.chooseRecord(state, "B").state).state;
  let result = L2.submitDate(state, "217");
  assert.match(result.message, /日期資料不完整/);
  assert.equal(result.state.drawerUnlocked, false);
  result = L2.submitDate(result.state, "9999");
  assert.match(result.message, /MMDD/);
  assert.equal(result.state.drawerUnlocked, false);
  result = L2.submitDate(result.state, "0217");
  assert.match(result.message, /抽屜解鎖/);
  assert.equal(result.state.drawerUnlocked, true);
});

test("輸入 0217 後開抽屜，讀實驗檔案、取得電梯卡並完成第二關", () => {
  let state = L2.createInitialState();
  state = L2.playTape(L2.chooseRecord(state, "B").state).state;
  state = L2.submitDate(state, "0217").state;
  state = L2.openDrawer(state).state;
  const file = L2.readFile(state);
  assert.match(file.message, /實驗個體 NO\. 02/);
  assert.match(file.message, /YOU ARE NOT THE ORIGINAL/);
  assert.equal(file.state.elevatorCard, false);
  const card = L2.takeElevatorCard(file.state);
  assert.equal(card.state.elevatorCard, true);
  const ending = L2.useElevator(card.state);
  assert.equal(ending.state.complete, true);
  assert.match(ending.message, /地下研究區|第二關完成/);
});
