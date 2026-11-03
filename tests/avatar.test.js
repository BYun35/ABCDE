"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const Avatar=require("../game/avatar.js");
test("走路時雙腿和雙手反向擺動，停止時回到站姿",()=>{
 const p=Avatar.pose(.25,1),q=Avatar.pose(.8,1),idle=Avatar.pose(2,0);
 assert.ok(Math.abs(p.leftLeg)>.1);
 assert.ok(p.leftLeg*p.rightLeg<0);
 assert.ok(p.leftArm*p.leftLeg<0);
 assert.notEqual(p.leftLeg,q.leftLeg);
 assert.equal(idle.leftLeg,0);assert.equal(idle.rightArm,0);assert.equal(idle.bob,0);
});
test("跟隨鏡頭位於角色後方，轉向後位置隨之改變",()=>{
 const a=Avatar.cameraPosition({x:0,z:0},0,-.2),b=Avatar.cameraPosition({x:0,z:0},Math.PI/2,-.2);
 assert.ok(a.z>2);assert.ok(a.y>1.2);
 assert.ok(b.x>2);assert.ok(Math.abs(b.z)<.001);
});
test("靠牆時跟隨鏡頭仍在病房內",()=>{
 for(const player of [{x:4.65,z:5.65},{x:-4.65,z:-5.65}]){
 for(const yaw of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
 const c=Avatar.cameraPosition(player,yaw,-.4);
 assert.ok(c.x>=-4.78&&c.x<=4.78);
 assert.ok(c.z>=-5.78&&c.z<=5.78);
 assert.ok(c.y>=.4&&c.y<=3.25);
 }}
});

test("床上人物與玩家共用外觀，床上人物使用躺姿",()=>{
 const T=require("../game/vendor/three.min.js");
 const player=Avatar.create(T),patient=Avatar.createPatient(T);
 function shape(root){
   const shapes=[];
   root.traverse(o=>{if(o.isMesh&&o.name!=="ground-shadow")shapes.push({
     geometry:o.geometry.type,parameters:o.geometry.parameters,
     color:o.material.color.getHex(),scale:o.scale.toArray()
   });});
   return shapes;
 }
 assert.deepEqual(shape(patient.root),shape(player.root));
 assert.equal(patient.root.rotation.x,-Math.PI/2);
 assert.equal(patient.root.userData.player,false);
 assert.equal(patient.root.getObjectByName("ground-shadow").visible,false);
});
