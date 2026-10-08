'use strict';
const {createCPUReviewFeed}=require('./hlm-cpu-review-feed');
function presentCPUReviewFeed(state,teamId,options={}){
 const before=JSON.stringify(state);
 const feed=createCPUReviewFeed(state,teamId,options);
 // 356: display rows; 357: urgency headings; 358: status descriptions;
 // 359: review-only CTAs; 360: immutable presentation model.
 const rows=Object.freeze(feed.entries.map(item=>Object.freeze({
  id:item.id,title:item.actionLabel,
  subtitle:item.status==='blocked'?'Blocked: resolve requirements before proceeding':'Awaiting human review; no execution has occurred',
  section:item.urgency==='urgent'?'Needs attention':'Pending review',
  action:Object.freeze({label:'Review',enabled:true,kind:'inspect-only'}),
  executionEnabled:false
 })));
 const sections=Object.freeze(['Needs attention','Pending review'].map(title=>Object.freeze({
  title,rows:Object.freeze(rows.filter(x=>x.section===title))
 })));
 const view=Object.freeze({kind:'cpu-review-feed-presentation',version:1,teamId:feed.teamId,
  sections,rows,total:rows.length,emptyMessage:feed.emptyMessage,
  advisoryOnly:true,executionEnabled:false,persistencePerformed:false,sourceStateMutated:false});
 if(JSON.stringify(state)!==before) throw new Error('CPU review feed presentation mutated GameState');
 return view;
}
module.exports={presentCPUReviewFeed};
