'use strict';
/** Read-only synthetic highlight intensity changes, not official possession momentum. */
const {createExperimentalHighlightPeriodAnalytics}=require('./hlm-experimental-highlight-period-analytics');
function createExperimentalHighlightMomentum(state,homeId,awayId,seed,playoff=false){
 const source=createExperimentalHighlightPeriodAnalytics(state,homeId,awayId,seed,playoff);
 if(!source.researchReady)return {kind:'experimental-highlight-momentum',researchReady:false,blockers:source.blockers,momentum:null,official:false,persistencePerformed:false};
 const periods=source.analytics.periods;
 let previous=null;
 const trend=periods.map(p=>{
  if(!Number.isInteger(p.highlightCount)||p.highlightCount<0)throw new Error('EXPERIMENTAL_MOMENTUM_INVALID_COUNT');
  const delta=previous===null?null:p.highlightCount-previous;
  previous=p.highlightCount;
  return {period:p.period,highlightCount:p.highlightCount,deltaFromPriorPeriod:delta,direction:delta===null?'baseline':delta>0?'rising':delta<0?'falling':'steady'};
 });
 if(trend.reduce((sum,p)=>sum+p.highlightCount,0)!==source.analytics.totalHighlights)throw new Error('EXPERIMENTAL_MOMENTUM_TOTAL_MISMATCH');
 return {kind:'experimental-highlight-momentum',researchReady:true,momentum:{trend,scope:'synthetic-highlight-frequency-only',totalHighlights:source.analytics.totalHighlights},official:false,persistencePerformed:false};
}
module.exports={createExperimentalHighlightMomentum};
