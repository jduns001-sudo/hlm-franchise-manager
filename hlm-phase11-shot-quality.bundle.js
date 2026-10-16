/* Experimental isolated shot quality browser model. */
(function(global){'use strict';const module={exports:{}};const require=(path)=>{if(path==='./hlm-phase11-shift-shot-events')return global.HLMPhase11ShiftShotEvents;throw Error('Unsupported module')};
'use strict';
/* Experimental shot quality, deterministic and read-only; not an official goal simulation. */
const {simulateShiftShotEvents}=require('./hlm-phase11-shift-shot-events');
const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));
function estimateShotQuality(lineup,{periodSeconds=1200,shiftSeconds=45,seed=11}={}){
 const base=simulateShiftShotEvents(lineup,{periodSeconds,shiftSeconds,seed});
 const roster=new Map(lineup.map(p=>[String(p.id),p]));
 const events=base.events.map(event=>{
  const player=roster.get(event.shooterId);
  const pos=String(player.position||'').toUpperCase();
  const defense=['D','LD','RD'].includes(pos);
  const rating=Number(player.ovr);
  const adjusted=Number.isFinite(rating)?clamp(rating,0,120):80;
  const probability=clamp((defense?0.045:0.095)*(0.65+adjusted/200),0.01,0.25);
  return {...event,expectedGoalProbability:Number(probability.toFixed(6))};
 });
 const expectedGoals=events.reduce((sum,event)=>sum+event.expectedGoalProbability,0);
 return {...base,events,expectedGoals:Number(expectedGoals.toFixed(6)),qualityModel:'experimental-position-rating-v1'};
}
module.exports={estimateShotQuality};

global.HLMPhase11ShotQuality=module.exports;
})(typeof window!=='undefined'?window:globalThis);
