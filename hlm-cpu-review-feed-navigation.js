'use strict';
const {presentCPUReviewFeed}=require('./hlm-cpu-review-feed-presentation');
function navigateCPUReviewFeed(state,teamId,options={}){
 const before=JSON.stringify(state);
 const view=presentCPUReviewFeed(state,teamId,options);
 // 361: stable selection; 362: unknown selection diagnostics; 363: previous/next;
 // 364: read-only detail; 365: immutable navigation snapshot.
 const requestedId=options.selectedReviewId??null;
 if(requestedId!==null&&typeof requestedId!=='string') throw new TypeError('selectedReviewId must be a string');
 const index=requestedId===null?(view.rows.length?0:-1):view.rows.findIndex(x=>x.id===requestedId);
 const selected=index>=0?view.rows[index]:null;
 const detail=selected?Object.freeze({
  id:selected.id,title:selected.title,subtitle:selected.subtitle,section:selected.section,
  action:Object.freeze({label:'Inspect decision',kind:'inspect-only'}),
  humanReviewRequired:true,executionEnabled:false
 }):null;
 const navigation=Object.freeze({kind:'cpu-review-feed-navigation',version:1,teamId:view.teamId,
  requestedId,selectionFound:requestedId===null||index>=0,
  selectedId:selected?.id??null,previousId:index>0?view.rows[index-1].id:null,
  nextId:index>=0&&index<view.rows.length-1?view.rows[index+1].id:null,
  detail,total:view.total,advisoryOnly:true,executionEnabled:false,
  sourceStateMutated:false,persistencePerformed:false});
 if(JSON.stringify(state)!==before) throw new Error('CPU review feed navigation mutated GameState');
 return navigation;
}
module.exports={navigateCPUReviewFeed};
