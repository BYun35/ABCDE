"use strict";
(function(root, factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(root)root.WardClock=api;
})(typeof globalThis==="object"?globalThis:this,function(){
  const design={
    faceRadius:.35,
    bezelRadius:.385,
    hourLength:.21,
    minuteLength:.33,
    hourWidth:.055,
    minuteWidth:.028,
    minuteColor:0x9a473d
  };
  function angles(hour,minute){
    const minuteValue=((minute%60)+60)%60;
    const hourValue=(((hour%12)+12)%12)+minuteValue/60;
    return {
      hour:hourValue*Math.PI/6,
      minute:minuteValue*Math.PI/30
    };
  }
  return Object.assign({angles},design);
});
