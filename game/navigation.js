"use strict";
(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(root)root.WardNavigation=api;
})(typeof globalThis==="object"?globalThis:this,function(){
  const START={x:0,z:4.4};
  const OBSTACLES=[
    {x:-2,z:0,w:2,d:3},
    {x:-3.6,z:-3.4,w:1.4,d:1.0},
    {x:3.5,z:2.8,w:.65,d:.65}
  ];
  function canStand(p){
    const r=.28;
    if(p.x<-4.65||p.x>4.65||p.z<-5.65||p.z>5.65)return false;
    return !OBSTACLES.some(b=>Math.abs(p.x-b.x)<b.w/2+r&&Math.abs(p.z-b.z)<b.d/2+r);
  }
  function move(position,yaw,forward,right,distance){
    const length=Math.hypot(forward,right);
    if(!length)return {x:position.x,z:position.z};
    const f=forward/length,r=right/length;
    const dx=(-Math.sin(yaw)*f+Math.cos(yaw)*r)*distance;
    const dz=(-Math.cos(yaw)*f-Math.sin(yaw)*r)*distance;
    const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.08));
    const p={x:position.x,z:position.z};
    for(let i=0;i<steps;i++){
      if(canStand({x:p.x+dx/steps,z:p.z}))p.x+=dx/steps;
      if(canStand({x:p.x,z:p.z+dz/steps}))p.z+=dz/steps;
    }
    return p;
  }
  function withinReach(player,point){return Math.hypot(player.x-point.x,player.z-point.z)<=2.4;}
  return {START,OBSTACLES,canStand,move,withinReach};
});
