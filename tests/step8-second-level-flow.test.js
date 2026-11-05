"use strict";

const assert = require("node:assert/strict");
const Nursing = require("../game/level2.js");

let state = Nursing.createInitialState();
state = Nursing.chooseRecord(state, "B").state;
state = Nursing.playTape(state).state;
state = Nursing.submitDate(state, "0217").state;
state = Nursing.openDrawer(state).state;

const beforeReading = Nursing.takeElevatorCard(state);
assert.equal(beforeReading.state.elevatorCard, false);
assert.match(beforeReading.message, /閱讀|檔案/);

state = Nursing.readFile(state).state;
state = Nursing.takeElevatorCard(state).state;
assert.equal(state.elevatorCard, true);

const completed = Nursing.useElevator(state).state;
assert.equal(completed.complete, true);

console.log("PASS second-level-file-reading-gate");
