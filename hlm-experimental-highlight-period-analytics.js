'use strict';
/** Deterministic read-only per-period synthetic highlight analytics. */
const {createExperimentalHighlightEvidenceIndex}=require('./hlm-experimental-highlight-evidence-index');
function createExperimentalHighlightPeriodAnalytics(state,homeId,awayId,seed,playoff=false){
 const source=createExperimentalHighlightEvidenceIndex(state,homeId,awayId,seed,playoff);
 if(!source.researchReady)return {kind:'experimental-highlight-period-analytics',researchReady:false,blockers:source.blockers,analytics:null,official:false,persistencePerformed:false};
 const index=source.index;
 const periods=Object.entries(index.periods).map(([key,p])=>{
  const period=Number(key);
  if(!Number.isInteger(period)||period<1||!Number.isInteger(p.highlights)||p.highlights<0)throw new Error('EXPERIMENTAL_PERIOD_ANALYTICS_INVALID_INPUT');
  const counts=Object.values(p.types);
  if(counts.some(n=>!Number.isInteger(n)||n<0)||counts.reduce((a,b)=>a+b,0)!==p.highlights)throw new Error('EXPERIMENTAL_PERIOD_ANALYTICS_TYPE_MISMATCH');
  const dominantTypes=Object.entries(p.types).filter(([,n])=>n>0).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).map(([type,count])=>({type,count}));
  return {period,highlightCount:p.highlights,dominantTypes,scoreSnapshot:{...p.score},shotSnapshot:{...p.shots}};
 }).sort((a,b)=>a.period-b.period);
 const total=periods.reduce((n,p)=>n+p.highlightCount,0);
 if(total!==index.highlightCount||periods.length!==index.periodCount)throw new Error('EXPERIMENTAL_PERIOD_ANALYTICS_COUNT_MISMATCH');
 const busiestCount=periods.reduce((n,p)=>Math.max(n,p.highlightCount),0);
 return {kind:'experimental-highlight-period-analytics',researchReady:true,analytics:{periods,busiestPeriods:periods.filter(p=>p.highlightCount===busiestCount&&busiestCount>0).map(p=>p.period),totalHighlights:total,scope:'synthetic-highlights-only'},official:false,persistencePerformed:false};
}
module.exports={createExperimentalHighlightPeriodAnalytics};
