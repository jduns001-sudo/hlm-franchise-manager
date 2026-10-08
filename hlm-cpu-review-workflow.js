'use strict';
const {summarizeCPUReviewQueue}=require('./hlm-cpu-review-queue-summary');
const VALID_STATUSES=new Set(['blocked','awaiting-execution']);
function buildCPUReviewWorkflow(state,teamId,options={}){
 const before=JSON.stringify(state);
 const source=summarizeCPUReviewQueue(state,teamId,options);
 const items=source.prioritization.items;
 // 316: stable display-ready rows; 317: filtering; 318: pagination;
 // 319: diagnostics; 320: export-safe snapshot. All advisory only.
 const requestedStatus=options.statusFilter??'all';
 if(requestedStatus!=='all'&&!VALID_STATUSES.has(requestedStatus)) throw new RangeError('Invalid CPU review status filter');
 const filtered=items.filter(x=>requestedStatus==='all'||x.status===requestedStatus);
 const pageSize=options.pageSize??25,page=options.page??1;
 if(!Number.isSafeInteger(pageSize)||pageSize<1||pageSize>100||!Number.isSafeInteger(page)||page<1) throw new RangeError('Invalid CPU review pagination');
 const rows=filtered.slice((page-1)*pageSize,page*pageSize).map(item=>Object.freeze({
  id:item.id,teamId:item.teamId,status:item.status,reviewPriority:item.reviewPriority,
  order:item.order,nextStep:item.nextStep,reason:item.reason,
  humanReviewRequired:true,executionEnabled:false
 }));
 const counts=Object.freeze({total:items.length,blocked:items.filter(x=>x.status==='blocked').length,
  awaitingExecution:items.filter(x=>x.status==='awaiting-execution').length,filtered:filtered.length});
 const diagnostics=Object.freeze({hasBlocked:counts.blocked>0,hasPending:counts.total>0,
  empty:counts.total===0,requiresHumanReview:counts.total>0,executionEnabled:false});
 const snapshot=Object.freeze({kind:'cpu-review-workflow-snapshot',version:1,teamId:source.teamId,
  counts,rows:Object.freeze(rows),page,pageSize,totalPages:Math.ceil(filtered.length/pageSize),
  statusFilter:requestedStatus,advisoryOnly:true,executedCount:0});
 if(JSON.stringify(state)!==before) throw new Error('CPU review workflow mutated GameState');
 return Object.freeze({kind:'cpu-review-workflow',version:1,teamId:source.teamId,
  summary:source.summary,counts,diagnostics,snapshot,sourceStateMutated:false,persistencePerformed:false,executionEnabled:false});
}
module.exports={buildCPUReviewWorkflow};
