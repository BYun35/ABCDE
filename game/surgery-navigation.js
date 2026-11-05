"use strict";
(function(root){const BOUNDS={minX:-5.7,maxX:5.7,minZ:-6.7,maxZ:6.7},START={x:0,z:4.8},OBSTACLES=[
// 手術台：阻擋玩家走進台面與躺在台上的模型。
{x:0,z:-1.2,w:2.8,d:1.6},
// 醫療推車上的手術紀錄板。
{x:-4.7,z:-.25,w:1.05,d:.48},
// 控制台連同向外滑出的抽屜。
{x:4.55,z:-.18,w:1.25,d:1.25}
],TARGETS={
photoA:{x:-4.15,z:-5.55},photoB:{x:-1.4,z:-5.55},photoC:{x:1.4,z:-5.55},photoD:{x:4.15,z:-5.55},
record:{x:-4.7,z:-.2},graffiti:{x:0,z:5.7},console:{x:4.55,z:-.2},drawer:{x:4.25,z:-1.15},
monitor:{x:4.7,z:-5.3},exit:{x:5.4,z:4.25},memo:{x:3.7,z:-1.25},pass:{x:4.8,z:-1.25}};
function canStand(p){const r=.28;if(p.x<BOUNDS.minX+r||p.x>BOUNDS.maxX-r||p.z<BOUNDS.minZ+r||p.z>BOUNDS.maxZ-r)return false;return !OBSTACLES.some(b=>Math.abs(p.x-b.x)<b.w/2+r&&Math.abs(p.z-b.z)<b.d/2+r)}
function move(p,yaw,fwd,right,dist){const n=Math.hypot(fwd,right);if(!n)return{x:p.x,z:p.z};const f=fwd/n,r=right/n,dx=(-Math.sin(yaw)*f+Math.cos(yaw)*r)*dist,dz=(-Math.cos(yaw)*f-Math.sin(yaw)*r)*dist,steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.08)),q={x:p.x,z:p.z};for(let i=0;i<steps;i++){if(canStand({x:q.x+dx/steps,z:q.z}))q.x+=dx/steps;if(canStand({x:q.x,z:q.z+dz/steps}))q.z+=dz/steps}return q}
function withinReach(p,t){return Math.hypot(p.x-t.x,p.z-t.z)<=2.4}
root.WardSurgeryNavigation={BOUNDS,START,OBSTACLES,TARGETS,canStand,move,withinReach}})(typeof globalThis==="object"?globalThis:this);
