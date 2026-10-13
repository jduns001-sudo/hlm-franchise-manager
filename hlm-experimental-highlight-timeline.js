'use strict';
/** Read-only timeline projection of verified synthetic highlights. */
const {createExperimentalHighlightAudit}=require('./hlm-experimental-highlight-audit');
function createExperimentalHighlightTimeline(state,homeId,awayId,seed,playoff=false){
 const report=createExperimentalHighlightAudit(state,homeId,awayId,seed,playoff);
 if(!report.researchReady)return {kind:'experimental-highlight-timeline',researchReady:false,blockers:report.blockers,events:null,official:false,persistencePerformed:false};
 const periods=new Map(report.periods.map(p=>[p.period,p]));
 const events=report.highlights.map(h=>{
  const period=periods.get(h.period);
  if(!h.verified||!period)throw new Error('EXPERIMENTAL_TIMELINE_UNVERIFIED_HIGHLIGHT');
  return {ordinal:h.ordinal,period:h.period,type:h.type,verified:true,periodScore:{...period.score},periodShots:{...period.shots}};
 });
 if(events.some((e,i)=>e.ordinal!==i+1))throw new Error('EXPERIMENTAL_TIMELINE_ORDINAL_GAP');
 const counts={};
 for(const event of events)counts[event.type]=(counts[event.type]||0)+1;
 if(JSON.stringify(counts)!==JSON.stringify(report.summary.typeCounts))throw new Error('EXPERIMENTAL_TIMELINE_COUNT_MISMATCH');
 return {kind:'experimental-highlight-timeline',researchReady:true,events,summary:{eventCount:events.length,typeCounts:counts,periodCount:report.periods.length},official:false,persistencePerformed:false};
}
module.exports={createExperimentalHighlightTimeline};
