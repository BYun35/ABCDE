"use strict";
(function(root,factory){
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root)root.WardAvatar=api;
})(typeof globalThis==="object"?globalThis:this,function(){
 function pose(travel,blend){
   if(blend<=0)return {leftLeg:0,rightLeg:0,leftArm:0,rightArm:0,leftKnee:0,rightKnee:0,bob:0};
   const swing=Math.sin(travel*8)*Math.max(0,Math.min(1,blend));
   return {leftLeg:swing*.65,rightLeg:-swing*.65,leftArm:-swing*.38,rightArm:swing*.38,
     leftKnee:Math.max(0,-swing)*.65,rightKnee:Math.max(0,swing)*.65,
     bob:Math.abs(Math.sin(travel*8))*blend*.035};
 }
 function cameraPosition(p,yaw,pitch,distance=3.1){
   const flat=Math.cos(pitch)*distance;
   return {x:Math.max(-4.78,Math.min(4.78,p.x+Math.sin(yaw)*flat)),
     y:Math.max(.4,Math.min(3.25,1.15-Math.sin(pitch)*distance)),
     z:Math.max(-5.78,Math.min(5.78,p.z+Math.cos(yaw)*flat))};
 }
 function create(T){
   const root=new T.Group();root.userData.player=true;
   const body=new T.Group();root.add(body);
   const ivory=new T.MeshStandardMaterial({color:0xeeeeea,roughness:.55,metalness:0});
   function joint(x,y,z,parent=body){
     const j=new T.Group();j.position.set(x,y,z);parent.add(j);return j;
   }
   function capsule(parent,x,y,z,r,length,sx=1,sy=1,sz=1){
     const m=new T.Mesh(new T.CapsuleGeometry(r,length,10,24),ivory);
     m.position.set(x,y,z);m.scale.set(sx,sy,sz);
     m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
   }
   function sphere(parent,x,y,z,r,sx=1,sy=1,sz=1){
     const m=new T.Mesh(new T.SphereGeometry(r,32,24),ivory);
     m.position.set(x,y,z);m.scale.set(sx,sy,sz);
     m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
   }
   // 無五官的圓頭、圓滑軀幹與四肢，保留分離的關節供走路動畫使用。
   capsule(body,0,1.10,0,.27,.43,1.02,.72,.67);
   sphere(body,0,1.76,0,.265,1,1,.95);
   const leftLeg=joint(-.14,.86,0),rightLeg=joint(.14,.86,0),knees=[];
   [leftLeg,rightLeg].forEach(leg=>{
     capsule(leg,0,-.37,0,.112,.59,1,1,.98);
     const knee=joint(0,-.39,0,leg);knees.push(knee);
     sphere(leg,0,-.75,-.045,.13,.94,.69,1.55);
   });
   const leftArm=joint(-.34,1.39,0),rightArm=joint(.34,1.39,0);
   [leftArm,rightArm].forEach((arm,i)=>{
     capsule(arm,0,-.30,0,.10,.44,1,1,1);
     arm.rotation.z=i===0?-.13:.13;
   });
   const shadow=new T.Mesh(new T.CircleGeometry(.4,32),new T.MeshBasicMaterial({color:0x071411,transparent:true,opacity:.2,depthWrite:false}));
   shadow.name="ground-shadow";
   shadow.rotation.x=-Math.PI/2;shadow.position.y=.012;root.add(shadow);
   function update(travel,blend,heading,dt){
     const p=pose(travel,blend);
     leftLeg.rotation.x=p.leftLeg;rightLeg.rotation.x=p.rightLeg;
     leftArm.rotation.x=p.leftArm;rightArm.rotation.x=p.rightArm;
     knees[0].rotation.x=p.leftKnee;knees[1].rotation.x=p.rightKnee;
     body.position.y=p.bob;
     const diff=Math.atan2(Math.sin(heading-root.rotation.y),Math.cos(heading-root.rotation.y));
     root.rotation.y+=diff*Math.min(1,dt*12);
     root.userData.walkBlend=blend;
   }
   return {root,update};
 }
 function createPatient(T){
   const model=create(T);
   model.root.userData.player=false;
   model.root.rotation.x=-Math.PI/2;
   model.root.rotation.y=Math.PI;
   model.root.getObjectByName("ground-shadow").visible=false;
   return model;
 }
 return {pose,cameraPosition,create,createPatient};
});
