"use strict";
(() => {
  const host=document.getElementById("ward-viewport");
  const notice=document.getElementById("scene-feedback");
  if(!host)return;
  function tell(message){notice.textContent=message;}
  if(!window.THREE||!window.WardNavigation||!window.WardNursingNavigation||!window.WardSurgeryNavigation||!window.WardAvatar||!window.WardOpening||!window.WardClock||!window.WardInteraction){
    tell("3D 場景未能載入。請重新整理；你仍可使用右側的線索與操作完成第一關。");
    host.dataset.ready="error";return;
  }
  const T=window.THREE,N=window.WardNavigation,NN=window.WardNursingNavigation,SN=window.WardSurgeryNavigation,A=window.WardAvatar,O=window.WardOpening,C=window.WardClock,I=window.WardInteraction;
  const player={x:N.OPENING_START.x,z:N.OPENING_START.z};
  let travel=0,heading=0,lastMovement=0,walkBlend=0;
  let renderer;
  try{renderer=new T.WebGLRenderer({antialias:true,alpha:false});}
  catch(error){tell("這個瀏覽器無法顯示 3D。請使用支援 WebGL 的瀏覽器；右側操作仍可使用。");host.dataset.ready="error";return;}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=T.PCFSoftShadowMap;
  renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;
  renderer.toneMappingExposure=.92;
  const canvas=renderer.domElement;
  canvas.id="ward-canvas";canvas.tabIndex=0;
  canvas.setAttribute("aria-label","3D 病房，WASD 或方向鍵移動，拖曳轉向，E 互動");
  host.prepend(canvas);
  const scene=new T.Scene();
  scene.background=new T.Color(0x05090b);
  scene.fog=new T.Fog(0x080d0f,4,15);
  const wardRoom=new T.Group();scene.add(wardRoom);
  const nursingRoom=new T.Group();nursingRoom.visible=false;scene.add(nursingRoom);
  const surgeryRoom=new T.Group();surgeryRoom.visible=false;scene.add(surgeryRoom);
  let buildGroup=wardRoom,buildingLevel="ward",activeLevel="ward",activeNavigation=N;
  const camera=new T.PerspectiveCamera(66,1,.06,35);
  camera.position.set(N.START.x,2.4,5.6);
  const avatar=A.create(T);scene.add(avatar.root);
  avatar.root.position.set(player.x,1.05,player.z);
  avatar.root.rotation.x=-Math.PI/2;
  const followRay=new T.Raycaster(),followFocus=new T.Vector3();
  scene.add(new T.HemisphereLight(0xc2e4e2,0x464336,.12));
  const ceilingLight=new T.PointLight(0xd8e7ce,2.1,8,2);
  ceilingLight.position.set(0,3.1,-.7);ceilingLight.castShadow=true;
  ceilingLight.shadow.mapSize.set(1024,1024);scene.add(ceilingLight);
  const fill=new T.PointLight(0xffc985,.25,5,2);fill.position.set(3,2.5,3);scene.add(fill);
  const flashlightBeam=new T.SpotLight(0xffdda0,82,13,Math.PI/6,.5,1.35);
  flashlightBeam.name="player-flashlight-beam";scene.add(flashlightBeam,flashlightBeam.target);
  const handGlow=new T.PointLight(0xffdda0,2.2,2.6,2);scene.add(handGlow);
  const flashlightLevels=[{name:"柔和",scale:.68},{name:"標準",scale:1},{name:"明亮",scale:1.38}];
  let flashlightLevelIndex=1;
  function setFlashlightLevel(index){
    flashlightLevelIndex=(index+flashlightLevels.length)%flashlightLevels.length;
    const level=flashlightLevels[flashlightLevelIndex];
    flashlightBeam.intensity=82*level.scale;
    handGlow.intensity=2.2*level.scale;
    const button=document.getElementById("flashlight-level");
    if(button){
      button.textContent="手電筒："+level.name;
      button.setAttribute("aria-label","手電筒亮度："+level.name+"；按下切換亮度");
      button.title="目前亮度："+level.name+"。按下切換。";
    }
  }
  const flashlightPosition=new T.Vector3(),flashlightTargetPosition=new T.Vector3();
  const materials={};
  function mat(color,metalness=0,roughness=.85){
    const key=[color,metalness,roughness].join("-");
    return materials[key]||(materials[key]=new T.MeshStandardMaterial({color,metalness,roughness}));
  }
  function box(x,y,z,w,h,d,color,parent=buildGroup){
    const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),mat(color));
    mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  function cylinder(x,y,z,rt,rb,h,color,parent=buildGroup){
    const m=new T.Mesh(new T.CylinderGeometry(rt,rb,h,20),mat(color));
    m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
  }
  function sphere(x,y,z,r,color,parent=buildGroup){
    const m=new T.Mesh(new T.SphereGeometry(r,20,16),mat(color));
    m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;
  }
  function textureText(text,bg="#152629",color="#eee4c6"){
    const c=document.createElement("canvas");c.width=768;c.height=256;
    const ctx=c.getContext("2d");
    ctx.fillStyle=bg;ctx.fillRect(0,0,c.width,c.height);
    ctx.strokeStyle="#a18b5d";ctx.lineWidth=5;ctx.strokeRect(5,5,758,246);
    ctx.fillStyle=color;ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.font="bold 56px sans-serif";
    const lines=text.split("\n");
    lines.forEach((line,i)=>ctx.fillText(line,384,128+(i-(lines.length-1)/2)*70,720));
    const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;return texture;
  }
  function calendarTexture(){
    const canvas=document.createElement("canvas");canvas.width=768;canvas.height=768;
    const ctx=canvas.getContext("2d");
    const paper=ctx.createLinearGradient(0,0,768,768);paper.addColorStop(0,"#e9dfc4");paper.addColorStop(.55,"#d8c9a4");paper.addColorStop(1,"#c5b48d");
    ctx.fillStyle=paper;ctx.fillRect(0,0,768,768);
    ctx.fillStyle="#263b3a";ctx.fillRect(0,0,768,142);
    ctx.fillStyle="#f1e7ce";ctx.font="bold 76px sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("2 月",384,70);
    ctx.font="28px sans-serif";ctx.fillStyle="#425754";ctx.fillText("日　 一　 二　 三　 四　 五　 六",384,190);
    ctx.strokeStyle="#8f8062";ctx.lineWidth=2;
    const left=65,top=230,cw=91,ch=82;
    for(let r=0;r<5;r++)for(let col=0;col<7;col++){
      const x=left+col*cw,y=top+r*ch;ctx.strokeRect(x,y,cw,ch);
      const n=r*7+col-2;if(n<1||n>28)continue;
      ctx.fillStyle="#293d3b";ctx.font="bold 34px sans-serif";ctx.fillText(String(n),x+cw/2,y+ch/2);
      if([1,3,7].includes(n)){ctx.strokeStyle="#a74735";ctx.lineWidth=7;ctx.beginPath();ctx.arc(x+cw/2,y+ch/2,25,0,Math.PI*2);ctx.stroke();ctx.strokeStyle="#8f8062";ctx.lineWidth=2;}
    }
    ctx.strokeStyle="#b24d39";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(720,20);ctx.lineTo(735,748);ctx.stroke();
    const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;return tex;
  }
  function graffitiTexture(){
    const canvas=document.createElement("canvas");canvas.width=1024;canvas.height=360;
    const ctx=canvas.getContext("2d");ctx.clearRect(0,0,1024,360);
    ctx.strokeStyle="#ad5948";ctx.fillStyle="#ad5948";ctx.lineWidth=11;ctx.lineCap="round";ctx.lineJoin="round";
    ctx.font="bold 58px sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.save();ctx.translate(512,180);ctx.rotate(-.045);ctx.fillText("月亮  →  時鐘  →  太陽",0,0);ctx.restore();
    for(const [x,label] of [[145,"月"],[512,"03:17"],[879,"日"]]){
      ctx.beginPath();ctx.arc(x,56,30,0,Math.PI*2);ctx.stroke();
      ctx.font="bold 24px sans-serif";ctx.fillText(label,x,58);
      ctx.beginPath();ctx.moveTo(x-38,114);ctx.lineTo(x+35,114);ctx.stroke();
    }
    const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;return tex;
  }
  function sign(x,y,z,w,h,text,rotation=0){
    const group=new T.Group();group.position.set(x,y,z);group.rotation.y=rotation;buildGroup.add(group);
    const back=new T.Mesh(new T.BoxGeometry(w+.12,h+.12,.055),mat(0x5d5849));back.castShadow=true;group.add(back);
    const isGraffiti=text.includes("月亮");
    const tex=text.startsWith("2 月")?calendarTexture():isGraffiti?graffitiTexture():textureText(text);
    const material=new T.MeshBasicMaterial({map:tex,side:T.DoubleSide,transparent:isGraffiti});
    const m=new T.Mesh(new T.PlaneGeometry(w,h),material);m.position.z=.031;group.add(m);
    m.userData.signGroup=group;return m;
  }
  function clockDialTexture(){
    const size=1024,center=size/2,canvas=document.createElement("canvas");canvas.width=size;canvas.height=size;
    const ctx=canvas.getContext("2d");
    ctx.fillStyle="#e9e5d7";ctx.fillRect(0,0,size,size);
    ctx.strokeStyle="#b5b1a6";ctx.lineWidth=8;ctx.beginPath();ctx.arc(center,center,492,0,Math.PI*2);ctx.stroke();
    for(let i=0;i<C.minuteTickCount;i++){
      const angle=i*Math.PI*2/C.minuteTickCount-Math.PI/2;
      const major=i%5===0,inner=major?420:458,outer=482;
      ctx.strokeStyle="#171815";ctx.lineWidth=major?8:3;ctx.lineCap="square";
      ctx.beginPath();ctx.moveTo(center+Math.cos(angle)*inner,center+Math.sin(angle)*inner);
      ctx.lineTo(center+Math.cos(angle)*outer,center+Math.sin(angle)*outer);ctx.stroke();
    }
    ctx.fillStyle="#171815";ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.font="bold 100px Georgia, serif";
    C.numerals.forEach((label,index)=>{
      const angle=index*Math.PI/6-Math.PI/2,radius=330;
      ctx.fillText(label,center+Math.cos(angle)*radius,center+Math.sin(angle)*radius);
    });
    const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;return texture;
  }
  const targets=[];
  function target(mesh,name,action,location){
    const data={id:String(targets.length),mesh,name,action,location:location||{x:mesh.position.x,z:mesh.position.z},level:buildingLevel};
    mesh.userData.target=data;targets.push(data);return data;
  }
  const notebookPanel=document.getElementById("notebook-panel");
  const notebookBackdrop=document.getElementById("notebook-backdrop");
  const notebookToggle=document.getElementById("toggle-notebook");
  const interactionDialog=document.getElementById("interaction-dialog");
  const interactionDialogTitle=document.getElementById("interaction-dialog-title");
  const interactionDialogItem=document.getElementById("interaction-dialog-item");
  const interactionDialogMessage=document.getElementById("interaction-dialog-message");
  const interactionDialogKicker=document.getElementById("interaction-dialog-kicker");
  const interactionDialogContent=document.getElementById("interaction-dialog-content");
  const interactionDialogClose=document.getElementById("interaction-dialog-close");
  const pinForm=document.getElementById("pin-form"),pinFormSlot=document.getElementById("pin-form-slot");
  function showDialog(title,message,kind="clue",item=""){
    if(!interactionDialog)return;
    document.exitPointerLock?.();
    interactionDialogTitle.textContent=title;
    interactionDialogItem.textContent=item;
    interactionDialogItem.hidden=!item;
    interactionDialogMessage.textContent=message||"";
    interactionDialog.dataset.kind=kind;
    interactionDialogKicker.textContent=kind==="fragment"?"病歷碎片":kind==="important"?"重要物品":kind==="input"?"輸入密碼":"病房線索";
    interactionDialog.hidden=false;
    interactionDialogClose.focus({preventScroll:true});
  }
  function closeInteractionDialog(){
    if(!interactionDialog||interactionDialog.hidden)return;
    if(pinForm&&pinForm.parentElement===interactionDialogContent)pinFormSlot.append(pinForm);
    interactionDialogContent.replaceChildren();
    interactionDialog.hidden=true;
    canvas.focus({preventScroll:true});
  }
  function showPinDialog(){
    interactionDialogContent.replaceChildren();
    interactionDialogContent.append(pinForm);
    showDialog("床頭櫃密碼鎖","輸入三位數密碼以解鎖抽屜。","input");
    document.getElementById("pin")?.focus({preventScroll:true});
  }
  function updateDialog(message,title){
    if(!interactionDialog||interactionDialog.hidden)return;
    interactionDialogTitle.textContent=title||"操作結果";
    interactionDialogMessage.textContent=message||"";
  }
  function openNotebook(focusId){
    if(!notebookPanel)return;
    notebookPanel.hidden=false;notebookBackdrop.hidden=false;
    notebookToggle?.setAttribute("aria-expanded","true");
    if(focusId){
      const target=document.getElementById(focusId);
      target?.focus({preventScroll:true});
      target?.scrollIntoView({block:"center",behavior:"smooth"});
    }else document.getElementById("close-notebook")?.focus({preventScroll:true});
  }
  function closeNotebook(){
    if(!notebookPanel)return;
    notebookPanel.hidden=true;notebookBackdrop.hidden=true;
    notebookToggle?.setAttribute("aria-expanded","false");
    canvas.focus({preventScroll:true});
  }
  function inspect(key){
    document.querySelector('[data-inspect="'+key+'"]')?.click();
  }
  function click(id){
    document.getElementById(id)?.click();
  }
  box(0,-.12,-.5,10,.24,13,0x53605b);
  for(let x=-5;x<=5;x++)box(x,.006,0,.018,.012,12,0x36453f);
  for(let z=-7;z<=6;z++)box(0,.007,z,10,.012,.018,0x36453f);
  box(-5,1.8,0,.18,3.6,12,0x728178);
  box(5,1.8,0,.18,3.6,12,0x6d7e76);
  box(0,1.8,6,10,3.6,.18,0x79877b);
  box(-1.4,1.8,-6,7.2,3.6,.18,0x77887f);
  box(4.4,1.8,-6,1.2,3.6,.18,0x77887f);
  box(3,3.12,-6,1.6,.96,.18,0x77887f);
  box(0,3.65,0,10,.12,12,0x3c4843);
  for(const side of [-1,1])box(side*4.89,1.05,0,.04,.11,12,0x365f5d);
  box(-1.4,1.05,-5.89,7.2,.11,.04,0x365f5d);
  box(4.4,1.05,-5.89,1.2,.11,.04,0x365f5d);
  box(0,1.05,5.89,10,.11,.04,0x365f5d);
  box(0,3.48,-.7,1.8,.05,.65,0xdbe9d6);
  box(0,3.43,-.7,2.05,.1,.82,0x59655d);
  const lightLens=new T.Mesh(new T.BoxGeometry(1.78,.025,.55),new T.MeshStandardMaterial({color:0xe7ebcf,emissive:0xcbd9a5,emissiveIntensity:.12,roughness:.35}));
  lightLens.position.set(0,3.365,-.7);buildGroup.add(lightLens);
  box(-.91,3.365,-.7,.06,.035,.62,0x8f987d);
  box(.91,3.365,-.7,.06,.035,.62,0x8f987d);
  sign(0,2.5,5.85,2,.5,"隔離病房",Math.PI);
  // 牆面裂痕與停止運作的設備。
  for(let i=0;i<7;i++){const crack=box(-1.3+i*.06,2.9-i*.12,-5.88,.018,.2,.015,0x34463f);crack.rotation.z=i%2?.5:-.35;}
  box(-4.82,1.4,1.7,.1,.7,.6,0x293a39);
  sign(-4.75,1.42,1.7,.46,.24,"無訊號",Math.PI/2);
  // 病床、床墊、枕頭、躺著的男性。
  box(-2,.59,0,2,.16,3,0x62706a);
  box(-2,.79,0,1.85,.27,2.8,0xb5c3b7);
  box(-2,.97,-1.05,1.1,.18,.55,0xd6ded0);
  for(const x of [-2.82,-1.18])for(const z of [-1.25,1.25]){
    cylinder(x,.3,z,.045,.045,.6,0x526e69);
    cylinder(x,.1,z,.1,.1,.07,0x202b29).rotation.z=Math.PI/2;
  }
  // 主角醒來用的另一張病床，和床上 NO.02 人物的病床並排。
  box(.25,.59,0,1.8,.16,3,0x62706a);
  box(.25,.79,0,1.66,.27,2.8,0xb5c3b7);
  box(.25,.97,-1.05,.95,.18,.55,0xd6ded0);
  for(const x of [-.48,.98])for(const z of [-1.25,1.25]){
    cylinder(x,.3,z,.045,.045,.6,0x526e69);
    cylinder(x,.1,z,.1,.1,.07,0x202b29).rotation.z=Math.PI/2;
  }
  box(.25,1.02,-1.48,1.8,.55,.06,0x688f8b);
  box(.25,.92,1.48,1.8,.35,.06,0x688f8b);
  box(-2,1.02,-1.48,2,.55,.06,0x688f8b);
  box(-2,.92,1.48,2,.35,.06,0x688f8b);
  // 床欄、金屬接頭與縫線，讓兩張病床更像可使用的病房設備。
  for(const bedX of [-2,.25]){
    const half=bedX===-2?1:.9;
    for(const side of [-1,1]){
      const rail=cylinder(bedX+side*(half-.08),.98,.12,.035,.035,2.2,0x87938a);
      rail.rotation.x=Math.PI/2;
      for(const z of [-.88,-.28,.32,.92])cylinder(bedX+side*(half-.08),.89,z,.025,.025,.2,0x9aa69a);
    }
    for(let i=0;i<5;i++)box(bedX-.62+i*.31,.934,1.08,.012,.008,.48,0x9caa9e);
  }
  const patientModel=A.createPatient(T);
  const patient=patientModel.root;
  patient.position.set(-2,1.05,.95);buildGroup.add(patient);
  target(patient,"床上病人",()=>inspect("patient"),{x:-2,z:0});
  const mattress=wardRoom.children.find(m=>m.isMesh&&m.position.x===-2&&m.position.y===.79);
  target(mattress,"床墊下的警告",()=>inspect("warning"),{x:-2,z:1.3});
  // 床頭櫃與三瓶藥物。
  const cabinet=box(-3.6,.55,-3.4,1.4,1.1,1,0x887e64);
  box(-3.6,.62,-2.886,1.24,.025,.025,0x473e30);
  box(-3.6,.38,-2.85,.25,.055,.06,0xc0ac71);
  box(-3.6,.85,-2.884,1.16,.3,.035,0x9a8e72);
  box(-3.6,.36,-2.875,1.16,.28,.035,0x756b56);
  box(-3.6,.83,-2.852,.24,.035,.035,0xc9b77f);
  box(-3.6,.34,-2.842,.24,.035,.035,0xc9b77f);
  box(-3.6,.99,-2.864,.28,.12,.018,0x414d48);
  const cabinetTarget=target(cabinet,"床頭櫃密碼鎖",()=>{
    const action=I.action("cabinet",state);
    if(action==="take-tool"){click("take-tool");return;}
    if(action==="read-note"){tell("抽屜已打開。紙條：「你已經找到第一個答案。但如果你想知道自己是誰，就去護理站。記住，那裡的紀錄不一定是真相。」");return;}
    showPinDialog();
    tell("請在密碼鎖輸入三位數密碼。");
  },{x:-3.6,z:-3.4});
  const bottles=[];
  [0x7a9b83,0x668f9e,0xbca263].forEach((color,i)=>{
    const g=new T.Group();g.position.set(-4.05+i*.45,1.12,-3.4);buildGroup.add(g);
    const bottle=cylinder(0,.2,0,.12,.12,.4,color,g);bottle.material=mat(color,.16,.28);
    cylinder(0,.405,0,.078,.078,.025,0xe0d8c4,g);
    cylinder(0,.45,0,.09,.09,.1,0xd5d0b9,g);
    cylinder(0,.505,0,.074,.074,.018,0x887e65,g);
    cylinder(0,.015,0,.125,.125,.025,0xddd2b8,g);
    const labelTexture=textureText("藥品  "+["A","B","C"][i],"#e8ddbd","#243d3b");
    const label=new T.Mesh(new T.PlaneGeometry(.205,.17),new T.MeshBasicMaterial({map:labelTexture,side:T.DoubleSide}));
    label.position.set(0,.22,.124);g.add(label);
    target(g,"藥瓶 "+["A","B","C"][i],()=>{
      if(i===2&&I.action("bottle-C",state)==="open-bottle")click("open-bottle");
      else inspect("bottles");
    },{x:g.position.x,z:g.position.z});bottles.push(g);
  });
  sign(-3.6,1.85,-5.88,1.9,.5,"藥物測試記錄");
  const calendar=sign(-4.89,1.9,-2.2,1.1,1.2,"2 月\n① ③ ⑦",Math.PI/2);
  target(calendar,"牆上日曆",()=>inspect("calendar"),{x:-4.8,z:-2.2});
  const graffiti=sign(4.89,1.8,-1,2.2,.75,"月亮 → 時鐘 → 太陽",-Math.PI/2);
  target(graffiti,"牆面塗鴉",()=>inspect("graffiti"),{x:4.8,z:-1});
  const clock=cylinder(0,2.65,-5.83,.55,.55,.12,0x252b28);clock.rotation.x=Math.PI/2;
  const clockFace=new T.Group();clockFace.position.set(0,2.65,-5.75);buildGroup.add(clockFace);
  const face=new T.Mesh(new T.CircleGeometry(C.faceRadius,64),new T.MeshBasicMaterial({map:clockDialTexture(),side:T.DoubleSide}));
  face.position.z=.008;clockFace.add(face);
  const bezel=new T.Mesh(new T.TorusGeometry(C.bezelRadius,.028,12,64),new T.MeshBasicMaterial({color:0x151816}));
  bezel.position.z=.025;clockFace.add(bezel);
  const hands=C.angles(3,17);
  function clockHand(length,width,color,z){
    const shape=new T.Shape();
    shape.moveTo(-width/2,0);shape.lineTo(-width*.34,length*.68);shape.lineTo(0,length);
    shape.lineTo(width*.34,length*.68);shape.lineTo(width/2,0);shape.closePath();
    const hand=new T.Mesh(new T.ShapeGeometry(shape),new T.MeshBasicMaterial({color,side:T.DoubleSide}));
    hand.position.z=z;clockFace.add(hand);return hand;
  }
  const hourHand=clockHand(C.hourLength,C.hourWidth,0x171815,.045);
  hourHand.rotation.z=-hands.hour;
  const minuteHand=clockHand(C.minuteLength,C.minuteWidth,C.minuteColor,.06);
  minuteHand.rotation.z=-hands.minute;
  sphere(0,0,.085,.035,0x171815,clockFace);
  target(clock,"停止的時鐘",()=>inspect("clock"),{x:0,z:-5.8});
  // 垃圾桶與可拾取的碎片。
  cylinder(3.5,.4,2.8,.34,.28,.8,0x667b73);
  cylinder(3.5,.805,2.8,.30,.30,.015,0x17231f);
  cylinder(3.5,.82,2.8,.345,.345,.035,0x839087);
  box(3.5,.12,3.12,.28,.06,.16,0x9aa49b);
  box(3.5,.09,3.2,.18,.035,.08,0x313c39);
  const paperTargets=[];
  const paperPositions=[[-.65,1.8,"bed"],[-4.3,-2.6,"cabinet"],[3,2.4,"bin"]];
  paperPositions.forEach(([x,z,id])=>{
    const p=new T.Group();p.position.set(x,.04,z);p.rotation.y=.3;buildGroup.add(p);
    box(0,0,0,.34,.025,.46,0xefe0b7,p);
    for(let i=0;i<3;i++)box(0,.016,-.1+i*.08,.22,.004,.012,0x786e50,p);
    const data=target(p,"拾取"+({bed:"床墊下",cabinet:"床頭櫃後方",bin:"垃圾桶旁"}[id])+"的病歷碎片",()=>{
      document.querySelector('[data-fragment="'+id+'"]')?.click();
    },{x,z});data.fragment=id;paperTargets.push(data);
  });
  // 病房出口：固定門框、右側鉸鏈與向外旋開的門片。
  const doorwayZ=-5.83,doorHingeX=3.8;
  box(2.2,1.32,doorwayZ,.14,2.64,.28,0x59675f);
  box(3.8,1.32,doorwayZ,.14,2.64,.28,0x59675f);
  box(3,2.64,doorwayZ,1.74,.14,.28,0x59675f);
  for(const y of [.22,2.42])cylinder(doorHingeX,y,doorwayZ,.055,.055,.13,0xc2ad79);
  const doorPivot=new T.Group();doorPivot.position.set(doorHingeX,0,doorwayZ);buildGroup.add(doorPivot);
  const doorLeaf=box(-.8,1.32,0,1.58,2.56,.13,0x53635b,doorPivot);
  box(-.8,1.32,.072,1.35,2.28,.018,0x394a44,doorPivot);
  box(-.8,2.25,.085,1.35,.035,.02,0x718078,doorPivot);
  box(-.8,.39,.085,1.35,.035,.02,0x718078,doorPivot);
  box(-1.43,1.48,.12,.16,.28,.1,0x253632,doorPivot);
  const doorHandle=cylinder(-1.43,1.48,.19,.035,.035,.13,0xc6ab69,doorPivot);doorHandle.rotation.x=Math.PI/2;
  const door=target(doorLeaf,"病房門",()=>inspect("door"),{x:3,z:-5.7});
  let doorProgress=0;
  sign(3,2.92,-5.69,1.8,.36,"護理站方向");
  const readerFrame=box(1.96,1.37,-5.635,.39,.56,.055,0x52645c);
  const reader=box(1.96,1.35,-5.72,.3,.46,.16,0x1e3634);
  const readerLight=box(1.96,1.46,-5.625,.2,.055,.02,0xe7bb68);
  box(1.96,1.23,-5.625,.19,.13,.02,0x102321);
  box(1.96,1.07,-5.62,.1,.018,.018,0xc5aa70);
  target(reader,"門禁感應器：使用門禁卡",()=>click("open-door"),{x:2,z:-5.7});
  sign(1.95,1.85,-5.72,.7,.22,"刷卡");
  // 讓工具與拆瓶底操作能直接從場景進行。
  const drawer=box(-3.6,.33,-2.83,.8,.3,.06,0x776b4f);drawer.visible=false;
  target(drawer,"抽屜：取出工具與紙條",()=>click("take-tool"),{x:-3.6,z:-3.4});
  const bottleBase=box(-3.15,1.17,-3.15,.24,.06,.24,0xc8af78);
  bottleBase.userData.target=bottles[2].userData.target;
  // 第二關護理站使用獨立房間群組，沿用同一位玩家、鏡頭、準星與互動系統。
  buildingLevel="nursing";buildGroup=nursingRoom;
  box(0,-.12,0,12,.24,14,0x53605b);
  for(let x=-6;x<=6;x+=2)box(x,.006,0,.018,.012,14,0x36453f);
  for(let z=-7;z<=7;z+=2)box(0,.007,z,12,.012,.018,0x36453f);
  box(-6,1.8,0,.18,3.6,14,0x75837a);box(6,1.8,0,.18,3.6,14,0x697970);
  box(0,1.8,-7,12,3.6,.18,0x7b887e);box(0,1.8,7,12,3.6,.18,0x728078);
  box(0,3.65,0,12,.12,14,0x394540);
  box(0,3.46,-1.8,2.3,.06,.8,0xd9e2d4);box(0,3.40,-1.8,2.55,.12,.95,0x59655e);
  const nurseLamp=new T.Mesh(new T.BoxGeometry(2.25,.025,.75),new T.MeshStandardMaterial({color:0xe9edda,emissive:0xc8d8ab,emissiveIntensity:.12}));
  nurseLamp.position.set(0,3.32,-1.8);buildGroup.add(nurseLamp);
  sign(0,2.55,6.85,2.7,.52,"護理站・實驗紀錄室",Math.PI);
  // 值班表、三份病歷與錄音設備都作為可瞄準的 3D 物件。
  const scheduleBoard=sign(-4.15,2.05,-6.86,2.9,1.42,"護理師值班表\n2/15 16-24 林\n2/17 00-08 王\n2/17 08-16 陳");
  target(scheduleBoard,"護理師值班表",()=>window.Ward3D?.openNursingPanel("nurse-record-panel","護理師值班表與病歷"),NN.TARGETS.schedule);
  // 只保留劇情中會調查或操作的護理站物件。
  const recordLetters=["A","B","C"],recordDetails=["2/15 23:50 林","2/17 02:20 陳","2/17 08:40 陳"];
  const recordColors=[0xddd0af,0xc9d1c0,0xd8c6a2];
  const recordMeshes=[];
  const recordPositions=[NN.TARGETS.recordA,NN.TARGETS.recordB,NN.TARGETS.recordC];
  recordLetters.forEach((letter,index)=>{
    const {x,z}=recordPositions[index];
    const folder=new T.Group();folder.position.set(x,1.13,z);buildGroup.add(folder);
    box(0,0,0,.78,.09,.62,recordColors[index],folder);
    box(0,.05,-.04,.78,.012,.12,0xb0a078,folder);
    const label=sign(x,1.42,z+.36,.73,.24,"病歷 "+letter+"・"+recordDetails[index]);
    const mesh=box(x,1.25,z,.82,.15,.66,recordColors[index]);
    const data=target(mesh,"檢查病歷 "+letter+"（"+recordDetails[index]+"）",()=>document.getElementById("nurse-record-"+letter.toLowerCase()).click(),NN.TARGETS["record"+letter]);
    data.record=letter;recordMeshes.push(data);label.userData.target=data;
  });
  const recorderDesk=box(3.7,.78,-3.0,1.8,.16,1.3,0x716448);
  for(const x of [3.0,4.4])for(const z of [-3.48,-2.52])box(x,.39,z,.12,.78,.12,0x536059);
  const cassetteProp=new T.Group();cassetteProp.visible=false;cassetteProp.position.set(NN.TARGETS.recorder.x,1.0,NN.TARGETS.recorder.z);buildGroup.add(cassetteProp);
  box(0,0,0,.72,.28,.55,0x35413b,cassetteProp);box(0,.15,.05,.36,.025,.22,0xb3995f,cassetteProp);
  for(const x of [-.14,.14])cylinder(x,.16,.05,.055,.055,.028,0x252c29,cassetteProp);
  const cassetteLabel=sign(NN.TARGETS.recorder.x,1.38,NN.TARGETS.recorder.z+.35,.68,.22,"錄音帶");cassetteLabel.visible=false;
  const cassetteTarget=target(cassetteProp,"播放病歷背面的錄音帶",()=>window.Ward3D?.openNursingPanel("cassette-panel","錄音機與實驗日期"),NN.TARGETS.recorder);
  cassetteLabel.userData.target=cassetteTarget;
  const keypadX=NN.TARGETS.keypad.x,keypadZ=NN.TARGETS.keypad.z;
  const keypad=box(keypadX,1.22,keypadZ,.52,.65,.16,0x4e6258);
  const keypadParts=[box(keypadX,1.29,keypadZ+.094,.38,.25,.025,0x152323)];
  for(let row=0;row<3;row++)for(let col=0;col<3;col++)keypadParts.push(box(keypadX-.13+col*.13,1.12-row*.09,keypadZ+.094,.075,.06,.028,0xa89b73));
  const keypadLabel=sign(keypadX,1.76,keypadZ+.32,.8,.2,"實驗日期");
  const keypadTarget=target(keypad,"實驗日期輸入裝置",()=>window.Ward3D?.openNursingPanel("cassette-panel","實驗日期輸入裝置"),NN.TARGETS.keypad);
  keypadParts.push(keypadLabel);keypadParts.forEach(part=>part.userData.target=keypadTarget);
  const desk=box(0,.86,-1.7,5.8,.18,1.72,0x716448);
  // 桌下櫃體支撐左側桌面，右側以桌腳支撐，抽屜不會懸在桌外。
  for(const z of [-2.35,-1.05])box(2.62,.43,z,.14,.82,.14,0x536059);
  const cabinetX=-2.45,cabinetZ=-1.7;
  box(cabinetX-.43,.42,cabinetZ,.08,.68,.96,0x505b54);
  box(cabinetX+.43,.42,cabinetZ,.08,.68,.96,0x505b54);
  box(cabinetX,.42,cabinetZ-.44,.82,.68,.08,0x505b54);
  box(cabinetX,.12,cabinetZ,.82,.08,.9,0x626b60);
  box(cabinetX,.70,cabinetZ+.43,.82,.1,.1,0x626b60);
  box(cabinetX,.18,cabinetZ+.43,.82,.1,.1,0x626b60);
  const drawerAssembly=new T.Group();drawerAssembly.position.x=cabinetX;buildGroup.add(drawerAssembly);
  const drawerTray=box(0,.33,-1.64,.72,.06,.72,0x756746,drawerAssembly);
  box(-.33,.42,-1.64,.06,.18,.72,0x756746,drawerAssembly);
  box(.33,.42,-1.64,.06,.18,.72,0x756746,drawerAssembly);
  box(0,.42,-1.97,.72,.18,.06,0x756746,drawerAssembly);
  const drawerFace=box(0,.49,-1.20,.78,.27,.08,0x927c53,drawerAssembly);
  const drawerPull=cylinder(0,.51,-1.145,.022,.022,.22,0xd3bc78,drawerAssembly);drawerPull.rotation.z=Math.PI/2;
  const drawerTarget=target(drawerFace,"打開桌下隱藏抽屜",()=>document.getElementById("open-nurse-drawer").click(),NN.TARGETS.drawer);
  const fileProp=box(NN.TARGETS.file.x,.42,NN.TARGETS.file.z,.36,.035,.4,0xd7c9a5);fileProp.visible=false;
  const fileLabel=sign(NN.TARGETS.file.x,.64,NN.TARGETS.file.z+.2,.38,.16,"NO.02");fileLabel.visible=false;
  const fileTarget=target(fileProp,"閱讀 NO.02 實驗檔案",()=>document.getElementById("read-nurse-file").click(),NN.TARGETS.file);
  fileLabel.userData.target=fileTarget;
  const cardProp=box(NN.TARGETS.elevatorCard.x,.44,NN.TARGETS.elevatorCard.z,.38,.045,.48,0xe0bd62);cardProp.visible=false;
  const cardLabel=sign(NN.TARGETS.elevatorCard.x,.64,NN.TARGETS.elevatorCard.z+.22,.58,.2,"電梯卡");cardLabel.visible=false;
  const cardTarget=target(cardProp,"取得地下研究區電梯卡",()=>document.getElementById("take-elevator-card").click(),NN.TARGETS.elevatorCard);
  cardLabel.userData.target=cardTarget;
  // 電梯與刷卡器放在房間另一端，必須拿到卡才能完成第二關。
  const elevatorDoor=box(4.75,1.42,-6.82,1.8,2.84,.16,0x66746a);
  box(4.75,1.4,-6.71,.08,2.55,.04,0x34423d);
  const elevatorReader=box(3.65,1.35,-6.56,.38,.58,.12,0x425b50);
  const readerScreen=box(3.65,1.48,-6.48,.22,.13,.025,0x9b7650);
  sign(4.75,2.95,-6.8,1.6,.3,"地下研究區電梯");
  const elevatorTarget=target(elevatorReader,"電梯讀卡器",()=>{
    if(nursingState.elevatorCard)document.getElementById("use-elevator-card").click();
    else window.Ward3D?.openNursingPanel("nurse-elevator-panel","地下研究區電梯");
  },NN.TARGETS.elevatorReader);
  const nursingProps={cassetteProp,cassetteLabel,drawerAssembly,drawerFace,fileProp,fileLabel,cardProp,cardLabel,elevatorDoor,readerScreen,nurseLamp};
  buildGroup=wardRoom;buildingLevel="ward";
  let state={ended:false},nursingState={complete:false},surgeryState={complete:false},fragmentIds=[];
  window.Ward3D={sync(next,ids){
    state=next;fragmentIds=ids;
    paperTargets.forEach(t=>{t.mesh.visible=!fragmentIds.includes(t.fragment);});
    drawer.visible=next.drawerUnlocked&&!next.tool;
    cabinetTarget.name=next.drawerUnlocked?(next.tool?"抽屜：重讀紙條":"抽屜：取出工具與紙條"):"床頭櫃密碼鎖";
    bottles[2].userData.target.name=next.tool&&!next.keycard?"藥瓶 C：用工具拆開瓶底":next.keycard?"藥瓶 C：查看標籤（門禁卡已取出）":"藥瓶 C：查看標籤";
    if(next.keycard)readerLight.material=mat(0x8edbb7);
    if(!next.doorOpen){doorProgress=0;doorPivot.rotation.y=0;}
    if(next.ended){keys.clear();document.exitPointerLock?.();}
  },enterNursingStation(){
    if(activeLevel==="nursing")return;
    closeNotebook();
    activeLevel="nursing";activeNavigation=NN;
    wardRoom.visible=false;nursingRoom.visible=true;
    player.x=NN.START.x;player.z=NN.START.z;heading=0;yaw=0;pitch=-.28;
    avatar.root.position.set(player.x,0,player.z);avatar.root.rotation.x=0;
    keys.clear();document.exitPointerLock?.();
    canvas.setAttribute("aria-label","3D 護理站，WASD 或方向鍵移動，靠近場景物件按 E 互動");
    const label=document.querySelector(".scene-topline span");if(label)label.textContent="護理站 / 實驗紀錄室";
    walk.textContent="面向南 · 護理站入口";
    prompt.textContent="沿著值班桌調查；靠近物件後按 E。";
    nearbyKey="__level-switch__";nearbyTargets=[];nearbyEl.replaceChildren();
    const feedback=document.getElementById("scene-feedback");if(feedback)feedback.textContent="";
    orient();canvas.focus({preventScroll:true});nextNearbyCheck=0;
  },syncNursing(next){
    nursingState=next;
    nursingProps.cassetteProp.visible=next.cassetteFound;
    nursingProps.cassetteLabel.visible=next.cassetteFound;
    nursingProps.drawerFace.visible=true;
    nursingProps.drawerAssembly.position.z=next.drawerOpen ? 0.65 : 0;
    drawerTarget.location.z=next.drawerOpen ? NN.TARGETS.drawer.z : -1.2;
    nursingProps.fileProp.visible=next.drawerOpen&&!next.fileRead;
    nursingProps.fileLabel.visible=next.drawerOpen&&!next.fileRead;
    nursingProps.cardProp.visible=next.drawerOpen&&!next.elevatorCard;
    nursingProps.cardLabel.visible=next.drawerOpen&&!next.elevatorCard;
    if(next.elevatorCard)nursingProps.readerScreen.material=mat(0x8edbb7);
    if(next.complete){nursingProps.elevatorDoor.position.x=5.7;nursingProps.elevatorDoor.rotation.y=-1.15;}
    nextNearbyCheck=0;
  },enterSurgeryRoom(){if(activeLevel==="surgery")return;closeNotebook();activeLevel="surgery";activeNavigation=SN;wardRoom.visible=false;nursingRoom.visible=false;surgeryRoom.visible=true;player.x=SN.START.x;player.z=SN.START.z;heading=0;yaw=0;pitch=-.28;avatar.root.position.set(player.x,0,player.z);avatar.root.rotation.x=0;keys.clear();document.exitPointerLock?.();canvas.setAttribute("aria-label","3D 地下手術室，WASD 或方向鍵移動，靠近場景物件按 E 互動");const label=document.querySelector(".scene-topline span");if(label)label.textContent="地下手術室 / 記憶實驗區";walk.textContent="面向南 · 手術室入口";prompt.textContent="探索四張照片、手術紀錄與控制台；靠近物件按 E。";nearbyKey="__level-switch__";nearbyTargets=[];nearbyEl.replaceChildren();const feedback=document.getElementById("scene-feedback");if(feedback)feedback.textContent="找回四段記憶。WASD 移動，拖曳畫面轉動鏡頭。";orient();canvas.focus({preventScroll:true});nextNearbyCheck=0;},syncSurgery(next){surgeryState=next;surgeryProps.memoProp.visible=next.videoPlayed&&!next.memoRead;surgeryProps.passProp.visible=next.videoPlayed&&!next.passTaken;surgeryProps.exitReader.material=mat(next.passTaken?0x8edbb7:0x415955);if(next.complete){surgeryProps.exitReader.material=mat(0x8edbb7);surgeryProps.alarmLamp.material.emissiveIntensity=2.2;}nextNearbyCheck=0;},notifyPopup(popup){
    showDialog(popup.title,popup.message,popup.kind||"important",popup.item);
  },updateDialog(message,title){updateDialog(message,title);}};
  const keys=new Set(),ray=new T.Raycaster(),pointer=new T.Vector2(0,0);
  let yaw=0,pitch=-.32,drag=null,dragMoved=false,aimed=null,last=performance.now();
  let opening=O.create(),introComplete=false,openingPhase="idle",wakeProgress=1;
  const prompt=document.getElementById("target-prompt"),walk=document.getElementById("walk-status");
  function finishOpening(skipped=false){
    opening={elapsed:O.totalDuration,started:false};openingPhase="done";wakeProgress=1;introComplete=true;
    player.x=N.START.x;player.z=N.START.z;heading=-Math.PI/2;yaw=-Math.PI/2;
    avatar.root.position.set(player.x,0,player.z);avatar.root.rotation.x=0;
    document.getElementById("awakening-scene").hidden=true;
    tell(skipped?"醒來演出已略過。你已進入病房，可以開始探索。":"你已進入病房。WASD 控制人物走動，拖曳轉動跟隨鏡頭；靠近物件點擊或按 E。");
    canvas.focus({preventScroll:true});
  }
  function orient(){
    followFocus.set(player.x,1.05+.1*wakeProgress,player.z);
    const desired=(activeLevel==="nursing"||activeLevel==="surgery")?{
      x:Math.max(activeNavigation.BOUNDS.minX+.35,Math.min(activeNavigation.BOUNDS.maxX-.35,player.x+Math.sin(yaw)*Math.cos(pitch)*3.1)),
      y:Math.max(.4,Math.min(3.25,1.15-Math.sin(pitch)*3.1)),
      z:Math.max(activeNavigation.BOUNDS.minZ+.35,Math.min(activeNavigation.BOUNDS.maxZ-.35,player.z+Math.cos(yaw)*Math.cos(pitch)*3.1))
    }:A.cameraPosition(player,yaw,pitch);
    const destination=new T.Vector3(desired.x,desired.y,desired.z);
    const offset=destination.clone().sub(followFocus),length=offset.length();
    followRay.set(followFocus,offset.normalize());followRay.far=length;
    const hit=followRay.intersectObjects(scene.children,true).find(h=>{
      let obj=h.object;
      while(obj){if(!obj.visible||obj.userData.player)return false;obj=obj.parent;}
      return h.distance>.12;
    });
    if(hit)destination.copy(followFocus).addScaledVector(offset,Math.max(.35,hit.distance-.16));
    camera.position.copy(destination);camera.lookAt(followFocus);
    avatar.root.visible=(introComplete||opening.started)&&camera.position.distanceTo(followFocus)>.65;
    camera.updateMatrixWorld();
  }
  function targetAt(point){
    ray.setFromCamera(point,camera);
    const hits=ray.intersectObjects(scene.children,true).filter(h=>{
      let obj=h.object;while(obj){if(!obj.visible||obj.userData.player)return false;obj=obj.parent;}return true;
    });
    for(const hit of hits){
      let obj=hit.object;
      while(obj){if(obj.userData.target)return obj.userData.target;obj=obj.parent;}
      if(!hit.object.isSprite)return null;
    }
    return null;
  }
  const nearbyEl=document.getElementById("nearby-actions");
  const sightRay=new T.Raycaster(),eye=new T.Vector3(),anchorPoint=new T.Vector3(),bounds=new T.Box3();
  let nearbyTargets=[],nearbyKey="",nextNearbyCheck=0;
  function owner(object){let obj=object;while(obj){if(obj.userData.target)return obj.userData.target;obj=obj.parent;}return null;}
  function shown(object){let obj=object;while(obj){if(!obj.visible||obj.userData.player)return false;obj=obj.parent;}return true;}
  function hasSight(t){
    if(!shown(t.mesh))return false;
    bounds.setFromObject(t.mesh);bounds.getCenter(anchorPoint);
    eye.set(player.x,1.4,player.z);
    const vector=anchorPoint.clone().sub(eye),length=vector.length();
    if(length<.05)return true;
    sightRay.set(eye,vector.normalize());sightRay.far=length+.05;
    const hit=sightRay.intersectObjects(scene.children,true).find(h=>shown(h.object));
    return !hit||owner(hit.object)===t;
  }
  function updateNearby(now){
    if(now<nextNearbyCheck)return;nextNearbyCheck=now+160;
    scene.updateMatrixWorld(true);
    const locked=activeLevel==="ward"?state.ended:nursingState.complete;
    nearbyTargets=locked?[]:I.nearby(player,targets.filter(t=>t.level===activeLevel&&shown(t.mesh)).map(t=>Object.assign(t,{visible:true})),hasSight);
    const key=nearbyTargets.map(t=>t.id+":"+t.name).join("|");
    if(key===nearbyKey)return;nearbyKey=key;
    nearbyEl.replaceChildren();
    if(!nearbyTargets.length){const note=document.createElement("span");note.textContent=locked?(activeLevel==="ward"?"第一關完成。":"第二關完成。"):(activeLevel==="ward"?"靠近物件後，這裡會列出可操作的項目。":"沿值班桌與牆面調查，靠近物件後按 E。");nearbyEl.append(note);return;}
    for(const t of nearbyTargets){const b=document.createElement("button");b.type="button";b.className="secondary";b.textContent=t.name;b.addEventListener("click",()=>activate(t));nearbyEl.append(b);}
  }
  function activate(t){
    if(!introComplete){tell("先看完醒來的片段，再開始探索病房。");return;}
    if(activeLevel==="ward"&&state.ended||activeLevel==="nursing"&&nursingState.complete)return;
    if(!t){tell(activeLevel==="ward"?"請對準藥瓶、日曆、紙條、抽屜或感應器，再點擊或按 E。":"請靠近值班表、病歷、錄音機或電梯，再按 E。");return;}
    if(t.level!==activeLevel)return;
    if(!activeNavigation.withinReach(player,t.location)){tell("距離「"+t.name+"」太遠，請再靠近一些。");return;}
    if(!hasSight(t)){tell("物件被遮住了，請換個位置靠近。");return;}
    t.action();
    if(activeLevel==="ward"&&interactionDialog.hidden){
      const message=document.getElementById("scene-feedback")?.textContent||"";
      showDialog(state.ended?"第一關完成":t.name,message,state.ended?"important":"clue");
    }
    nextNearbyCheck=0;
  }
  function movementLocked(){
    return activeLevel==="ward"?state.ended&&(!state.doorOpen||doorProgress<.995):nursingState.complete;
  }
  function advance(f,r,d){
    const p=activeNavigation.move(player,yaw,f,r,d,activeLevel==="ward"&&state.doorOpen);
    const dx=p.x-player.x,dz=p.z-player.z,moved=Math.hypot(dx,dz);
    if(moved>.0001){travel+=moved;heading=Math.atan2(-dx,-dz);lastMovement=performance.now();}
    player.x=p.x;player.z=p.z;
    avatar.root.position.set(player.x,0,player.z);
    if(activeLevel==="ward"&&state.doorOpen&&player.x>=2.45&&player.x<=3.55&&player.z< -6.15){
      keys.clear();document.getElementById("enter-nursing-station").click();
    }
  }
  function keyDirection(){
    return {f:Number(keys.has("w")||keys.has("arrowup"))-Number(keys.has("s")||keys.has("arrowdown")),
      r:Number(keys.has("d")||keys.has("arrowright"))-Number(keys.has("a")||keys.has("arrowleft"))};
  }
  canvas.addEventListener("keydown",e=>{
    const key=e.key.toLowerCase();
    if(["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright","e"].includes(key)){
      e.preventDefault();
      if(!introComplete)return;
      if(movementLocked())return;
      if(key==="e"){if(!e.repeat&&!(activeLevel==="ward"&&state.ended))activate(aimed);return;}
      if(!keys.has(key)){
        keys.add(key);const d=keyDirection();advance(d.f,d.r,.14);
      }
    }
  });
  window.addEventListener("keyup",e=>keys.delete(e.key.toLowerCase()));
  window.addEventListener("blur",()=>keys.clear());canvas.addEventListener("blur",()=>keys.clear());
  document.addEventListener("visibilitychange",()=>{if(document.hidden)keys.clear();});
  canvas.addEventListener("pointerdown",e=>{
    canvas.focus({preventScroll:true});
    drag={x:e.clientX,y:e.clientY};dragMoved=false;
  });
  window.addEventListener("pointermove",e=>{
    if(movementLocked())return;
    if(document.pointerLockElement===canvas){
      yaw-=e.movementX*.0026;pitch-=e.movementY*.0026;
    }else if(drag&&e.buttons){
      const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
      if(Math.abs(dx)+Math.abs(dy)>2)dragMoved=true;
      yaw-=dx*.004;pitch-=dy*.004;drag={x:e.clientX,y:e.clientY};
    }else return;
    pitch=Math.max(-.85,Math.min(.30,pitch));orient();
  });
  window.addEventListener("pointerup",()=>{drag=null;});
  canvas.addEventListener("click",e=>{
    if(dragMoved)return;
    if(document.pointerLockElement===canvas){activate(targetAt(new T.Vector2(0,0)));return;}
    const b=canvas.getBoundingClientRect();
    pointer.set((e.clientX-b.left)/b.width*2-1,-(e.clientY-b.top)/b.height*2+1);
    activate(targetAt(pointer));
  });
  document.getElementById("enter-room").addEventListener("click",()=>{
    document.getElementById("walk-instructions").hidden=true;
    const scene=document.getElementById("awakening-scene");
    scene.hidden=false;
    opening=O.start();openingPhase="wake";wakeProgress=0;
    player.x=N.OPENING_START.x;player.z=N.OPENING_START.z;
    avatar.root.position.set(player.x,1.05,player.z);avatar.root.rotation.x=-Math.PI/2;
    document.getElementById("awakening-title").textContent="你醒來了";
    document.getElementById("awakening-text").textContent="頭部傳來一陣劇痛。你從病床上醒來，發現病房裡的設備早已停止運作。";
    tell("頭部傳來一陣劇痛。你從病床上醒來……");
  });
  document.getElementById("lock-mouse").addEventListener("click",()=>{
    canvas.focus({preventScroll:true});
    try{
      const result=canvas.requestPointerLock?.();
      result?.catch(()=>tell("此環境未允許鎖定滑鼠，請按住場景拖曳轉向。"));
    }catch(error){tell("請按住場景拖曳轉向。");}
  });
  document.getElementById("flashlight-level").addEventListener("click",()=>{
    setFlashlightLevel(flashlightLevelIndex+1);
    tell("手電筒亮度已調整為「"+flashlightLevels[flashlightLevelIndex].name+"」。");
  });
  document.addEventListener("pointerlockchange",()=>{
    keys.clear();
    document.getElementById("lock-mouse").textContent=document.pointerLockElement===canvas?"Esc 釋放滑鼠":"鎖定滑鼠";
  });
  document.addEventListener("pointerlockerror",()=>tell("此環境未允許鎖定滑鼠，拖曳場景也能轉向。"));
  document.querySelectorAll("[data-walk]").forEach(button=>{
    button.addEventListener("pointerdown",e=>{
      e.preventDefault();if(!introComplete||movementLocked())return;
      const k=button.dataset.walk;
      if(k==="turn-left")yaw+=.22;
      else if(k==="turn-right")yaw-=.22;
      else {const dirs={forward:[1,0],back:[-1,0],left:[0,-1],right:[0,1]};advance(...dirs[k],.35);}
      orient();
    });
  });
  document.getElementById("interact-target").addEventListener("click",()=>activate(aimed));
  notebookToggle?.addEventListener("click",()=>notebookPanel.hidden?openNotebook():closeNotebook());
  document.getElementById("close-notebook")?.addEventListener("click",closeNotebook);
  notebookBackdrop?.addEventListener("click",closeNotebook);
  interactionDialogClose?.addEventListener("click",closeInteractionDialog);
  interactionDialog?.addEventListener("click",e=>{if(e.target===interactionDialog)closeInteractionDialog();});
  document.addEventListener("keydown",e=>{
    if(e.key==="Escape"&&opening.started){e.preventDefault();finishOpening(true);return;}
    if(e.key==="Escape"&&!document.getElementById("nursing-station").hidden){
      e.preventDefault();document.getElementById("close-nursing-panel").click();return;
    }
    if(e.key==="Escape"&&interactionDialog&&!interactionDialog.hidden){
      e.preventDefault();closeInteractionDialog();return;
    }
    if(e.key==="Escape"&&notebookPanel&&!notebookPanel.hidden){
      e.preventDefault();closeNotebook();
    }
  });
  document.getElementById("return-to-room").addEventListener("click",closeNotebook);
  function resize(){
    const w=host.clientWidth,h=host.clientHeight;
    if(!w||!h)return;
    renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host);resize();orient();
  function frame(now){
    const dt=Math.min((now-last)/1000,.05);last=now;
    // 天花板燈持續輕微閃爍，偶爾短暫暗一下，保持不規則的病房氛圍。
    const pulse=Math.max(0,Math.sin(now*.0019));
    const flicker=Math.max(.58,.88+.055*Math.sin(now*.007)+.045*Math.sin(now*.013)-(pulse>.86?.22:0));
    ceilingLight.intensity=2.1*flicker;
    lightLens.material.emissiveIntensity=.045+flicker*.055;
    fill.intensity=.25*(.94+.06*Math.sin(now*.012));
    const alarmPulse=surgeryState.complete?(.35+.65*Math.abs(Math.sin(now*.006))):.12;
    surgeryProps.alarmLamp.material.emissiveIntensity=alarmPulse;
    surgeryProps.alarmLight.intensity=surgeryState.complete?2.6*alarmPulse:.18;
    if(opening.started){
      const result=O.tick(opening,dt);opening=result.state;wakeProgress=result.progress;
      if(result.phase!==openingPhase&&result.phase==="reveal"){
        openingPhase="reveal";
        document.getElementById("awakening-title").textContent="床上還有另一個你";
        document.getElementById("awakening-text").textContent=result.text;
        document.getElementById("scene-feedback").textContent=result.text;
      }
      if(result.phase==="reveal"){
        const progress=Math.max(0,Math.min(1,(opening.elapsed-O.wakeDuration)/(O.totalDuration-O.wakeDuration)));
        const before={x:player.x,z:player.z};
        if(progress<.5){
          player.x=N.OPENING_START.x;player.z=N.OPENING_START.z+(.9*progress*2);heading=Math.PI;
        }else{
          player.z=N.START.z;player.x=N.OPENING_START.x+(N.START.x-N.OPENING_START.x)*((progress-.5)*2);heading=-Math.PI/2;
        }
        const step=Math.hypot(player.x-before.x,player.z-before.z);
        if(step>.0001){travel+=step;lastMovement=now;}
        yaw=-Math.PI/2*progress;
        avatar.root.position.x=player.x;avatar.root.position.z=player.z;
      }
      if(result.done){
        finishOpening();
      }
    }
    const moving=keyDirection();
    if(activeLevel==="ward"&&state.doorOpen){
      doorProgress=Math.min(1,doorProgress+dt*1.05);
      const eased=1-Math.pow(1-doorProgress,3);
      doorPivot.rotation.y=-Math.PI*.5*eased;
    }
    const controlsLocked=movementLocked();
    if(introComplete&&!controlsLocked&&(document.activeElement===canvas||document.pointerLockElement===canvas))advance(moving.f,moving.r,dt*1.45);
    const walking=!controlsLocked&&now-lastMovement<160;
    walkBlend+=(Number(walking)-walkBlend)*Math.min(1,dt*12);
    if(walkBlend<.001)walkBlend=0;
    avatar.update(travel,walkBlend,heading,dt,wakeProgress);
    avatar.root.updateMatrixWorld(true);
    if(avatar.flashlight){
      avatar.flashlight.getWorldPosition(flashlightPosition);
      flashlightBeam.position.copy(flashlightPosition);
      flashlightTargetPosition.set(player.x-Math.sin(heading)*7,.72,player.z-Math.cos(heading)*7);
      flashlightBeam.target.position.copy(flashlightTargetPosition);
      handGlow.position.copy(flashlightPosition);
    }
    orient();
    if(opening.started){
      const shake=(1-wakeProgress)*.025;
      camera.position.x+=Math.sin(now*.035)*shake;
      camera.position.y+=Math.cos(now*.043)*shake;
      camera.lookAt(followFocus);
    }
    canvas.dataset.walking=String(walking);
    canvas.dataset.walkBlend=walkBlend.toFixed(3);
    canvas.dataset.travel=travel.toFixed(3);
    canvas.dataset.cameraX=camera.position.x.toFixed(3);
    canvas.dataset.cameraZ=camera.position.z.toFixed(3);
    updateNearby(now);
    const centered=targetAt(new T.Vector2(0,0));
    aimed=I.chooseTarget(centered,nearbyTargets);
    document.getElementById("interact-target").disabled=controlsLocked||state.ended||!introComplete;
    const reach=aimed&&activeNavigation.withinReach(player,aimed.location);
    prompt.textContent=activeLevel==="ward"&&state.ended&&state.doorOpen?(doorProgress<.995?"門正在開啟，請稍候……":"門已打開，慢慢走過門口前往護理站。"):controlsLocked?(activeLevel==="ward"?"第一關完成":"第二關完成"):aimed?(reach?"E／互動按鈕：":"靠近查看：")+aimed.name:(activeLevel==="ward"?"移動探索病房，對準物件查看":"移動探索護理站，靠近物件按 E");
    const angle=((yaw*180/Math.PI)%360+360)%360;
    const facing=angle<45||angle>=315?"北":angle<135?"西":angle<225?"南":"東";
    walk.textContent="面向"+facing+" · "+(activeLevel==="ward"?(player.z>2.8?"病房入口":player.x<-2.8?"床頭櫃附近":player.x>2.5?"病房右側":player.x>1.3&&player.z>1.6?"病床旁":"病房中央"):(player.z>3.5?"護理站入口":player.z<-4?"電梯區":player.x<-2.2?"值班表／抽屜旁":player.z>-.7?"病歷桌前":"護理站中央"));
    canvas.dataset.x=player.x.toFixed(3);canvas.dataset.z=player.z.toFixed(3);canvas.dataset.yaw=yaw.toFixed(3);
    renderer.render(scene,camera);requestAnimationFrame(frame);
  }
  host.dataset.ready="true";
  tell("病房已準備好。按「進入病房」開始探索。");
  requestAnimationFrame(frame);
})();
