"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const Game = require("../game/game.js");

function setup() {
  const nodes = new Map();
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
  const parts = ["bed", "cabinet", "bin"].map(id => el("fragment-" + id, { fragment: id }));
  const document = {
    getElementById: el,
    createElement: () => ({ textContent: "" }),
    querySelectorAll: selector => selector === "[data-inspect]" ? [inspect] : parts
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../game/app.js"), "utf8"),
    { window: { EscapeRoomGame: Game }, document, Set });
  const click = id => el(id).events.click();
  return { el, click, inspect, parts };
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
