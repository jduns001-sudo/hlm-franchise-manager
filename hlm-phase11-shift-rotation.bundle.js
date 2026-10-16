/* Experimental isolated five-skater shift rotation browser model. */
(function(global){'use strict';const module={exports:{}};
'use strict';
/* Isolated experimental five-skater shift rotation. Deterministic, no writes. */
function buildShiftRotation(lineup,{periodSeconds=1200,shiftSeconds=45}={}){
 if(!Array.isArray(lineup)||lineup.length<5||!Number.isInteger(periodSeconds)||periodSeconds<=0||!Number.isInteger(shiftSeconds)||shiftSeconds<=0)throw new TypeError('Valid lineup and positive integer period/shift required');
 const ids=lineup.map(player=>{if(!player||player.id==null||!String(player.id).trim()||String(player.position||'').toUpperCase()==='G')throw new TypeError('Skaters require IDs and cannot be goalies');return String(player.id)});
 if(new Set(ids).size!==ids.length)throw new TypeError('Duplicate skater');
 const forwards=lineup.map((player,index)=>({id:ids[index],position:String(player.position||'').toUpperCase()})).filter(p=>['C','LW','RW','F'].includes(p.position));
 const defense=lineup.map((player,index)=>({id:ids[index],position:String(player.position||'').toUpperCase()})).filter(p=>['D','LD','RD'].includes(p.position));
 if(forwards.length<3||defense.length<2)throw new TypeError('At least three forwards and two defensemen required');
 const shifts=[],secondsByPlayer=Object.fromEntries(ids.map(id=>[id,0]));
 for(let start=0,index=0;start<periodSeconds;start+=shiftSeconds,index++){
  const duration=Math.min(shiftSeconds,periodSeconds-start);
  const skaters=[...Array.from({length:3},(_,slot)=>forwards[(index*3+slot)%forwards.length].id),...Array.from({length:2},(_,slot)=>defense[(index*2+slot)%defense.length].id)];
  for(const id of skaters)secondsByPlayer[id]+=duration;
  shifts.push({startSecond:start,endSecond:start+duration,skaterIds:skaters});
 }
 return {experimental:true,official:false,productionActivationEnabled:false,automaticallyApplied:false,requiresGMApproval:true,
  periodSeconds,shiftSeconds,shifts,playerIceTime:Object.entries(secondsByPlayer).map(([id,iceTimeSeconds])=>({id,iceTimeSeconds}))};
}
module.exports={buildShiftRotation};

global.HLMPhase11ShiftRotation=module.exports;
})(typeof window!=='undefined'?window:globalThis);
