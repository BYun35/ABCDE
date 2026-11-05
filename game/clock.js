"use strict";
(function(root, factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(root)root.WardClock=api;
})(typeof globalThis==="object"?globalThis:this,function(){
  const design={
    numerals:["12","1","2","3","4","5","6","7","8","9","10","11"],
    minuteTickCount:60,
    faceRadius:.50,
    bezelRadius:.525,
    hourLength:.275,
    minuteLength:.425,
    hourWidth:.064,
    minuteWidth:.032,
    minuteColor:0x211f1b
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
