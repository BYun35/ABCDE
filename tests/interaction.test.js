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
