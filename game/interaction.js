"use strict";
(function(root,factory){
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root)root.WardInteraction=api;
})(typeof globalThis==="object"?globalThis:this,function(){
 function nearby(player,targets,hasSight){
   return targets.filter(t=>t.visible!==false&&Math.hypot(player.x-t.location.x,player.z-t.location.z)<=2.4&&hasSight(t))
     .sort((a,b)=>Math.hypot(player.x-a.location.x,player.z-a.location.z)-Math.hypot(player.x-b.location.x,player.z-b.location.z));
 }
 function action(kind,state){
   if(kind==="cabinet")return state.drawerUnlocked?(state.tool?"read-note":"take-tool"):"pin";
   if(kind==="bottle-C")return state.tool&&!state.keycard?"open-bottle":"inspect-bottles";
   return "inspect";
 }
 return {nearby,action};
});
