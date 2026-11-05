"use strict";
(function(root, factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(root)root.WardOpening=api;
})(typeof globalThis==="object"?globalThis:this,function(){
  const wakeDuration=3.5,totalDuration=7;
  const scenes={
    wake:"頭部傳來一陣劇痛。你從病床上醒來，發現病房裡的設備早已停止運作。",
    reveal:"你看向身旁的病床，上面躺著一名和你長相完全相同的人。他的手腕標著 NO.02。"
  };
  function create(){return {elapsed:0,started:false};}
  function start(){return {elapsed:0,started:true};}
  function tick(state,dt){
    if(!state.started)return {state,phase:"idle",progress:1,text:"",done:false};
    const elapsed=Math.min(totalDuration,state.elapsed+Math.max(0,dt));
    const done=elapsed+1e-9>=totalDuration;
    const time=done?totalDuration:elapsed;
    const phase=time<wakeDuration?"wake":time<totalDuration?"reveal":"done";
    return {
      state:{elapsed:time,started:!done},
      phase,
      progress:Math.min(1,time/wakeDuration),
      text:phase==="wake"?scenes.wake:phase==="reveal"?scenes.reveal:"",
      done
    };
  }
  return {create,start,tick,wakeDuration,totalDuration};
});
