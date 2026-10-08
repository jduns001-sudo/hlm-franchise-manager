'use strict';
const {queryCPUReviewFeed}=require('./hlm-cpu-review-query');
function summarizeCPUReviewFeed(state,teamId,options={}){
 const before=JSON.stringify(state);
 // 396: review counts; 397: status breakdown; 398: urgency breakdown;
 // 399: next review reference; 400: immutable advisory summary.
 const query=queryCPUReviewFeed(state,teamId,{...options,reviewPage:1,reviewPageSize:100});
 const all=query.total>query.rows.length;
 const rows=query.rows;
 const urgent=rows.filter(x=>x.section==='Needs attention').length;
 const blocked=rows.filter(x=>x.subtitle.startsWith('Blocked:')).length;
 const result=Object.freeze({kind:'cpu-review-summary',version:1,teamId:query.teamId,
  totalMatches:query.total,inspectedRows:rows.length,partial:all,
  counts:Object.freeze({urgent,standard:rows.length-urgent,blocked,awaitingReview:rows.length-blocked}),
  nextReviewId:rows[0]?.id??null,empty:query.total===0,
  advisoryOnly:true,executionEnabled:false,persistencePerformed:false,sourceStateMutated:false});
 if(JSON.stringify(state)!==before) throw new Error('CPU review summary mutated GameState');
 return result;
}
module.exports={summarizeCPUReviewFeed};
