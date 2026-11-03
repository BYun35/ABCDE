"use strict";

(() => {
  const Game = window.EscapeRoomGame;
  if (!Game) return;

  let state = Game.createInitialState();
  let codeDiscovered = false;
  const fragments = new Set();
  const inventory = new Set();

  const feedback = document.getElementById("feedback");
  const inventoryEl = document.getElementById("inventory");
  const derivedCodeEl = document.getElementById("derived-code");
  const drawerActions = document.getElementById("drawer-actions");
  const ending = document.getElementById("ending");

  const clues = {
    warning: "床墊下有一張泛黃紙條：「如果你已經醒來，千萬不要相信那個和你長得一模一樣的人。你只有一次機會離開這裡。」",
    patient: "床上躺著一名與你長相完全相同的男性。他的手腕上標示著 NO. 02。",
    bottles: "藥瓶 A：S-17，午夜前服用，數字 3；瓶底寫著「第一個記憶，從夜晚開始。」藥瓶 B：M-02，午夜後服用，數字 1；瓶身寫著「越過零點之後，第一件事就是確認時間。」藥瓶 C：X-00，清晨服用，數字 7；瓶底刻著「最後一次，不代表結束。」",
    calendar: "二月日曆圈出 1 日、3 日、7 日；背面寫著：「不要按照日期排列，要按照一天之中的時間排列。」",
    graffiti: "牆面畫著月亮、時鐘和太陽，分別寫著「結束前」、「越過零點」和「新的開始」。",
    clock: "時鐘停在凌晨 3:17。它看起來像時間，也可能是某種答案。",
    door: "病房門裝有電子鎖，目前無法打開。門口的感應器需要護理站門禁卡。",
    fragments: "病歷碎片說明：NO. 02 病人依午夜前、午夜後、清晨的順序接受三次藥物測試。真正的答案藏在時間的先後之中。"
  };

  function say(message) {
    feedback.textContent = message;
  }

  function renderInventory() {
    inventoryEl.replaceChildren();
    if (inventory.size === 0) {
      const empty = document.createElement("span");
      empty.className = "empty";
      empty.textContent = "目前沒有物品";
      inventoryEl.append(empty);
      return;
    }
    for (const item of inventory) {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.textContent = item;
      inventoryEl.append(chip);
    }
  }

  function renderState() {
    drawerActions.hidden = !state.drawerUnlocked || state.tool;
    ending.hidden = !state.ended;
  }

  document.querySelectorAll("[data-inspect]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.inspect;
      say(clues[key] || "這裡暫時沒有其他線索。");
    });
  });

  document.querySelectorAll("[data-fragment]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.fragment;
      if (fragments.has(id)) {
        say("這片病歷已經收進背包。");
        return;
      }
      fragments.add(id);
      inventory.add("病歷碎片 " + fragments.size + "/3");
      renderInventory();
      say("你收起一片病歷碎片。");
      button.textContent = "已收集";
      button.disabled = true;
    });
  });

  document.getElementById("order-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const order = [
      document.getElementById("order-1").value,
      document.getElementById("order-2").value,
      document.getElementById("order-3").value
    ];
    const code = Game.deriveCode(order);
    if (!code) {
      codeDiscovered = false;
      derivedCodeEl.textContent = "尚未解出";
      say("順序不對。回想午夜前、午夜後和清晨的先後。");
      return;
    }
    codeDiscovered = true;
    derivedCodeEl.textContent = code;
    say("時間順序正確。密碼是 " + code + "。");
  });

  document.getElementById("pin-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = document.getElementById("pin");
    const result = Game.submitCode(state, input.value);
    state = result.state;
    say(result.message);
    input.value = "";
    renderState();
  });

  document.getElementById("take-tool").addEventListener("click", () => {
    const result = Game.takeTool(state);
    state = result.state;
    if (state.tool) inventory.add("小型拆卸工具");
    renderInventory();
    say(state.tool ? result.message + " 紙條寫著：「你已經找到第一個答案。但如果你想知道自己是誰，就去護理站。記住，那裡的紀錄不一定是真相。」" : result.message);
    renderState();
  });

  document.getElementById("open-bottle").addEventListener("click", () => {
    const result = Game.openBottle(state, "C");
    state = result.state;
    if (state.keycard) inventory.add("護理站門禁卡");
    renderInventory();
    say(result.message);
    renderState();
  });

  document.getElementById("open-door").addEventListener("click", () => {
    const result = Game.openDoor(state);
    state = result.state;
    say(result.message);
    renderState();
    if (state.ended) ending.focus();
  });

  renderInventory();
  renderState();
})();
