"use strict";
(() => {
  const host=document.getElementById("ward-viewport");
  const notice=document.getElementById("scene-feedback");
  if(!host)return;
  function tell(message){notice.textContent=message;}
  if(!window.THREE||!window.WardNavigation||!window.WardAvatar){
    tell("3D 場景未能載入。請重新整理；你仍可使用右側的線索與操作完成第一關。");
    host.dataset.ready="error";return;
  }
  const T=window.THREE,N=window.WardNavigation,A=window.WardAvatar;
  const player={x:N.START.x,z:N.START.z};
  let travel=0,heading=0,lastMovement=0,walkBlend=0;
  let renderer;
  try{renderer=new T.WebGLRenderer({antialias:true,alpha:false});}
  catch(error){tell("這個瀏覽器無法顯示 3D。請使用支援 WebGL 的瀏覽器；右側操作仍可使用。");host.dataset.ready="error";return;}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=T.PCFSoftShadowMap;
  renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.25;
  const canvas=renderer.domElement;
  canvas.id="ward-canvas";canvas.tabIndex=0;
  canvas.setAttribute("aria-label","3D 病房，WASD 或方向鍵移動，拖曳轉向，E 互動");
  host.prepend(canvas);
  const scene=new T.Scene();
  scene.background=new T.Color(0x101c1e);
  scene.fog=new T.Fog(0x142123,8,22);
  const camera=new T.PerspectiveCamera(66,1,.06,35);
  camera.position.set(N.START.x,2.4,5.6);
  const avatar=A.create(T);scene.add(avatar.root);
  avatar.root.position.set(player.x,0,player.z);
  const followRay=new T.Raycaster(),followFocus=new T.Vector3();
  scene.add(new T.HemisphereLight(0xc2e4e2,0x464336,1.65));
  const ceilingLight=new T.PointLight(0xd8e7ce,65,16,2);
  ceilingLight.position.set(0,3.1,-.7);ceilingLight.castShadow=true;
  ceilingLight.shadow.mapSize.set(1024,1024);scene.add(ceilingLight);
  const fill=new T.PointLight(0xffc985,22,10,2);fill.position.set(3,2.5,3);scene.add(fill);
  const materials={};
  function mat(color,metalness=0,roughness=.85){
    const key=[color,metalness,roughness].join("-");
    return materials[key]||(materials[key]=new T.MeshStandardMaterial({color,metalness,roughness}));
  }
  function box(x,y,z,w,h,d,color,parent=scene){
    const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),mat(color));
    mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  function cylinder(x,y,z,rt,rb,h,color,parent=scene){
    const m=new T.Mesh(new T.CylinderGeometry(rt,rb,h,20),mat(color));
    m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
  }
  function sphere(x,y,z,r,color,parent=scene){
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
  function sign(x,y,z,w,h,text,rotation=0){
    const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:textureText(text),side:T.DoubleSide}));
    m.position.set(x,y,z);m.rotation.y=rotation;scene.add(m);return m;
  }
  const targets=[];
  function target(mesh,name,action,location){
    const data={mesh,name,action,location:location||{x:mesh.position.x,z:mesh.position.z}};
    mesh.userData.target=data;targets.push(data);return data;
  }
  function inspect(key){document.querySelector('[data-inspect="'+key+'"]')?.click();}
  function click(id){document.getElementById(id)?.click();}
  box(0,-.12,0,10,.24,12,0x53605b);
  for(let x=-5;x<=5;x++)box(x,.006,0,.018,.012,12,0x36453f);
  for(let z=-6;z<=6;z++)box(0,.007,z,10,.012,.018,0x36453f);
  box(-5,1.8,0,.18,3.6,12,0x728178);
  box(5,1.8,0,.18,3.6,12,0x6d7e76);
  box(0,1.8,6,10,3.6,.18,0x79877b);
  box(0,1.8,-6,10,3.6,.18,0x77887f);
  box(0,3.65,0,10,.12,12,0x3c4843);
  for(const side of [-1,1])box(side*4.89,1.05,0,.04,.11,12,0x365f5d);
  box(0,1.05,-5.89,10,.11,.04,0x365f5d);
  box(0,1.05,5.89,10,.11,.04,0x365f5d);
  box(0,3.48,-.7,1.8,.05,.65,0xdbe9d6);
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
  box(-2,1.02,-1.48,2,.55,.06,0x688f8b);
  box(-2,.92,1.48,2,.35,.06,0x688f8b);
  const patientModel=A.createPatient(T);
  const patient=patientModel.root;
  patient.position.set(-2,1.05,.95);scene.add(patient);
  const wrist=sign(-2.35,1.17,.16,.28,.11,"NO.02");wrist.rotation.x=-Math.PI/2;
  target(patient,"床上病人",()=>inspect("patient"),{x:-2,z:0});
  const mattress=scene.children.find(m=>m.isMesh&&m.position.x===-2&&m.position.y===.79);
  target(mattress,"床墊下的警告",()=>inspect("warning"),{x:-2,z:1.3});
  // 床頭櫃與三瓶藥物。
  const cabinet=box(-3.6,.55,-3.4,1.4,1.1,1,0x887e64);
  box(-3.6,.62,-2.886,1.24,.025,.025,0x473e30);
  box(-3.6,.38,-2.85,.25,.055,.06,0xc0ac71);
  target(cabinet,"床頭櫃密碼鎖",()=>{
    const pin=document.getElementById("pin");pin.focus();pin.scrollIntoView({block:"center",behavior:"smooth"});
    tell("請在密碼鎖輸入三位數密碼。");
  },{x:-3.6,z:-3.4});
  const bottles=[];
  [0x7a9b83,0x668f9e,0xbca263].forEach((color,i)=>{
    const g=new T.Group();g.position.set(-4.05+i*.45,1.12,-3.4);scene.add(g);
    cylinder(0,.2,0,.12,.12,.4,color,g);cylinder(0,.45,0,.09,.09,.1,0xd5d0b9,g);
    const label=new T.Mesh(new T.PlaneGeometry(.19,.16),new T.MeshBasicMaterial({map:textureText(["A","B","C"][i])}));
    label.position.set(0,.22,.124);g.add(label);
    target(g,"藥瓶 "+["A","B","C"][i],()=>inspect("bottles"),{x:g.position.x,z:g.position.z});bottles.push(g);
  });
  sign(-3.6,1.85,-5.88,1.9,.5,"藥物測試記錄");
  const calendar=sign(-4.89,1.9,-2.2,1.1,1.2,"2 月\n① ③ ⑦",Math.PI/2);
  target(calendar,"牆上日曆",()=>inspect("calendar"),{x:-4.8,z:-2.2});
  const graffiti=sign(4.89,1.8,-1,2.2,.75,"月亮 → 時鐘 → 太陽",-Math.PI/2);
  target(graffiti,"牆面塗鴉",()=>inspect("graffiti"),{x:4.8,z:-1});
  const clock=cylinder(0,2.65,-5.83,.4,.4,.10,0xd3cfad);clock.rotation.x=Math.PI/2;
  const clockFace=sign(0,2.65,-5.76,.65,.32,"3:17");
  target(clockFace,"停止的時鐘",()=>inspect("clock"),{x:0,z:-5.8});
  // 垃圾桶與可拾取的碎片。
  cylinder(3.5,.4,2.8,.34,.28,.8,0x667b73);
  cylinder(3.5,.805,2.8,.30,.30,.015,0x17231f);
  const paperTargets=[];
  const paperPositions=[[-.65,1.8,"bed"],[-4.3,-2.6,"cabinet"],[3,2.4,"bin"]];
  paperPositions.forEach(([x,z,id])=>{
    const p=new T.Group();p.position.set(x,.04,z);p.rotation.y=.3;scene.add(p);
    box(0,0,0,.34,.025,.46,0xefe0b7,p);
    for(let i=0;i<3;i++)box(0,.016,-.1+i*.08,.22,.004,.012,0x786e50,p);
    const data=target(p,"病歷碎片",()=>{
      document.querySelector('[data-fragment="'+id+'"]')?.click();
    },{x,z});data.fragment=id;paperTargets.push(data);
  });
  // 右前方的門與可操作感應器。
  const door=box(3,1.32,-5.83,1.6,2.64,.15,0x5f6d65);
  sign(3,2.9,-5.72,1.8,.42,"護理站方向");
  box(3,1.65,-5.72,.8,.45,.035,0x1d3939);
  sphere(3.53,1.1,-5.68,.06,0xbba770);
  target(door,"病房門",()=>inspect("door"),{x:3,z:-5.7});
  const reader=box(1.96,1.35,-5.72,.3,.46,.16,0x1e3634);
  const readerLight=box(1.96,1.46,-5.625,.2,.055,.02,0xe7bb68);
  target(reader,"門禁感應器：使用門禁卡",()=>click("open-door"),{x:2,z:-5.7});
  sign(1.95,1.85,-5.72,.7,.22,"刷卡");
  // 讓工具與拆瓶底操作能直接從場景進行。
  const drawer=box(-3.6,.33,-2.83,.8,.3,.06,0x776b4f);drawer.visible=false;
  target(drawer,"抽屜：取出工具與紙條",()=>click("take-tool"),{x:-3.6,z:-3.4});
  const bottleBase=box(-3.15,1.17,-3.15,.24,.06,.24,0xc8af78);
  target(bottleBase,"藥瓶 C 瓶底：使用工具",()=>click("open-bottle"),{x:-3.15,z:-3.15});
  let state={ended:false},fragmentIds=[];
  window.Ward3D={sync(next,ids){
    state=next;fragmentIds=ids;
    paperTargets.forEach(t=>{t.mesh.visible=!fragmentIds.includes(t.fragment);});
    drawer.visible=next.drawerUnlocked&&!next.tool;
    if(next.keycard)readerLight.material=mat(0x8edbb7);
    if(next.ended){door.rotation.y=-1.25;door.position.x=3.6;keys.clear();document.exitPointerLock?.();}
  }};
  const keys=new Set(),ray=new T.Raycaster(),pointer=new T.Vector2(0,0);
  let yaw=0,pitch=-.32,drag=null,dragMoved=false,aimed=null,last=performance.now();
  const prompt=document.getElementById("target-prompt"),walk=document.getElementById("walk-status");
  function orient(){
    followFocus.set(player.x,1.15,player.z);
    const desired=A.cameraPosition(player,yaw,pitch);
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
    avatar.root.visible=camera.position.distanceTo(followFocus)>.65;
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
  function activate(t){
    if(state.ended)return;
    if(!t){tell("請對準藥瓶、日曆、紙條、抽屜或感應器，再點擊或按 E。");return;}
    if(!N.withinReach(player,t.location)){tell("距離「"+t.name+"」太遠，請再靠近一些。");return;}
    t.action();
  }
  function advance(f,r,d){
    const p=N.move(player,yaw,f,r,d);
    const dx=p.x-player.x,dz=p.z-player.z,moved=Math.hypot(dx,dz);
    if(moved>.0001){travel+=moved;heading=Math.atan2(-dx,-dz);lastMovement=performance.now();}
    player.x=p.x;player.z=p.z;
    avatar.root.position.set(player.x,0,player.z);
  }
  function keyDirection(){
    return {f:Number(keys.has("w")||keys.has("arrowup"))-Number(keys.has("s")||keys.has("arrowdown")),
      r:Number(keys.has("d")||keys.has("arrowright"))-Number(keys.has("a")||keys.has("arrowleft"))};
  }
  canvas.addEventListener("keydown",e=>{
    const key=e.key.toLowerCase();
    if(["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright","e"].includes(key)){
      e.preventDefault();
      if(state.ended)return;
      if(key==="e"){if(!e.repeat)activate(targetAt(new T.Vector2(0,0)));return;}
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
    if(state.ended)return;
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
    canvas.focus({preventScroll:true});tell("你已進入病房。WASD 控制人物走動，拖曳轉動跟隨鏡頭；靠近物件點擊或按 E。");
  });
  document.getElementById("lock-mouse").addEventListener("click",()=>{
    canvas.focus({preventScroll:true});
    try{
      const result=canvas.requestPointerLock?.();
      result?.catch(()=>tell("此環境未允許鎖定滑鼠，請按住場景拖曳轉向。"));
    }catch(error){tell("請按住場景拖曳轉向。");}
  });
  document.addEventListener("pointerlockchange",()=>{
    keys.clear();
    document.getElementById("lock-mouse").textContent=document.pointerLockElement===canvas?"Esc 釋放滑鼠":"鎖定滑鼠";
  });
  document.addEventListener("pointerlockerror",()=>tell("此環境未允許鎖定滑鼠，拖曳場景也能轉向。"));
  document.querySelectorAll("[data-walk]").forEach(button=>{
    button.addEventListener("pointerdown",e=>{
      e.preventDefault();if(state.ended)return;
      const k=button.dataset.walk;
      if(k==="turn-left")yaw+=.22;
      else if(k==="turn-right")yaw-=.22;
      else {const dirs={forward:[1,0],back:[-1,0],left:[0,-1],right:[0,1]};advance(...dirs[k],.35);}
      orient();
    });
  });
  document.getElementById("interact-target").addEventListener("click",()=>activate(aimed));
  function resize(){
    const w=host.clientWidth,h=host.clientHeight;
    if(!w||!h)return;
    renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host);resize();orient();
  function frame(now){
    const dt=Math.min((now-last)/1000,.05);last=now;
    const moving=keyDirection();
    if(!state.ended&&(document.activeElement===canvas||document.pointerLockElement===canvas))advance(moving.f,moving.r,dt*2.3);
    const walking=!state.ended&&now-lastMovement<160;
    walkBlend+=(Number(walking)-walkBlend)*Math.min(1,dt*12);
    if(walkBlend<.001)walkBlend=0;
    avatar.update(travel,walkBlend,heading,dt);orient();
    canvas.dataset.walking=String(walking);
    canvas.dataset.walkBlend=walkBlend.toFixed(3);
    canvas.dataset.travel=travel.toFixed(3);
    canvas.dataset.cameraX=camera.position.x.toFixed(3);
    canvas.dataset.cameraZ=camera.position.z.toFixed(3);
    aimed=targetAt(new T.Vector2(0,0));
    const reach=aimed&&N.withinReach(player,aimed.location);
    prompt.textContent=state.ended?"第一關完成":aimed?(reach?"E／點擊：":"靠近查看：")+aimed.name:"移動探索病房，對準物件查看";
    const angle=((yaw*180/Math.PI)%360+360)%360;
    const facing=angle<45||angle>=315?"北":angle<135?"西":angle<225?"南":"東";
    walk.textContent="面向"+facing+" · "+(player.z>2?"病房入口":player.x<-2.8?"床頭櫃附近":player.x>2.5?"病房右側":"病房中央");
    canvas.dataset.x=player.x.toFixed(3);canvas.dataset.z=player.z.toFixed(3);canvas.dataset.yaw=yaw.toFixed(3);
    renderer.render(scene,camera);requestAnimationFrame(frame);
  }
  host.dataset.ready="true";
  tell("病房已準備好。按「進入病房」開始探索。");
  requestAnimationFrame(frame);
})();
