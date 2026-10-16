'use strict';
/* Experimental deterministic position-aware shot opportunities; isolated read-only preview. */
const {buildShiftRotation}=require('./hlm-phase11-shift-rotation');
function simulateShiftShotEvents(lineup,{periodSeconds=1200,shiftSeconds=45,seed=11}={}){
 if(!Number.isSafeInteger(seed)||seed<0)throw new TypeError('Seed must be a nonnegative safe integer');
 const rotation=buildShiftRotation(lineup,{periodSeconds,shiftSeconds});
 const positions=new Map(lineup.map(p=>[String(p.id),String(p.position||'').toUpperCase()]));
 const weights=new Map(lineup.map(p=>[String(p.id),Math.max(0.5,Math.min(1.5,Number.isFinite(Number(p.ovr))&&Number(p.ovr)>0?Number(p.ovr)/80:1))]));
 let state=(seed%4294967296)>>>0;
 const random=()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296};
 const events=[],shotsByPlayer=Object.fromEntries(rotation.playerIceTime.map(p=>[p.id,0]));
 for(let index=0;index<rotation.shifts.length;index++){
  const shift=rotation.shifts[index],duration=shift.endSecond-shift.startSecond;
  // Approximately 30 shots per 60 minutes at neutral strength, without forced events per shift.
  const probability=1-Math.exp(-30*duration/3600);
  const opportunities=Math.ceil(duration/5);
  for(let attempt=0;attempt<opportunities;attempt++){
   if(random()>=1-Math.pow(1-probability,1/opportunities))continue;
   const candidates=shift.skaterIds.map(id=>({id,weight:(['D','LD','RD'].includes(positions.get(id))?0.52:1)*weights.get(id)}));
   const total=candidates.reduce((sum,p)=>sum+p.weight,0);
   let pick=random()*total,shooterId=candidates.at(-1).id;
   for(const candidate of candidates){pick-=candidate.weight;if(pick<0){shooterId=candidate.id;break}}
   const second=shift.startSecond+Math.min(duration-1,Math.floor((attempt+random())*duration/opportunities));
   events.push({type:'shot',second,shooterId,shiftIndex:index});
   shotsByPlayer[shooterId]++;
  }
 }
 events.sort((a,b)=>a.second-b.second);
 return {experimental:true,official:false,productionActivationEnabled:false,automaticallyApplied:false,requiresGMApproval:true,
  periodSeconds,seed,events,playerShots:Object.entries(shotsByPlayer).map(([id,shots])=>({id,shots})),playerIceTime:rotation.playerIceTime};
}
module.exports={simulateShiftShotEvents};
