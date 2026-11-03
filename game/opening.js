"use strict";
(function(root, factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(root)root.WardOpening=api;
})(typeof globalThis==="object"?globalThis:this,function(){
  const scenes=[
    "頭部傳來一陣劇痛。你從病床上醒來，發現病房裡的設備早已停止運作。",
    "你看向身旁的病床，上面躺著一名和你長相完全相同的人。他的手腕標著 NO.02。"
  ];
  function create(){return {stage:-1,started:false};}
  function advance(state){
    if(state.started)return {state,text:"",done:true};
    const stage=state.stage+1;
    if(stage>=scenes.length)return {state:{stage,started:true},text:"",done:true};
    return {state:{stage,started:false},text:scenes[stage],done:false};
  }
  return {create,advance};
});
