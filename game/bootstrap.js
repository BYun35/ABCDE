"use strict";
(async function(){
  const loader=document.querySelector('script[src*="bootstrap.js"]');
  const base=new URL(".",loader?.src||location.href);
  const files=["game.js","vendor/three.min.js","navigation.js","nursing-navigation.js","surgery-navigation.js","avatar.js","opening.js","clock.js","interaction.js","level2.js","level3.js","scene.js","app.js"];
  for(const file of files){
    await new Promise((resolve,reject)=>{const script=document.createElement("script");script.src=new URL(file,base).href;script.onload=resolve;script.onerror=()=>reject(new Error("載入失敗："+file));document.head.append(script);});
  }
})().catch(error=>{const notice=document.getElementById("scene-feedback");if(notice)notice.textContent=error.message;console.error(error);});
