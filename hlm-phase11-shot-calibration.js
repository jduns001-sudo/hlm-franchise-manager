'use strict';
/* Read-only experimental multi-seed calibration; no persistence or official game effects. */
const {simulateShiftShotEvents}=require('./hlm-phase11-shift-shot-events');
function calibrateShotEvents(lineup,{samples=200,seedStart=0,periodSeconds=1200,shiftSeconds=45}={}){
 if(!Number.isSafeInteger(samples)||samples<1||samples>2000||!Number.isSafeInteger(seedStart)||seedStart<0||seedStart+samples>Number.MAX_SAFE_INTEGER)throw new TypeError('Invalid calibration sample or seed range');
 const position=new Map(lineup.map(p=>[String(p.id),String(p.position||'').toUpperCase()]));
 let shots=0,forwardShots=0,defenseShots=0,emptyPeriods=0;
 const totalsByPlayer=new Map(lineup.map(p=>[String(p.id),0]));
 for(let seed=seedStart;seed<seedStart+samples;seed++){
  const report=simulateShiftShotEvents(lineup,{seed,periodSeconds,shiftSeconds});
  shots+=report.events.length;
  if(report.events.length===0)emptyPeriods++;
  for(const event of report.events){
   if(['D','LD','RD'].includes(position.get(event.shooterId)))defenseShots++;else forwardShots++;
   totalsByPlayer.set(event.shooterId,totalsByPlayer.get(event.shooterId)+1);
  }
 }
 return {experimental:true,official:false,productionActivationEnabled:false,automaticallyApplied:false,requiresGMApproval:true,
  samples,seedStart,periodSeconds,shiftSeconds,meanShotsPerPeriod:shots/samples,projectedShotsPer60:shots/samples*3600/periodSeconds,
  forwardShotShare:shots?forwardShots/shots:0,defenseShotShare:shots?defenseShots/shots:0,emptyPeriods,
  playerShots:[...totalsByPlayer].map(([id,count])=>({id,meanShotsPerPeriod:count/samples}))};
}
module.exports={calibrateShotEvents};
