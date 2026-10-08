'use strict';
const {presentCPUReviewFeed}=require('./hlm-cpu-review-feed-presentation');
function searchCPUReviewFeed(state,teamId,options={}){
 const before=JSON.stringify(state);
 const view=presentCPUReviewFeed(state,teamId,options);
 // 366: normalized query; 367: title/subtitle matching; 368: section filtering;
 // 369: deterministic result order; 370: immutable search snapshot.
 const query=options.searchQuery??'';
 const section=options.searchSection??'all';
 if(typeof query!=='string'||query.length>200) throw new RangeError('Invalid CPU review search query');
 if(!['all','Needs attention','Pending review'].includes(section)) throw new RangeError('Invalid CPU review search section');
 const normalized=query.trim().toLocaleLowerCase('en-US');
 const results=Object.freeze(view.rows.filter(row=>(section==='all'||row.section===section)&&
  (!normalized||[row.id,row.title,row.subtitle,row.section].some(value=>String(value??'').toLocaleLowerCase('en-US').includes(normalized))))
  .map(row=>Object.freeze({id:row.id,title:row.title,subtitle:row.subtitle,section:row.section,
   actionKind:'inspect-only',executionEnabled:false})));
 const snapshot=Object.freeze({kind:'cpu-review-search',version:1,teamId:view.teamId,
  query:normalized,section,total:view.total,matched:results.length,results,
  noMatches:results.length===0,advisoryOnly:true,executionEnabled:false,
  persistencePerformed:false,sourceStateMutated:false});
 if(JSON.stringify(state)!==before) throw new Error('CPU review search mutated GameState');
 return snapshot;
}
module.exports={searchCPUReviewFeed};
