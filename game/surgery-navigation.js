"use strict";
(function(root){const BOUNDS={minX:-5.7,maxX:9.4,minZ:-6.7,maxZ:6.7},START={x:0,z:4.8},OBSTACLES=[
{x:0,z:-1.2,w:2.8,d:1.6},{x:-4.7,z:-.25,w:1.05,d:.48},{x:4.55,z:-.18,w:1.25,d:1.25},
{x:6,z:-1.925,w:.28,d:10.15},{x:6,z:6.175,w:.28,d:1.65},{x:6,z:4.25,w:.28,d:2.1,exitDoor:true},
{x:7.8,z:3.02,w:3.7,d:.16},{x:7.8,z:5.48,w:3.7,d:.16},{x:9.32,z:4.25,w:.16,d:2.6}
],TARGETS={photoA:{x:-4.15,z:-5.55},photoB:{x:-1.4,z:-5.55},photoC:{x:1.4,z:-5.55},photoD:{x:4.15,z:-5.55},record:{x:-4.7,z:-.2},graffiti:{x:0,z:5.7},console:{x:4.55,z:-.2},drawer:{x:4.25,z:-1.15},monitor:{x:4.7,z:-5.3},exit:{x:5.4,z:4.25},memo:{x:3.7,z:-1.25},pass:{x:4.8,z:-1.25}};
function canStand(p,exitUnlocked=false){const r=.28;if(p.x<BOUNDS.minX+r||p.x>BOUNDS.maxX-r||p.z<BOUNDS.minZ+r||p.z>BOUNDS.maxZ-r)return false;return !OBSTACLES.some(b=>!(b.exitDoor&&exitUnlocked)&&Math.abs(p.x-b.x)<b.w/2+r&&Math.abs(p.z-b.z)<b.d/2+r)}
function move(p,yaw,fwd,right,dist,exitUnlocked=false){const n=Math.hypot(fwd,right);if(!n)return{x:p.x,z:p.z};const f=fwd/n,r=right/n,dx=(-Math.sin(yaw)*f+Math.cos(yaw)*r)*dist,dz=(-Math.cos(yaw)*f-Math.sin(yaw)*r)*dist,steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.08)),q={x:p.x,z:p.z};for(let i=0;i<steps;i++){if(canStand({x:q.x+dx/steps,z:q.z},exitUnlocked))q.x+=dx/steps;if(canStand({x:q.x,z:q.z+dz/steps},exitUnlocked))q.z+=dz/steps}return q}
function withinReach(p,t){return Math.hypot(p.x-t.x,p.z-t.z)<=2.4}
root.WardSurgeryNavigation={BOUNDS,START,OBSTACLES,TARGETS,canStand,move,withinReach}})(typeof globalThis==="object"?globalThis:this);
