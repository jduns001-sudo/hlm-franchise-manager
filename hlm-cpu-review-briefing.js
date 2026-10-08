'use strict';
const {triageCPUReviewQueue}=require('./hlm-cpu-review-triage');
function createCPUReviewBriefing(state,teamId,options={}){
 const before=JSON.stringify(state);
 const triage=triageCPUReviewQueue(state,teamId,options);
 // 341: executive summary; 342: urgent decision list; 343: standard review list;
 // 344: next-step distribution; 345: immutable briefing export.
 const urgent=Object.freeze(triage.entries.filter(x=>x.priority==='urgent-review').map(x=>Object.freeze({
  id:x.id,nextStep:x.nextStep,status:x.status
 })));
 const standard=Object.freeze(triage.entries.filter(x=>x.priority==='standard-review').map(x=>Object.freeze({
  id:x.id,nextStep:x.nextStep,status:x.status
 })));
 const actionCounts=new Map();
 for(const entry of triage.entries) {
  const key=entry.nextStep??'unspecified';
  actionCounts.set(key,(actionCounts.get(key)??0)+1);
 }
 const nextSteps=Object.freeze([...actionCounts.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([nextStep,count])=>Object.freeze({nextStep,count})));
 const briefing=Object.freeze({kind:'cpu-review-briefing',version:1,teamId:triage.teamId,
  summary:Object.freeze({total:triage.total,visible:triage.visible,blocked:triage.blocked,
   pending:triage.pending,requiresHumanReview:triage.total>0}),
  urgent,standard,nextSteps,nextReviewId:triage.nextReviewId,
  advisoryOnly:true,executionEnabled:false,sourceStateMutated:false,persistencePerformed:false});
 if(JSON.stringify(state)!==before) throw new Error('CPU review briefing mutated GameState');
 return briefing;
}
module.exports={createCPUReviewBriefing};
