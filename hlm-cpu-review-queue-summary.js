'use strict';
const {prioritizeCPUReviewQueue}=require('./hlm-cpu-review-queue-prioritization');

function summarizeCPUReviewQueue(state,teamId,options={}){
 const before=JSON.stringify(state);
 const prioritized=prioritizeCPUReviewQueue(state,teamId,options);
 const items=prioritized.items;
 const blocked=items.filter(item=>item.status==='blocked');
 const awaiting=items.filter(item=>item.status==='awaiting-execution');
 const next=items[0]??null;
 if(JSON.stringify(state)!==before) throw new Error('CPU review queue summary mutated GameState');
 return Object.freeze({
  kind:'cpu-review-queue-summary',version:1,teamId:prioritized.teamId,
  prioritization:prioritized,
  summary:Object.freeze({
   total:items.length,blocked:blocked.length,awaitingExecution:awaiting.length,
   nextReviewId:next?.id??null,nextReviewStatus:next?.status??null,
   requiresHumanReview:items.length>0,executedCount:0,
   advisoryOnly:true,executionEnabled:false
  }),
  sourceStateMutated:false,persistencePerformed:false
 });
}
module.exports={summarizeCPUReviewQueue};
