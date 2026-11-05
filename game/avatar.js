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
 function createIdBand(T){
   const band=new T.Group();band.name="patient-id-band";
   band.userData.patientId="NO.02";
   const paper=new T.MeshStandardMaterial({color:0xf5df9c,roughness:.75});
   const ink=new T.MeshBasicMaterial({color:0x10292b});
   band.add(new T.Mesh(new T.CylinderGeometry(.116,.116,.135,24),paper));
   // 以幾何筆畫繪字，不依賴外部字型或圖片；正反兩面皆可辨認。
   const glyphs={
     N:[[0,0,0,1],[0,1,1,0],[1,0,1,1]],
     O:[[0,0,0,1],[0,1,1,1],[1,1,1,0],[1,0,0,0]],
     ".":[[.45,0,.55,0]],
     "0":[[0,0,0,1],[0,1,1,1],[1,1,1,0],[1,0,0,0]],
     "2":[[0,1,1,1],[1,1,1,.5],[1,.5,0,.5],[0,.5,0,0],[0,0,1,0]]
   };
   for(const facing of [0,Math.PI]){
     const label=new T.Group();label.name="patient-id-label";
     label.userData.text="NO.02";label.rotation.y=facing;
     label.position.z=facing===0?.123:-.123;band.add(label);
     const backing=new T.Mesh(new T.BoxGeometry(.226,.098,.008),paper);
     backing.position.z=-.006;label.add(backing);
     // 背板放在獨立節點，文字節點僅包含五個字元。
     band.attach(backing);
     [...label.userData.text].forEach((char,index)=>{
       const letter=new T.Group();letter.name="id-char-"+index;
       letter.position.set(-.098+index*.041,-.031,0);label.add(letter);
       for(const [x1,y1,x2,y2] of glyphs[char]){
         const dx=(x2-x1)*.032,dy=(y2-y1)*.062;
         const stroke=new T.Mesh(new T.BoxGeometry(Math.max(.005,Math.hypot(dx,dy)),.005,.003),ink);
         stroke.position.set((x1+x2)*.016,(y1+y2)*.031,0);
         stroke.rotation.z=Math.atan2(dy,dx);letter.add(stroke);
       }
     });
   }
   return band;
 }
 function create(T,withFlashlight=true){
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
   leftArm.name="left-arm";rightArm.name="right-arm";
   [leftArm,rightArm].forEach((arm,i)=>{
     capsule(arm,0,-.30,0,.10,.44,1,1,1);
     arm.rotation.z=i===0?-.13:.13;
   });
   const idBand=createIdBand(T);idBand.position.y=-.53;leftArm.add(idBand);
   let flashlight=null;
   if(withFlashlight){
     flashlight=new T.Group();flashlight.name="hand-flashlight";flashlight.position.set(0,-.70,-.02);rightArm.add(flashlight);
     const housing=new T.Mesh(new T.CylinderGeometry(.037,.045,.22,14),new T.MeshStandardMaterial({color:0x303b39,metalness:.58,roughness:.42}));
     housing.rotation.x=-Math.PI/2;housing.position.z=-.105;flashlight.add(housing);
     const lens=new T.Mesh(new T.CircleGeometry(.032,16),new T.MeshBasicMaterial({color:0xffdf96}));
     lens.rotation.y=Math.PI;lens.position.z=-.218;flashlight.add(lens);
   }
   const shadow=new T.Mesh(new T.CircleGeometry(.4,32),new T.MeshBasicMaterial({color:0x071411,transparent:true,opacity:.2,depthWrite:false}));
   shadow.name="ground-shadow";
   shadow.rotation.x=-Math.PI/2;shadow.position.y=.012;root.add(shadow);
   function update(travel,blend,heading,dt,wakeProgress=1){
     const waking=Math.max(0,Math.min(1,wakeProgress));
     const p=pose(travel,blend);
     leftLeg.rotation.x=p.leftLeg;rightLeg.rotation.x=p.rightLeg;
     leftArm.rotation.x=p.leftArm-.72*(1-waking);rightArm.rotation.x=p.rightArm-.72*(1-waking);
     knees[0].rotation.x=p.leftKnee;knees[1].rotation.x=p.rightKnee;
     body.position.y=p.bob;
     body.rotation.x=0;
     root.scale.y=1;
     root.rotation.x=-Math.PI/2*(1-waking);
     root.position.y=1.05*(1-waking);
     const diff=Math.atan2(Math.sin(heading-root.rotation.y),Math.cos(heading-root.rotation.y));
     root.rotation.y+=diff*Math.min(1,dt*12);
     root.userData.walkBlend=blend;
   }
   return {root,update,flashlight};
 }
 function createPatient(T){
   const model=create(T,false);
   model.root.userData.player=false;
   model.root.rotation.x=-Math.PI/2;
   model.root.rotation.y=Math.PI;
   model.root.getObjectByName("ground-shadow").visible=false;
   return model;
 }
 return {pose,cameraPosition,create,createPatient};
});
