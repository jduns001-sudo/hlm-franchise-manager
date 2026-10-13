'use strict';
/** Read-only consistency audit for synthetic highlight recap evidence. */
const {createExperimentalHighlightRecap}=require('./hlm-experimental-highlight-recap');
function createExperimentalHighlightRecapAudit(state,homeId,awayId,seed,playoff=false){
 const source=createExperimentalHighlightRecap(state,homeId,awayId,seed,playoff);
 if(!source.researchReady)return {kind:'experimental-highlight-recap-audit',researchReady:false,blockers:source.blockers,audit:null,official:false,persistencePerformed:false};
 const recap=source.recap;
 const periods=recap.periods.map(p=>({period:p.period,highlights:p.highlights,score:{...p.score},shots:{...p.shots},types:{...p.types}}));
 const counts={};
 let total=0;
 for(const p of periods){
  if(!Number.isInteger(p.period)||p.period<1||!Number.isInteger(p.highlights)||p.highlights<1)throw new Error('EXPERIMENTAL_RECAP_AUDIT_INVALID_PERIOD');
  if(!Object.values(p.score).every(n=>Number.isFinite(n)&&n>=0)||!Object.values(p.shots).every(n=>Number.isFinite(n)&&n>=0))throw new Error('EXPERIMENTAL_RECAP_AUDIT_INVALID_SNAPSHOT');
  total+=p.highlights;
  for(const [type,count] of Object.entries(p.types)){if(!Number.isInteger(count)||count<1)throw new Error('EXPERIMENTAL_RECAP_AUDIT_INVALID_TYPE');counts[type]=(counts[type]||0)+count;}
 }
 if(total!==recap.highlightCount||periods.length!==recap.periodsWithHighlights)throw new Error('EXPERIMENTAL_RECAP_AUDIT_TOTAL_MISMATCH');
 const expected=recap.typeCounts;
 if(Object.keys(counts).length!==Object.keys(expected).length||Object.entries(expected).some(([type,count])=>counts[type]!==count))throw new Error('EXPERIMENTAL_RECAP_AUDIT_TYPE_MISMATCH');
 const last=periods.at(-1);
 const score=last?last.score:null;
 const shots=last?last.shots:null;
 if(JSON.stringify(score)!==JSON.stringify(recap.latestHighlightedScore)||JSON.stringify(shots)!==JSON.stringify(recap.latestHighlightedShots))throw new Error('EXPERIMENTAL_RECAP_AUDIT_LAST_SNAPSHOT_MISMATCH');
 const leader=score?(score.home>score.away?'home':score.away>score.home?'away':'tied'):null;
 if(leader!==recap.leaderAtLastHighlight)throw new Error('EXPERIMENTAL_RECAP_AUDIT_LEADER_MISMATCH');
 return {kind:'experimental-highlight-recap-audit',researchReady:true,audit:{consistent:true,periodsChecked:periods.length,highlightsChecked:total,typeCounts:counts,lastHighlightedLeader:leader},official:false,persistencePerformed:false};
}
module.exports={createExperimentalHighlightRecapAudit};
