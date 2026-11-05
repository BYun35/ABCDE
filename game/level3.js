"use strict";
(function(root){function createInitialState(){return{photos:{A:false,B:false,C:false,D:false},recordRead:false,graffitiRead:false,consoleUnlocked:false,remote:false,videoPlayed:false,memoRead:false,passTaken:false,complete:false}}
const stories={
 A:"照片 A｜簽署同意書\n一名男子坐在醫師面前簽署文件。背面寫著：「我已經考慮很久了，這是我自己的選擇。」隱藏數字：4。",
 B:"照片 B｜進入醫院\n一名男子拿著病歷走進醫院。背面寫著：「從今天開始，我將不再以原本的方式活著。」隱藏數字：1。",
 C:"照片 C｜接受手術\n研究人員在手術台旁準備記憶移植。背面寫著：「記憶移植程序開始，原始個體與複製體即將分離。」隱藏數字：3。",
 D:"照片 D｜記憶清除\n一張空病床旁的監視器顯示病人已甦醒。背面寫著：「記憶清除完成，NO.02 已成功甦醒。」隱藏數字：2."};
function inspectPhoto(s,id){if(!stories[id])return{state:s,message:"找不到這張照片。"};s.photos[id]=true;return{state:s,message:stories[id]}}
function inspectRecord(s){s.recordRead=true;return{state:s,message:"聖安德烈醫院｜機密手術紀錄\n2/14 09:10 簽署實驗同意書\n2/15 23:40 原始個體進入醫院\n2/17 02:17 記憶移植程序開始\n2/17 03:17 NO.02 記憶清除完成\n\n依時間先後排列照片，背面的數字就是控制台密碼。"}}
function inspectGraffiti(s){s.graffitiRead=true;return{state:s,message:"牆上寫著：「先是選擇，再是抵達；接著分離，最後遺忘。」提示照片事件的先後。"}}
function unlock(s,code){if(!Object.values(s.photos).every(Boolean)||!s.recordRead)return{state:s,ok:false,message:"需要先找到四張照片並閱讀手術紀錄，才能解開控制台。"};if(String(code).trim()!=="4132")return{state:s,ok:false,message:"密碼不正確。按紀錄時間排序：同意、入院、移植、清除，再抄下照片背面的數字。"};s.consoleUnlocked=true;return{state:s,ok:true,message:"密碼正確。控制台抽屜解鎖，裡面有監視器遙控器和一張紙條。"}}
function takeRemote(s){if(!s.consoleUnlocked)return{state:s,ok:false,message:"控制台抽屜仍鎖著。"};s.remote=true;return{state:s,ok:true,message:"你拿起監視器遙控器。紙條寫著：「有些事情，只有親眼看見才會相信。」"}}
function playVideo(s){if(!s.remote)return{state:s,ok:false,message:"監視器沒有反應。需要先取得控制台抽屜裡的遙控器。"};s.videoPlayed=true;return{state:s,ok:true,message:"片段一：NO.01 自願簽署同意書，說希望另一個自己能繼續活下去。\n\n片段二：研究員確認 NO.02 複製成功，醫師要求保留必要記憶，但不要讓他知道自己是複製體。\n\n片段三：NO.02 醒來，NO.01 的狀態正在惡化。畫面最後顯示：「原始個體曾經自願參與實驗。」"}}
function readMemo(s){if(!s.videoPlayed)return{state:s,ok:false,message:"先播放監視器影片，控制台才會開放後續資料。"};s.memoRead=true;return{state:s,ok:true,message:"研究員私人備忘錄：NO.01 同意複製實驗。記憶移植後，NO.02 開始產生獨立意識。他不再只是原始個體的複製品。最後一行被劃掉，只剩「NO.02 不可相信……」"}}
function takePass(s){if(!s.videoPlayed)return{state:s,ok:false,message:"先確認監視器裡的實驗紀錄。"};s.passTaken=true;return{state:s,ok:true,message:"取得地下研究區通行證。出口讀卡器已可使用。"}}
function useExit(s){if(!s.passTaken)return{state:s,ok:false,message:"出口需要地下研究區通行證。"};s.complete=true;return{state:s,ok:true,message:"出口解鎖。監視器裡的 NO.01 說：「複製你，從來不是為了讓我活下去，而是為了讓你替我完成一件事。」警示燈閃爍，廣播要求停止 NO.02 的研究權限。第三關完成。"}}
root.SurgeryRoomGame={createInitialState,inspectPhoto,inspectRecord,inspectGraffiti,unlock,takeRemote,playVideo,readMemo,takePass,useExit}})(typeof globalThis==="object"?globalThis:this);
