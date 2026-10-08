'use strict';
const {createCPUReviewReport}=require('./hlm-cpu-review-reporting');
function auditCPUReviewQueue(state,teamId,options={}){
 const before=JSON.stringify(state);
 const report=createCPUReviewReport(state,teamId,options);
 // 326: integrity audit; 327: duplicate detection; 328: action coverage;
 // 329: review readiness; 330: immutable audit receipt.
 const ids=report.checklist.map(x=>x.id);
 const unique=new Set(ids);
 const groupTotal=report.groups.reduce((n,x)=>n+x.count,0);
 const actionTotal=report.actions.reduce((n,x)=>n+x.count,0);
 const problems=[];
 if(unique.size!==ids.length) problems.push('duplicate-review-ids');
 if(groupTotal!==report.total) problems.push('status-count-mismatch');
 if(actionTotal!==report.total) problems.push('next-action-count-mismatch');
 if(report.checklist.length!==report.total) problems.push('checklist-count-mismatch');
 if(report.checklist.some(x=>x.reviewRequired!==true||x.reviewCompleted!==false||x.executionAuthorized!==false)) problems.push('unsafe-review-checklist');
 if(report.executionEnabled!==false||report.executedCount!==0||report.persistencePerformed!==false||report.sourceStateMutated!==false) problems.push('execution-boundary-violated');
 const audit=Object.freeze({kind:'cpu-review-audit',version:1,teamId:report.teamId,
  valid:problems.length===0,problems:Object.freeze(problems),
  counts:Object.freeze({total:report.total,unique:unique.size,groupTotal,actionTotal}),
  nextReviewId:report.nextReviewId,requiresHumanReview:report.total>0,
  report,advisoryOnly:true,executionEnabled:false,sourceStateMutated:false,persistencePerformed:false});
 if(JSON.stringify(state)!==before) throw new Error('CPU review audit mutated GameState');
 return audit;
}
module.exports={auditCPUReviewQueue};
