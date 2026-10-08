'use strict';
const {filterCPUReviewFeed}=require('./hlm-cpu-review-filters');
function sortCPUReviewFeed(state,teamId,options={}){
 const before=JSON.stringify(state);
 const feed=filterCPUReviewFeed(state,teamId,options);
 // 381: sort modes; 382: stable alphabetical sorting; 383: urgency sorting;
 // 384: ascending/descending; 385: immutable read-only results.
 const sortBy=options.reviewSortBy??'priority';
 const direction=options.reviewSortDirection??'asc';
 if(!['priority','title','section'].includes(sortBy)) throw new RangeError('Invalid CPU review sort field');
 if(!['asc','desc'].includes(direction)) throw new RangeError('Invalid CPU review sort direction');
 const sectionRank=x=>x.section==='Needs attention'?0:1;
 const rows=Object.freeze(feed.results.map((item,index)=>({item,index})).sort((a,b)=>{
  let cmp=0;
  if(sortBy==='title') cmp=a.item.title.localeCompare(b.item.title,'en');
  if(sortBy==='section') cmp=sectionRank(a.item)-sectionRank(b.item);
  if(sortBy==='priority') cmp=a.index-b.index;
  return (direction==='desc'?-cmp:cmp)||(a.index-b.index);
 }).map(x=>x.item));
 const snapshot=Object.freeze({kind:'cpu-review-sort',version:1,teamId:feed.teamId,
  sortBy,direction,total:feed.matched,rows,advisoryOnly:true,executionEnabled:false,
  persistencePerformed:false,sourceStateMutated:false});
 if(JSON.stringify(state)!==before) throw new Error('CPU review sort mutated GameState');
 return snapshot;
}
module.exports={sortCPUReviewFeed};
