'use strict';
/** Read-only, evidence-gated per-period digest of synthetic highlights. */
const {createExperimentalHighlightTimeline}=require('./hlm-experimental-highlight-timeline');
function createExperimentalHighlightPeriodDigest(state,homeId,awayId,seed,playoff=false){
 const timeline=createExperimentalHighlightTimeline(state,homeId,awayId,seed,playoff);
 if(!timeline.researchReady)return {kind:'experimental-highlight-period-digest',researchReady:false,blockers:timeline.blockers,periods:null,official:false,persistencePerformed:false};
 const periods=[];
 const byPeriod=new Map();
 for(const event of timeline.events){
  if(!Number.isInteger(event.period)||event.period<1||!event.verified)throw new Error('EXPERIMENTAL_DIGEST_INVALID_EVENT');
  let row=byPeriod.get(event.period);
  if(!row){
   row={period:event.period,eventCount:0,firstOrdinal:event.ordinal,lastOrdinal:event.ordinal,typeCounts:{},score:{...event.periodScore},shots:{...event.periodShots}};
   byPeriod.set(event.period,row);periods.push(row);
  }
  if(JSON.stringify(row.score)!==JSON.stringify(event.periodScore)||JSON.stringify(row.shots)!==JSON.stringify(event.periodShots))throw new Error('EXPERIMENTAL_DIGEST_PERIOD_SNAPSHOT_MISMATCH');
  row.eventCount++;
  row.lastOrdinal=event.ordinal;
  row.typeCounts[event.type]=(row.typeCounts[event.type]||0)+1;
 }
 periods.sort((a,b)=>a.period-b.period);
 const totals={};
 for(const row of periods)for(const [type,count] of Object.entries(row.typeCounts))totals[type]=(totals[type]||0)+count;
 if(periods.reduce((sum,row)=>sum+row.eventCount,0)!==timeline.summary.eventCount)throw new Error('EXPERIMENTAL_DIGEST_EVENT_COUNT_MISMATCH');
 for(const [type,count] of Object.entries(timeline.summary.typeCounts))if(totals[type]!==count)throw new Error('EXPERIMENTAL_DIGEST_TYPE_COUNT_MISMATCH');
 return {kind:'experimental-highlight-period-digest',researchReady:true,periods,summary:{eventCount:timeline.summary.eventCount,periodsWithHighlights:periods.length,typeCounts:totals},official:false,persistencePerformed:false};
}
module.exports={createExperimentalHighlightPeriodDigest};
