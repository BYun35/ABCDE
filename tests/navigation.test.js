"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const Nav = require("../game/navigation.js");
const NursingNav = require("../game/nursing-navigation.js");

test("起點可站立，牆外與病床內不可進入", () => {
  assert.equal(Nav.canStand(Nav.START), true);
  for (const p of [{x:5,z:0},{x:0,z:6},{x:-2,z:0}]) assert.equal(Nav.canStand(p), false);
});
test("主角醒來床與原病床都有碰撞，演出後起點可站立", () => {
  assert.equal(Nav.canStand({x:.25,z:0}),false);
  assert.equal(Nav.canStand(Nav.START),true);
});
test("向前、側移與轉向後的移動方向一致", () => {
  let p=Nav.move(Nav.START,0,1,0,1);
  assert.ok(p.z<Nav.START.z);
  assert.equal(p.x,Nav.START.x);
  p=Nav.move(Nav.START,Math.PI/2,1,0,1);
  assert.ok(p.x<Nav.START.x);
  p=Nav.move(Nav.START,0,0,1,1);
  assert.ok(p.x>Nav.START.x);
});
test("長距離移動不穿牆，也不能穿越病床", () => {
  const wall=Nav.move(Nav.START,0,1,0,30);
  assert.equal(Nav.canStand(wall),true);
  assert.ok(wall.z>=-5.65);
  const bed=Nav.move({x:-2,z:3},0,1,0,10);
  assert.ok(bed.z>1.5);
});
test("門禁卡開門後可從病房門口走出病房", () => {
  assert.equal(Nav.canStand({ x: 3, z: -6.2 }), false, "門鎖著時不能穿牆離開");
  assert.equal(Nav.canStand({ x: 3, z: -6.2 }, true), true, "刷卡開門後通道可通行");
  const exit = Nav.move({ x: 3, z: -5.4 }, 0, 1, 0, 1, true);
  assert.ok(exit.z < -6.1, "玩家能實際穿過門口");
});
test("斜向走動不會比較快，互動必須靠近", () => {
  const a=Nav.move(Nav.START,0,1,0,0.5),b=Nav.move(Nav.START,0,1,1,0.5);
  const distance=p=>Math.hypot(p.x-Nav.START.x,p.z-Nav.START.z);
  assert.ok(Math.abs(distance(a)-distance(b))<0.0001);
  assert.equal(Nav.withinReach({x:0,z:0},{x:1,z:1}),true);
  assert.equal(Nav.withinReach({x:0,z:0},{x:4,z:4}),false);
});
test("所有場景互動點都有可走到的操作位置", () => {
  const points=[{x:-2,z:1.5},{x:-3.6,z:-3.4},{x:-4.8,z:-2.2},{x:4.8,z:-1},{x:0,z:-5.8},{x:2,z:-5.7},{x:-.65,z:1.8},{x:-4.3,z:-2.6},{x:3,z:2.4}];
  const queue=[Nav.START],seen=new Set(),reachable=[];
  for(let i=0;i<queue.length;i++){
    const p=queue[i],k=p.x.toFixed(1)+","+p.z.toFixed(1);
    if(seen.has(k))continue;seen.add(k);reachable.push(p);
    for(const [dx,dz]of [[.5,0],[-.5,0],[0,.5],[0,-.5]]){
      const next={x:Math.round((p.x+dx)*10)/10,z:Math.round((p.z+dz)*10)/10};
      if(Nav.canStand(next)&&!seen.has(next.x.toFixed(1)+","+next.z.toFixed(1)))queue.push(next);
    }
  }
  for(const point of points)assert.ok(reachable.some(p=>Nav.withinReach(p,point)),JSON.stringify(point));
});

test("護理站有獨立起點、房間邊界與桌子和電梯的碰撞", () => {
  assert.equal(NursingNav.canStand(NursingNav.START), true);
  assert.ok(NursingNav.START.z < 3, "起點需留出第三人稱鏡頭距離");
  assert.equal(NursingNav.canStand({ x: 7, z: 0 }), false);
  assert.equal(NursingNav.canStand({ x: 0, z: -8 }), false);
  assert.equal(NursingNav.canStand({ x: 0, z: -1.7 }), false);
});

test("護理站電梯門是實體障礙", () => {
  for (const point of [{ x: 4.75, z: -6.82 }]) {
    assert.equal(NursingNav.canStand(point), false, JSON.stringify(point));
  }
});

test("場景移除劇情未使用的空收納櫃與診療車", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const scene = fs.readFileSync(path.join(__dirname, "../game/scene.js"), "utf8");
  assert.doesNotMatch(scene, /醫療收納櫃|const trolley/);
});

test("值班桌上的病歷分開擺放，錄音與日期裝置在另一個工作區", () => {
  const { recordA, recordB, recordC, recorder, keypad } = NursingNav.TARGETS;
  const records = [recordA, recordB, recordC];
  assert.ok(new Set(records.map(point => point.z)).size > 1, "病歷不可全排在同一直線");
  assert.ok(Math.hypot(recorder.x - recordB.x, recorder.z - recordB.z) > 2.5, "錄音設備要移到分開的工作區");
  assert.ok(Math.abs(keypad.z - recorder.z) < .1,
    "日期裝置放在錄音設備旁");
  assert.ok(Math.abs(keypad.x - recorder.x) > .5, "錄音設備和日期裝置要分開可辨認");
});

test("護理站桌面、錄音帶、日期裝置與抽屜都不能穿過", () => {
  for (const point of [
    { x: 0, z: -1.7 },
    NursingNav.TARGETS.recorder,
    NursingNav.TARGETS.keypad,
    { x: -2.82, z: -2.3 }
  ]) {
    assert.equal(NursingNav.canStand(point), false, JSON.stringify(point));
  }
  const approaches = [
    { x: 3.1, z: -4.0 },
    { x: 4.2, z: -4.0 },
    { x: -2.82, z: -3.3 }
  ];
  for (const point of approaches) assert.equal(NursingNav.canStand(point), true, JSON.stringify(point));
});

test("抽屜裡的電梯卡放在桌外可見且可走近的位置", () => {
  const card = NursingNav.TARGETS.elevatorCard;
  assert.equal(NursingNav.canStand(card), false, "玩家不能走進抽屜裡的卡片位置");
  const approach = { x: -2.8, z: -3.3 };
  assert.equal(NursingNav.canStand(approach), true);
  assert.equal(NursingNav.withinReach(approach, card), true);
});

test("護理站可走到值班表、三份病歷、錄音機、抽屜與電梯感應器", () => {
  const queue = [NursingNav.START], seen = new Set(), reachable = [];
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i], key = p.x.toFixed(1) + "," + p.z.toFixed(1);
    if (seen.has(key)) continue;
    seen.add(key); reachable.push(p);
    for (const [dx, dz] of [[.5, 0], [-.5, 0], [0, .5], [0, -.5]]) {
      const next = { x: Math.round((p.x + dx) * 10) / 10, z: Math.round((p.z + dz) * 10) / 10 };
      if (NursingNav.canStand(next) && !seen.has(next.x.toFixed(1) + "," + next.z.toFixed(1))) queue.push(next);
    }
  }
  for (const [name, point] of Object.entries(NursingNav.TARGETS)) {
    assert.ok(reachable.some(p => NursingNav.withinReach(p, point)), name + " 無法走近");
  }
});

test("護理站長距離移動不會穿牆或穿過值班桌", () => {
  const wall = NursingNav.move(NursingNav.START, 0, 1, 0, 40);
  assert.equal(NursingNav.canStand(wall), true);
  assert.ok(wall.z >= NursingNav.BOUNDS.minZ + .28);
  const desk = NursingNav.move({ x: 0, z: 1 }, 0, 1, 0, 10);
  assert.ok(desk.z > -.65);
});
