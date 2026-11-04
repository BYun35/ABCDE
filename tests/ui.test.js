"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const Game = require("../game/game.js");

function setup() {
  const nodes = new Map();
  const popups = [];
  function el(id, dataset = {}) {
    if (!nodes.has(id)) nodes.set(id, {
      id, dataset, textContent: "", value: "", hidden: false,
      children: [], events: {}, disabled: false,
      addEventListener(type, fn) { this.events[type] = fn; },
      replaceChildren() { this.children = []; },
      append(child) { this.children.push(child); },
      focus() {}, scrollIntoView() {}
    });
    return nodes.get(id);
  }
  const inspect = el("inspect-fragments", { inspect: "fragments" });
  const inspections = [inspect, ...["calendar", "graffiti", "clock"].map(key => el("inspect-" + key, { inspect: key }))];
  const parts = ["bed", "cabinet", "bin"].map(id => el("fragment-" + id, { fragment: id }));
  const document = {
    getElementById: el,
    createElement: () => ({ textContent: "" }),
    querySelectorAll: selector => selector === "[data-inspect]" ? inspections : parts
  };
  const window = { EscapeRoomGame: Game, Ward3D: {
    sync() {},
    updateDialog() {},
    notifyPopup(popup) { popups.push(popup); }
  } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../game/app.js"), "utf8"),
    { window, document, Set });
  const click = id => el(id).events.click();
  return { el, click, inspect, parts, popups };
}

test("收齊三片之前不顯示完整病歷，收齊後才能讀取", () => {
  const { el, click, parts } = setup();
  click("inspect-fragments");
  assert.match(el("feedback").textContent, /0\/3/);
  assert.doesNotMatch(el("feedback").textContent, /NO\. 02 病人/);
  parts[0].events.click();
  click("inspect-fragments");
  assert.match(el("feedback").textContent, /1\/3/);
  parts[1].events.click();
  parts[2].events.click();
  click("inspect-fragments");
  assert.match(el("feedback").textContent, /NO\. 02 病人/);
});

test("背包只顯示一個病歷進度，收集回饋顯示於收集區", () => {
  const { el, parts } = setup();
  parts.forEach(part => part.events.click());
  assert.deepEqual(el("inventory").children.map(child => child.textContent), ["病歷碎片 3/3"]);
  assert.match(el("fragment-feedback").textContent, /3\/3/);
});

test("排序與線索在操作區顯示回饋，道具仍可依序通關", () => {
  const { el, click } = setup();
  click("inspect-fragments");
  assert.match(el("explore-feedback").textContent, /0\/3/);
  click("open-bottle");
  assert.match(el("bottle-feedback").textContent, /沒有拆卸工具/);
  click("open-door");
  assert.match(el("door-feedback").textContent, /需要門禁卡/);
  ["C", "A", "B"].forEach((v, i) => el("order-" + (i + 1)).value = v);
  el("order-form").events.submit({ preventDefault() {} });
  assert.match(el("order-feedback").textContent, /順序不對/);
  ["A", "B", "C"].forEach((v, i) => el("order-" + (i + 1)).value = v);
  el("order-form").events.submit({ preventDefault() {} });
  assert.match(el("order-feedback").textContent, /317/);
  el("pin").value = "317";
  el("pin-form").events.submit({ preventDefault() {} });
  click("take-tool"); click("open-bottle"); click("open-door");
  assert.equal(el("ending").hidden, false);
  assert.match(el("door-feedback").textContent, /第一關結束/);
});

test("日曆與病歷保留規格中的完整時間線索", () => {
  const { el, click, parts } = setup();
  click("inspect-calendar");
  const calendar = el("explore-feedback").textContent;
  assert.match(calendar, /2 月 1 日：午夜前/);
  assert.match(calendar, /2 月 3 日：午夜後/);
  assert.match(calendar, /2 月 7 日：清晨/);
  parts.forEach(part => part.events.click());
  click("inspect-fragments");
  assert.match(el("explore-feedback").textContent, /若順序錯誤，記憶恢復程序將無法啟動/);
  assert.match(el("explore-feedback").textContent, /請勿相信牆上的時間/);
});

test("病房畫面的感應器和下方按鈕都能刷卡", () => {
  const { el, click } = setup();
  click("scene-reader");
  assert.equal(el("ending").hidden, true);
  assert.match(el("door-feedback").textContent, /需要門禁卡/);
  el("pin").value = "317";
  el("pin-form").events.submit({ preventDefault() {} });
  click("take-tool"); click("open-bottle"); click("scene-reader");
  assert.equal(el("ending").hidden, false);
});

test("取得病歷碎片、拆卸工具與門禁卡時回報重要物品名稱", () => {
  const { el, click, parts, popups } = setup();
  parts[0].events.click();
  assert.equal(popups[0].title, "取得重要物品");
  assert.match(popups[0].item, /病歷碎片（1\/3）/);

  el("pin").value = "317";
  el("pin-form").events.submit({ preventDefault() {} });
  click("take-tool");
  assert.equal(popups[1].title, "取得重要物品");
  assert.equal(popups[1].item, "小型拆卸工具");

  click("open-bottle");
  assert.equal(popups[2].title, "取得重要物品");
  assert.equal(popups[2].item, "護理站門禁卡");
});
