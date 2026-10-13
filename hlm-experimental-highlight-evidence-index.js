'use strict';
/** Read-only index of verified synthetic highlight evidence by period. */
const {createExperimentalHighlightEvidenceReport}=require('./hlm-experimental-highlight-evidence-report');
function createExperimentalHighlightEvidenceIndex(state,homeId,awayId,seed,playoff=false){
 const source=createExperimentalHighlightEvidenceReport(state,homeId,awayId,seed,playoff);
 if(!source.researchReady)return {kind:'experimental-highlight-evidence-index',researchReady:false,blockers:source.blockers,index:null,official:false,persistencePerformed:false};
 const report=source.report;
 if(!report.verified||report.scope!=='synthetic-highlights-only')throw new Error('EXPERIMENTAL_EVIDENCE_INDEX_UNVERIFIED');
 const periods=report.periods.map(p=>({period:p.period,highlights:p.highlights,score:{...p.score},shots:{...p.shots},types:{...p.types}}));
 const byPeriod={};
 const typePeriods={};
 let total=0;
 for(const p of periods){
  const key=String(p.period);
  if(Object.hasOwn(byPeriod,key)||!Number.isInteger(p.period)||p.period<1)throw new Error('EXPERIMENTAL_EVIDENCE_INDEX_DUPLICATE_PERIOD');
  byPeriod[key]={highlights:p.highlights,score:{...p.score},shots:{...p.shots},types:{...p.types}};
  total+=p.highlights;
  for(const [type,count] of Object.entries(p.types)){if(!typePeriods[type])typePeriods[type]=[];typePeriods[type].push({period:p.period,count});}
 }
 if(total!==report.highlightsChecked||periods.length!==report.periodsChecked)throw new Error('EXPERIMENTAL_EVIDENCE_INDEX_COUNT_MISMATCH');
 for(const [type,count] of Object.entries(report.typeCounts))if((typePeriods[type]||[]).reduce((n,p)=>n+p.count,0)!==count)throw new Error('EXPERIMENTAL_EVIDENCE_INDEX_TYPE_MISMATCH');
 return {kind:'experimental-highlight-evidence-index',researchReady:true,index:{periods:byPeriod,typePeriods,periodCount:periods.length,highlightCount:total,scope:'synthetic-highlights-only'},official:false,persistencePerformed:false};
}
module.exports={createExperimentalHighlightEvidenceIndex};
