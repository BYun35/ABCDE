"use strict";

(() => {
  const Game = window.EscapeRoomGame;
  if (!Game) return;

  let state = Game.createInitialState();
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
    bottles: "藥瓶 A：鎮靜劑 S-17，口服，請於午夜前服用。標籤數字：3。瓶底：「第一個記憶，從夜晚開始。」\n\n藥瓶 B：記憶抑制劑 M-02，口服，請於午夜後服用。標籤數字：1。瓶身背面：「越過零點之後，第一件事就是確認時間。」\n\n藥瓶 C：實驗用藥 X-00，口服，請於清晨服用。標籤數字：7。瓶底：「最後一次，不代表結束。」",
    calendar: "二月日曆有三個紅圈：\n2 月 1 日：午夜前，第一次服藥。\n2 月 3 日：午夜後，第二次服藥。\n2 月 7 日：清晨，最後一次服藥。\n\n背面寫著：「不要按照日期排列，要按照一天之中的時間排列。」",
    graffiti: "牆面有三個手繪符號：\n月亮：「結束前」。\n時鐘：「越過零點」。\n太陽：「新的開始」。\n\n三個符號下方各有一個被塗黑的數字位置。",
    clock: "時鐘停在凌晨 3:17，已停止運作。",
    door: "病房門裝有電子鎖，目前無法打開。門口的感應器需要護理站門禁卡。",
    fragments: "拼合後的病歷：「NO. 02 病人於實驗前接受三次藥物測試。藥物依序為：午夜前、午夜後、清晨。若順序錯誤，記憶恢復程序將無法啟動。」\n\n紅筆圈起的文字：「請勿相信牆上的時間，真正的答案藏在時間的先後之中。」"
  };

  function say(message, targetId) {
    feedback.textContent = message;
    const sceneFeedback = document.getElementById("scene-feedback");
    if (sceneFeedback) sceneFeedback.textContent = message;
    if (targetId) document.getElementById(targetId).textContent = message;
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
    if (window.Ward3D) window.Ward3D.sync(state, [...fragments]);
  }

  document.querySelectorAll("[data-inspect]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.inspect;
      const message = key === "fragments" && fragments.size < 3
        ? "病歷尚未完整（" + fragments.size + "/3）。請找齊床墊下、床頭櫃後方和垃圾桶旁的碎片。"
        : clues[key] || "這裡暫時沒有其他線索。";
      say(message, "explore-feedback");
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
      inventory.delete("病歷碎片 " + (fragments.size - 1) + "/3");
      inventory.add("病歷碎片 " + fragments.size + "/3");
      renderInventory();
      say(fragments.size === 3
        ? "病歷碎片已收齊（3/3），請按「查看病歷內容」閱讀拼合後的線索。"
        : "你收起一片病歷碎片（" + fragments.size + "/3）。", "fragment-feedback");
      button.textContent = "已收集";
      button.disabled = true;
      renderState();
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
      derivedCodeEl.textContent = "尚未解出";
      say("順序不對。回想午夜前、午夜後和清晨的先後。", "order-feedback");
      return;
    }
    derivedCodeEl.textContent = code;
    say("時間順序正確。密碼是 " + code + "。請在下方的床頭櫃密碼鎖輸入。", "order-feedback");
  });

  document.getElementById("pin-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = document.getElementById("pin");
    const result = Game.submitCode(state, input.value);
    state = result.state;
    say(result.message, "drawer-feedback");
    input.value = "";
    renderState();
  });

  document.getElementById("take-tool").addEventListener("click", () => {
    const result = Game.takeTool(state);
    state = result.state;
    if (state.tool) inventory.add("小型拆卸工具");
    renderInventory();
    say(state.tool ? result.message + " 紙條寫著：「你已經找到第一個答案。但如果你想知道自己是誰，就去護理站。記住，那裡的紀錄不一定是真相。」" : result.message, "drawer-feedback");
    renderState();
  });

  document.getElementById("open-bottle").addEventListener("click", () => {
    const result = Game.openBottle(state, "C");
    state = result.state;
    if (state.keycard) inventory.add("護理站門禁卡");
    renderInventory();
    say(result.message, "bottle-feedback");
    renderState();
  });

  function useKeycard() {
    const result = Game.openDoor(state);
    state = result.state;
    say(result.message, "door-feedback");
    renderState();
    if (state.ended) {
      ending.focus({ preventScroll: true });
      ending.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  document.getElementById("open-door").addEventListener("click", useKeycard);
  document.getElementById("scene-reader").addEventListener("click", useKeycard);

  renderInventory();
  renderState();
})();
