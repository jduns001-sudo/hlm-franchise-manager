'use strict';
const {createCPUDecisionCycleReviewQueue}=require('./hlm-cpu-decision-cycle-review-queue');
function createCPUReviewQueueAggregation(state,teamId,options={}){
 const selections=Array.isArray(options.selections)?options.selections:[];
 const entries=selections.map((selection,index)=>{
  const q=createCPUDecisionCycleReviewQueue(state,teamId,selection);
  return Object.freeze({...q.items[0],id:q.items[0].id+':'+index,order:index});
 });
 return Object.freeze({
  kind:'cpu-review-queue-aggregation',version:1,teamId:String(teamId),
  items:Object.freeze(entries),
  summary:Object.freeze({count:entries.length,pendingCount:entries.length,
   blockedCount:entries.filter(x=>x.status==='blocked').length,
   awaitingExecutionCount:entries.filter(x=>x.status==='awaiting-execution').length,
   executedCount:0,advisoryOnly:true}),
  sourceStateMutated:false,persistencePerformed:false
 });
}
module.exports={createCPUReviewQueueAggregation};
