'use strict';
const {createCPUReviewQueueAggregation}=require('./hlm-cpu-review-queue-aggregation');
const STATUS_ORDER=Object.freeze({'blocked':0,'awaiting-execution':1});
function prioritizeCPUReviewQueue(state,teamId,options={}){
 const aggregation=createCPUReviewQueueAggregation(state,teamId,options);
 const ranked=aggregation.items.map(item=>Object.freeze({...item,reviewPriority:item.status==='blocked'?'high':'normal'}))
  .sort((a,b)=>(STATUS_ORDER[a.status]??2)-(STATUS_ORDER[b.status]??2)||a.order-b.order);
 return Object.freeze({
  kind:'cpu-review-queue-prioritization',version:1,teamId:aggregation.teamId,
  aggregation,items:Object.freeze(ranked),
  summary:Object.freeze({...aggregation.summary,prioritizationPolicy:'blocked-first-stable-order',advisoryOnly:true}),
  sourceStateMutated:false,persistencePerformed:false
 });
}
module.exports={prioritizeCPUReviewQueue};
