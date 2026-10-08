'use strict';
const {auditCPUReviewQueue}=require('./hlm-cpu-review-audit');
function assessCPUReviewReadiness(state,teamId,options={}){
 const before=JSON.stringify(state);
 const audit=auditCPUReviewQueue(state,teamId,options);
 // 331: audit readiness; 332: blockers; 333: pending actions;
 // 334: human-review requirements; 335: immutable readiness receipt.
 const report=audit.report;
 const blockers=Object.freeze(report.checklist.filter(x=>x.status==='blocked').map(x=>Object.freeze({
  id:x.id,reason:'blocked-review-item',nextStep:x.nextStep
 })));
 const pending=Object.freeze(report.checklist.filter(x=>x.status==='awaiting-execution').map(x=>Object.freeze({
  id:x.id,nextStep:x.nextStep,humanReviewRequired:true
 })));
 const issues=Object.freeze([...audit.problems,...(blockers.length?['blocked-items-require-review']:[])]);
 const readyForHumanReview=audit.valid&&report.total>0;
 const readyForExecution=false;
 const receipt=Object.freeze({kind:'cpu-review-readiness-receipt',version:1,teamId:audit.teamId,
  valid:audit.valid,readyForHumanReview,readyForExecution,
  blockers,pending,issues,total:report.total,
  humanAuthorizationRequired:true,executionEnabled:false,
  advisoryOnly:true,sourceStateMutated:false,persistencePerformed:false});
 if(JSON.stringify(state)!==before) throw new Error('CPU review readiness mutated GameState');
 return Object.freeze({kind:'cpu-review-readiness',version:1,teamId:audit.teamId,
  audit,receipt,executionEnabled:false,sourceStateMutated:false,persistencePerformed:false});
}
module.exports={assessCPUReviewReadiness};
