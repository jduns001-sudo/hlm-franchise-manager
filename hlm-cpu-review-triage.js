'use strict';
const {assessCPUReviewReadiness}=require('./hlm-cpu-review-readiness');
const VALID_FILTERS=new Set(['all','blocked','awaiting-execution']);
function triageCPUReviewQueue(state,teamId,options={}){
 const before=JSON.stringify(state);
 const readiness=assessCPUReviewReadiness(state,teamId,options);
 // 336: triage classification; 337: stable priority; 338: status filtering;
 // 339: next-review guidance; 340: immutable export-safe triage snapshot.
 const statusFilter=options.triageStatusFilter??'all';
 if(!VALID_FILTERS.has(statusFilter)) throw new RangeError('Invalid CPU review triage status filter');
 const report=readiness.audit.report;
 const blocked=new Set(readiness.receipt.blockers.map(x=>x.id));
 const entries=report.checklist.map((item,index)=>Object.freeze({
  id:item.id,order:index,status:item.status,priority:blocked.has(item.id)?'urgent-review':'standard-review',
  nextStep:item.nextStep,humanReviewRequired:true,executionAuthorized:false
 }));
 const filtered=Object.freeze(entries.filter(x=>statusFilter==='all'||x.status===statusFilter));
 const next=filtered[0]??null;
 const snapshot=Object.freeze({kind:'cpu-review-triage-snapshot',version:1,teamId:readiness.teamId,
  statusFilter,total:entries.length,visible:filtered.length,blocked:readiness.receipt.blockers.length,
  pending:readiness.receipt.pending.length,entries:filtered,nextReviewId:next?.id??null,
  nextReviewReason:next?(next.status==='blocked'?'resolve-blocker':'human-review-required'):null,
  advisoryOnly:true,executionEnabled:false,persistencePerformed:false,sourceStateMutated:false});
 if(JSON.stringify(state)!==before) throw new Error('CPU review triage mutated GameState');
 return snapshot;
}
module.exports={triageCPUReviewQueue};
