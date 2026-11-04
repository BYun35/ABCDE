"use strict";
(function(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.NursingStationGame = api;
})(typeof globalThis === "object" ? globalThis : this, function() {
  const TAPE_TRANSCRIPT = [
    "醫師：「原始個體的記憶不能保留，否則複製體將無法穩定。」",
    "醫師：「實驗必須在二月十七日正式啟動。」",
    "醫師：「NO. 02 不得知道自己的真實身分。」"
  ].join("\n\n");

  const FILE_TRANSCRIPT = [
    "機密文件：實驗個體 NO. 02",
    "性別：男性",
    "基因來源：NO. 01",
    "實驗目的：複製原始個體",
    "記憶狀態：部分植入",
    "實驗結果：成功甦醒",
    "研究員備註：「NO. 02 目前仍相信自己是原始個體，請勿讓其接觸 NO. 01。」",
    "YOU ARE NOT THE ORIGINAL.",
    "你並不是原始個體。"
  ].join("\n");

  function createInitialState() {
    return {
      wrongRecordAttempts: 0,
      cassetteFound: false,
      tapePlayed: false,
      dateAttempts: 0,
      drawerUnlocked: false,
      drawerOpen: false,
      fileRead: false,
      elevatorCard: false,
      complete: false
    };
  }

  function reply(state, message) {
    return { state: Object.assign({}, state), message };
  }

  function chooseRecord(state, record) {
    if (state.cassetteFound) return reply(state, "病歷 B 背面的錄音帶已經取出。");
    if (record === "B") {
      return reply(Object.assign({}, state, { cassetteFound: true }), "你找出簽名時間不符的病歷 B，背面掉出一卷錄音帶。");
    }
    if (record !== "A" && record !== "C") return reply(state, "請選擇病歷 A、B 或 C。");
    return reply(Object.assign({}, state, { wrongRecordAttempts: state.wrongRecordAttempts + 1 }), "簽署時間與值班表不一致，但這不是目前要找的病歷。請再比對值班時間。");
  }

  function playTape(state) {
    if (!state.cassetteFound) return reply(state, "你還沒有錄音帶。先找出簽名時間有問題的病歷。");
    return reply(Object.assign({}, state, { tapePlayed: true }), TAPE_TRANSCRIPT + "\n\n錄音機旁的螢幕顯示：「請輸入實驗啟動日期（MMDD）。」");
  }

  function submitDate(state, value) {
    if (!state.tapePlayed) return reply(state, "請先播放錄音，再輸入實驗啟動日期。");
    if (state.drawerUnlocked) return reply(state, "隱藏抽屜已解鎖。");
    if (String(value).trim() === "0217") return reply(Object.assign({}, state, { drawerUnlocked: true }), "日期正確。桌子下方的隱藏抽屜解鎖了。");
    const dateAttempts = state.dateAttempts + 1;
    const message = dateAttempts === 1
      ? "日期資料不完整。"
      : dateAttempts === 2
        ? "請依 MMDD 格式輸入。"
        : "日期錯誤。你仍可重播錄音並繼續嘗試。";
    return reply(Object.assign({}, state, { dateAttempts }), message);
  }

  function openDrawer(state) {
    if (!state.drawerUnlocked) return reply(state, "隱藏抽屜還沒解鎖。");
    return reply(Object.assign({}, state, { drawerOpen: true }), "隱藏抽屜打開了，裡面有實驗檔案和電梯卡。");
  }

  function readFile(state) {
    if (!state.drawerOpen) return reply(state, "抽屜還沒打開，無法查看檔案。");
    return reply(Object.assign({}, state, { fileRead: true }), FILE_TRANSCRIPT);
  }

  function takeElevatorCard(state) {
    if (!state.drawerOpen) return reply(state, "抽屜還沒打開，無法取得電梯卡。");
    return reply(Object.assign({}, state, { elevatorCard: true }), "你取得了地下研究區電梯卡。");
  }

  function useElevator(state) {
    if (!state.elevatorCard) return reply(state, "電梯感應器需要電梯卡（地下研究區電梯卡）才能使用。");
    return reply(Object.assign({}, state, { complete: true }), "警告！NO. 02 已取得實驗資料，請立即啟動封鎖程序。第二關完成。");
  }

  return {
    createInitialState,
    chooseRecord,
    playTape,
    submitDate,
    openDrawer,
    readFile,
    takeElevatorCard,
    useElevator,
    TAPE_TRANSCRIPT,
    FILE_TRANSCRIPT
  };
});
