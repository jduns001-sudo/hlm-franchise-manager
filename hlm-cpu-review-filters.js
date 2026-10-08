'use strict';
const {searchCPUReviewFeed}=require('./hlm-cpu-review-search');
function filterCPUReviewFeed(state,teamId,options={}){
 const before=JSON.stringify(state);
 const search=searchCPUReviewFeed(state,teamId,options);
 // 376: urgency filter; 377: action status filter; 378: combined filters;
 // 379: counts and reset metadata; 380: immutable advisory output.
 const urgency=options.reviewUrgency??'all';
 const status=options.reviewStatus??'all';
 if(!['all','urgent','standard'].includes(urgency)) throw new RangeError('Invalid review urgency');
 if(!['all','blocked','awaiting-execution'].includes(status)) throw new RangeError('Invalid review status');
 const filtered=Object.freeze(search.results.filter(item=>{
  const rowUrgency=item.section==='Needs attention'?'urgent':'standard';
  const rowStatus=item.subtitle.startsWith('Blocked:')?'blocked':'awaiting-execution';
  return (urgency==='all'||urgency===rowUrgency)&&(status==='all'||status===rowStatus);
 }));
 const snapshot=Object.freeze({kind:'cpu-review-filters',version:1,teamId:search.teamId,
  urgency,status,query:search.query,section:search.section,total:search.total,
  matched:filtered.length,results:filtered,filtersActive:urgency!=='all'||status!=='all',
  reset:Object.freeze({reviewUrgency:'all',reviewStatus:'all'}),
  advisoryOnly:true,executionEnabled:false,persistencePerformed:false,sourceStateMutated:false});
 if(JSON.stringify(state)!==before) throw new Error('CPU review filters mutated GameState');
 return snapshot;
}
module.exports={filterCPUReviewFeed};
