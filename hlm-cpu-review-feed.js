'use strict';
const {buildCPUReviewDashboard}=require('./hlm-cpu-review-dashboard');
function createCPUReviewFeed(state,teamId,options={}){
 const before=JSON.stringify(state);
 const dashboard=buildCPUReviewDashboard(state,teamId,options);
 // 351: feed entries; 352: urgency ordering; 353: action labels;
 // 354: empty-state message; 355: immutable serializable feed snapshot.
 const entries=Object.freeze(dashboard.lanes.flatMap((lane,priority)=>lane.items.map((item,index)=>Object.freeze({
  id:item.id,teamId:dashboard.teamId,status:item.status,urgency:lane.id,
  priority,order:index,actionLabel:item.nextStep??'Review decision',
  humanReviewRequired:true,executionAuthorized:false
 }))));
 const emptyMessage=entries.length===0?'No CPU GM decisions currently require review.':null;
 const feed=Object.freeze({kind:'cpu-review-feed',version:1,teamId:dashboard.teamId,
  entries,total:entries.length,emptyMessage,nextReviewId:entries[0]?.id??null,
  advisoryOnly:true,executionEnabled:false,sourceStateMutated:false,persistencePerformed:false});
 if(JSON.stringify(state)!==before) throw new Error('CPU review feed mutated GameState');
 return feed;
}
module.exports={createCPUReviewFeed};
