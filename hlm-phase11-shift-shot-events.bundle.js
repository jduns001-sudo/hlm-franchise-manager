/* Experimental isolated shift shot event browser model. */
(function(global){'use strict';const module={exports:{}};const require=(path)=>{if(path==='./hlm-phase11-shift-rotation')return global.HLMPhase11ShiftRotation;throw Error('Unsupported module')};
'use strict';
/* Experimental deterministic shot events from isolated positional shifts. No writes. */
const {buildShiftRotation}=require('./hlm-phase11-shift-rotation');
function simulateShiftShotEvents(lineup,{periodSeconds=1200,shiftSeconds=45,seed=11}={}){
 if(!Number.isSafeInteger(seed)||seed<0)throw new TypeError('Seed must be a nonnegative safe integer');
 const rotation=buildShiftRotation(lineup,{periodSeconds,shiftSeconds});
 const events=[],shotsByPlayer=Object.fromEntries(rotation.playerIceTime.map(p=>[p.id,0]));
 for(let index=0;index<rotation.shifts.length;index++){
  const shift=rotation.shifts[index];
  const shotCount=(seed+index)%3;
  for(let shot=0;shot<shotCount;shot++){
   const shooterId=shift.skaterIds[(seed+index+shot)%3];
   const shiftDuration=shift.endSecond-shift.startSecond;
   const second=shift.startSecond+Math.min(shiftDuration-1,Math.floor((shot+1)*shiftDuration/(shotCount+1)));
   if(!shift.skaterIds.includes(shooterId))throw new Error('Shooter not on ice');
   events.push({type:'shot',second,shooterId,shiftIndex:index});
   shotsByPlayer[shooterId]++;
  }
 }
 return {experimental:true,official:false,productionActivationEnabled:false,automaticallyApplied:false,requiresGMApproval:true,
  periodSeconds,seed,events,playerShots:Object.entries(shotsByPlayer).map(([id,shots])=>({id,shots})),
  playerIceTime:rotation.playerIceTime};
}
module.exports={simulateShiftShotEvents};

global.HLMPhase11ShiftShotEvents=module.exports;
})(typeof window!=='undefined'?window:globalThis);
