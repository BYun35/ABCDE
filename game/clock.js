"use strict";
(function(root, factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(root)root.WardClock=api;
})(typeof globalThis==="object"?globalThis:this,function(){
  function angles(hour,minute){
    const minuteValue=((minute%60)+60)%60;
    const hourValue=(((hour%12)+12)%12)+minuteValue/60;
    return {
      hour:hourValue*Math.PI/6,
      minute:minuteValue*Math.PI/30
    };
  }
  return {angles};
});
