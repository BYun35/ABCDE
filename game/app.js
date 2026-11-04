"use strict";

(() => {
  const Game = window.EscapeRoomGame;
  if (!Game) return;
  const Nursing = window.NursingStationGame;

  let state = Game.createInitialState();
  let nursingState = Nursing.createInitialState();
  const fragments = new Set();
  const fragmentText = {
    bed: "NO. 02 病人於實驗前接受三次藥物測試。",
    cabinet: "藥物依序為：午夜前、午夜後、清晨。",
    bin: "若順序錯誤，記憶恢復程序將無法啟動。\n\n紅筆圈起的文字：「請勿相信牆上的時間，真正的答案藏在時間的先後之中。」"
  };
  const inventory = new Set();

  const feedback = document.getElementById("feedback");
  const inventoryEl = document.getElementById("inventory");
  const derivedCodeEl = document.getElementById("derived-code");
  const drawerActions = document.getElementById("drawer-actions");
  const ending = document.getElementById("ending");
  const enterStationButton = document.getElementById("enter-nursing-station");
  const nursingStation = document.getElementById("nursing-station");
  const gameLayout = document.getElementById("game-layout");
  const nurseFeedback = document.getElementById("nurse-feedback");
  const nursingPanels = ["nurse-record-panel", "cassette-panel", "nurse-drawer-panel", "nurse-elevator-panel", "nursing-ending"];

  function closeNursingPanel() {
    nursingStation.hidden = true;
    nursingPanels.forEach(id => { document.getElementById(id).dataset.active = "false"; });
    window.Ward3D?.closeNursingPanel?.();
  }

  function openNursingPanel(id, title) {
    const panel = document.getElementById(id);
    if (!panel || panel.hidden) return;
    nursingPanels.forEach(panelId => { document.getElementById(panelId).dataset.active = panelId === id ? "true" : "false"; });
    nursingStation.hidden = false;
    document.getElementById("nursing-title").textContent = title || "護理站調查";
    document.getElementById("close-nursing-panel").focus({ preventScroll: true });
  }

  if (window.Ward3D) {
    window.Ward3D.openNursingPanel = openNursingPanel;
    window.Ward3D.closeNursingPanel = () => canvasForNursing()?.focus({ preventScroll: true });
  }

  function canvasForNursing() { return document.getElementById("ward-canvas"); }

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
    if (targetId === "drawer-feedback") window.Ward3D?.updateDialog(message, "密碼鎖");
  }

  function showItemPopup(item, message, kind = "important") {
    window.Ward3D?.notifyPopup({ title: "取得重要物品", item, message, kind });
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
    enterStationButton.hidden = !state.ended;
    if (window.Ward3D) window.Ward3D.sync(state, [...fragments]);
  }

  function renderNursingState(message) {
    if (message) nurseFeedback.textContent = message;
    document.getElementById("cassette-panel").hidden = !nursingState.cassetteFound;
    document.getElementById("nurse-date-form").hidden = !nursingState.tapePlayed;
    document.getElementById("nurse-tape-transcript").hidden = !nursingState.tapePlayed;
    document.getElementById("nurse-drawer-panel").hidden = !nursingState.drawerUnlocked;
    document.getElementById("nurse-drawer-contents").hidden = !nursingState.drawerOpen;
    document.getElementById("nurse-file-transcript").hidden = !nursingState.fileRead;
    document.getElementById("take-elevator-card").hidden = nursingState.elevatorCard;
    document.getElementById("nurse-elevator-panel").hidden = !nursingState.elevatorCard || nursingState.complete;
    document.getElementById("nursing-ending").hidden = !nursingState.complete;
    window.Ward3D?.syncNursing?.(nursingState);
  }

  function enterNursingStation() {
    if (!state.ended) return;
    gameLayout.hidden = false;
    nursingStation.hidden = true;
    enterStationButton.hidden = true;
    document.documentElement.classList.add("nursing-mode");
    document.body.classList.add("nursing-mode");
    document.getElementById("page-brand").textContent = "時空密室・第二關";
    document.getElementById("page-title").textContent = "被篡改的記錄";
    document.getElementById("header-note").textContent = "資料調查 · 護理站";
    document.getElementById("stage-eyebrow").textContent = "護理站 · 實驗紀錄室";
    document.getElementById("stage-title").textContent = "值班表上的不可能簽名";
    document.getElementById("stage-description").textContent = "先找出哪份病歷遭到竄改，再追查實驗日期。";
    document.title = "時空密室｜第二關：被篡改的記錄";
    window.Ward3D?.enterNursingStation();
    renderNursingState("沿著值班桌旁的護理師值班表與病歷開始調查。靠近物件後按 E。 ");
  }

  enterStationButton.addEventListener("click", enterNursingStation);
  document.getElementById("close-nursing-panel").addEventListener("click", closeNursingPanel);
  ["A", "B", "C"].forEach(record => {
    document.getElementById("nurse-record-" + record.toLowerCase()).addEventListener("click", () => {
      const result = Nursing.chooseRecord(nursingState, record);
      nursingState = result.state;
      renderNursingState(result.message);
      closeNursingPanel();
      window.Ward3D?.notifyPopup({ title: record === "B" ? "取得重要線索" : "病歷檢查結果", item: record === "B" ? "錄音帶" : "病歷 " + record, message: result.message, kind: record === "B" ? "important" : "clue" });
    });
  });

  document.getElementById("play-nurse-tape").addEventListener("click", () => {
    const result = Nursing.playTape(nursingState);
    nursingState = result.state;
    document.getElementById("nurse-tape-transcript").textContent = result.message;
    renderNursingState(nursingState.tapePlayed ? "錄音機播放出一段醫師的談話。" : result.message);
  });

  document.getElementById("nurse-date-form").addEventListener("submit", event => {
    event.preventDefault();
    const result = Nursing.submitDate(nursingState, document.getElementById("nurse-date").value);
    nursingState = result.state;
    renderNursingState(result.message);
    if (nursingState.drawerUnlocked) {
      closeNursingPanel();
      window.Ward3D?.notifyPopup({ title: "日期正確", item: "0217", message: result.message, kind: "important" });
    }
  });

  document.getElementById("open-nurse-drawer").addEventListener("click", () => {
    const result = Nursing.openDrawer(nursingState);
    nursingState = result.state;
    renderNursingState(result.message);
    window.Ward3D?.notifyPopup({ title: "隱藏抽屜", item: "機密文件與電梯卡", message: result.message, kind: "important" });
  });

  document.getElementById("read-nurse-file").addEventListener("click", () => {
    const result = Nursing.readFile(nursingState);
    nursingState = result.state;
    document.getElementById("nurse-file-transcript").textContent = result.message;
    renderNursingState("你讀完了抽屜裡的機密文件。");
    window.Ward3D?.notifyPopup({ title: "實驗檔案", message: result.message, kind: "important" });
  });

  document.getElementById("take-elevator-card").addEventListener("click", () => {
    const result = Nursing.takeElevatorCard(nursingState);
    nursingState = result.state;
    renderNursingState(result.message);
    window.Ward3D?.notifyPopup({ title: "取得重要物品", item: "地下研究區電梯卡", message: result.message, kind: "important" });
  });

  document.getElementById("use-elevator-card").addEventListener("click", () => {
    const result = Nursing.useElevator(nursingState);
    nursingState = result.state;
    renderNursingState(result.message);
    if (nursingState.complete) window.Ward3D?.notifyPopup({ title: "第二關完成", message: result.message, kind: "important" });
  });

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
      const message = "紙片內容：\n\n" + fragmentText[id];
      say("你收起一片病歷碎片（" + fragments.size + "/3）。", "fragment-feedback");
      showItemPopup("病歷碎片（" + fragments.size + "/3）", message, "fragment");
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
    const hadTool = state.tool;
    const result = Game.takeTool(state);
    state = result.state;
    if (state.tool) inventory.add("小型拆卸工具");
    renderInventory();
    const message = state.tool ? result.message + "\n\n紙條內容：\n「你已經找到第一個答案。但如果你想知道自己是誰，就去護理站。記住，那裡的紀錄不一定是真相。」" : result.message;
    say(message, "drawer-feedback");
    if (state.tool && !hadTool) showItemPopup("小型拆卸工具", message);
    renderState();
  });

  document.getElementById("open-bottle").addEventListener("click", () => {
    const hadKeycard = state.keycard;
    const result = Game.openBottle(state, "C");
    state = result.state;
    if (state.keycard) inventory.add("護理站門禁卡");
    renderInventory();
    say(result.message, "bottle-feedback");
    if (state.keycard && !hadKeycard) showItemPopup("護理站門禁卡", result.message);
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

  renderNursingState();
  renderInventory();
  renderState();
})();
