'use strict';
const {buildCPUReviewWorkflow}=require('./hlm-cpu-review-workflow');
const ALLOWED=['blocked','awaiting-execution'];
function createCPUReviewReport(state,teamId,options={}){
 const before=JSON.stringify(state);
 // 321: aggregate all pages; 322: group by status; 323: next-action counts;
 // 324: human-review checklist; 325: serializable, immutable report.
 const workflow=buildCPUReviewWorkflow(state,teamId,{...options,statusFilter:'all',page:1,pageSize:1});
 const source=workflow.summary;
 const prioritized=workflow.snapshot;
 const items=workflow.counts.total===0?[]:buildAllRows(state,teamId,options,workflow.counts.total);
 const groups=Object.freeze(ALLOWED.map(status=>Object.freeze({
  status,count:items.filter(x=>x.status===status).length,
  ids:Object.freeze(items.filter(x=>x.status===status).map(x=>x.id))
 })));
 const actionCounts={};
 for(const item of items){const key=item.nextStep??'unspecified';actionCounts[key]=(actionCounts[key]??0)+1;}
 const actions=Object.freeze(Object.entries(actionCounts).sort(([a],[b])=>a.localeCompare(b)).map(([nextStep,count])=>Object.freeze({nextStep,count})));
 const checklist=Object.freeze(items.map(item=>Object.freeze({id:item.id,status:item.status,nextStep:item.nextStep,
  reviewRequired:true,reviewCompleted:false,executionAuthorized:false})));
 const report=Object.freeze({kind:'cpu-review-report',version:1,teamId:workflow.teamId,
  total:items.length,groups,actions,checklist,
  nextReviewId:items[0]?.id??null,advisoryOnly:true,executedCount:0,
  sourceStateMutated:false,persistencePerformed:false,executionEnabled:false});
 if(JSON.stringify(state)!==before) throw new Error('CPU review report mutated GameState');
 return report;
}
function buildAllRows(state,teamId,options,count){
 const rows=[];
 for(let page=1;page<=Math.ceil(count/100);page++){
  const part=buildCPUReviewWorkflow(state,teamId,{...options,statusFilter:'all',page,pageSize:100});
  rows.push(...part.snapshot.rows);
 }
 return rows;
}
module.exports={createCPUReviewReport};
