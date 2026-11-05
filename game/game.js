"use strict";

(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.EscapeRoomGame = api;
})(typeof globalThis === "object" ? globalThis : this, function () {
  const VALID_ORDER = ["A", "B", "C"];
  const CODE_BY_BOTTLE = { A: "3", B: "1", C: "7" };

  function createInitialState() {
    return {
      attempts: 0,
      drawerUnlocked: false,
      tool: false,
      keycard: false,
      doorOpen: false,
      ended: false
    };
  }

  function copyState(state, changes) {
    return Object.assign({}, state, changes);
  }

  function reply(state, message) {
    return { state, message };
  }

  function deriveCode(order) {
    if (!Array.isArray(order) || order.length !== VALID_ORDER.length) return null;
    if (order.some((bottle, index) => bottle !== VALID_ORDER[index])) return null;
    return order.map((bottle) => CODE_BY_BOTTLE[bottle]).join("");
  }

  function submitCode(state, value) {
    if (state.drawerUnlocked) return reply(copyState(state, {}), "抽屜已經打開。");
    if (String(value).trim() === "317") {
      return reply(copyState(state, { drawerUnlocked: true }), "密碼正確。床頭櫃抽屜解鎖了。");
    }

    const attempts = state.attempts + 1;
    const message = attempts === 1
      ? "記憶資料不完整。"
      : attempts === 2
        ? "燈光閃爍，錄音響起：「你又忘記了……每一次都是這樣。」"
        : "密碼錯誤。你仍可繼續嘗試。";

    return reply(copyState(state, { attempts }), message);
  }

  function takeTool(state) {
    if (!state.drawerUnlocked) return reply(copyState(state, {}), "抽屜還沒解鎖。");
    return reply(copyState(state, { tool: true }), "你拿到小型拆卸工具和一張紙條。");
  }

  function openBottle(state, bottle) {
    if (!state.tool) return reply(copyState(state, {}), "你還沒有拆卸工具。");
    if (bottle !== "C") return reply(copyState(state, {}), "工具卡不進這個瓶底。");
    return reply(copyState(state, { keycard: true }), "你拆開藥瓶 C 的瓶底，取出護理站門禁卡。");
  }

  function openDoor(state) {
    if (!state.keycard) return reply(copyState(state, {}), "感應器需要門禁卡。");
    return reply(copyState(state, { doorOpen: true, ended: true }), "門鎖解除。走廊廣播響起，第一關結束。");
  }

  return {
    createInitialState,
    deriveCode,
    submitCode,
    takeTool,
    openBottle,
    openDoor
  };
});
