"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const I=require("../game/interaction.js");
test("附近選項排除過遠、遮擋與已拾取物件",()=>{
 const p={x:0,z:0},items=[
 {id:"near",location:{x:1,z:0}},
 {id:"far",location:{x:4,z:0}},
 {id:"blocked",location:{x:1,z:1}},
 {id:"collected",location:{x:.5,z:0},visible:false}
 ];
 assert.deepEqual(I.nearby(p,items,t=>t.id!=="blocked").map(t=>t.id),["near"]);
});
test("互動距離以玩家而非跟隨鏡頭為準",()=>{
 const p={x:0,z:0},t={id:"card",location:{x:0,z:4}};
 assert.equal(I.nearby(p,[t],()=>true).length,0);
});
test("抽屜與藥瓶 C 依取得進度切換動作",()=>{
 assert.equal(I.action("cabinet",{}),"pin");
 assert.equal(I.action("cabinet",{drawerUnlocked:true}),"take-tool");
 assert.equal(I.action("bottle-C",{}),"inspect-bottles");
 assert.equal(I.action("bottle-C",{tool:true}),"open-bottle");
 assert.equal(I.action("bottle-C",{tool:true,keycard:true}),"inspect-bottles");
});
test("準星沒有命中時，E 選距離最近的可互動物件",()=>{
 const p={x:0,z:0},items=[{id:"bed",location:{x:2,z:0}},{id:"paper",location:{x:.7,z:.1}}];
 assert.equal(I.nearby(p,items,()=>true)[0].id,"paper");
});

test("櫃旁按 E 優先拾取可用碎片，不被準星命中的密碼鎖搶走",()=>{
 const cabinet={id:"cabinet",location:{x:-3.6,z:-3.4}};
 const paper={id:"paper",fragment:"cabinet",location:{x:-4.3,z:-2.6}};
 const available=I.nearby({x:-3.8,z:-2.2},[cabinet,paper],()=>true);
 assert.equal(I.chooseTarget(cabinet,available),paper);
});

test("拾取優先仍受距離、遮擋及已收集條件限制",()=>{
 const p={x:0,z:0},cabinet={id:"cabinet",location:{x:1,z:0}};
 const papers=[
   {id:"far",fragment:"bed",location:{x:4,z:0}},
   {id:"blocked",fragment:"bin",location:{x:.7,z:0}},
   {id:"collected",fragment:"cabinet",location:{x:.5,z:0},visible:false}
 ];
 const available=I.nearby(p,[cabinet,...papers],t=>t.id!=="blocked");
 assert.equal(I.chooseTarget(cabinet,available),cabinet);
});

test("收完附近碎片後 E 恢復準星或最近物件，瞄準碎片仍可選取",()=>{
 const cabinet={id:"cabinet"},paper={id:"paper",fragment:"cabinet"},other={id:"other",fragment:"bed"};
 assert.equal(I.chooseTarget(paper,[other,paper,cabinet]),paper);
 assert.equal(I.chooseTarget(cabinet,[cabinet]),cabinet);
 assert.equal(I.chooseTarget(null,[cabinet]),cabinet);
 assert.equal(I.chooseTarget(null,[]),null);
});

