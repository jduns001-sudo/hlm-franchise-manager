'use strict';
const {searchCPUReviewFeed}=require('./hlm-cpu-review-search');
function paginateCPUReviewFeed(state,teamId,options={}){
 const before=JSON.stringify(state);
 const search=searchCPUReviewFeed(state,teamId,options);
 // 371: validated pagination; 372: stable result slicing; 373: navigation flags;
 // 374: page boundaries; 375: immutable pagination snapshot.
 const page=options.reviewPage??1;
 const pageSize=options.reviewPageSize??20;
 if(!Number.isSafeInteger(page)||page<1) throw new RangeError('Invalid CPU review page');
 if(!Number.isSafeInteger(pageSize)||pageSize<1||pageSize>100) throw new RangeError('Invalid CPU review page size');
 const totalPages=Math.ceil(search.matched/pageSize);
 const start=(page-1)*pageSize;
 const rows=Object.freeze(search.results.slice(start,start+pageSize));
 const snapshot=Object.freeze({kind:'cpu-review-pagination',version:1,teamId:search.teamId,
  page,pageSize,total:search.matched,totalPages,rows,
  hasPrevious:page>1&&totalPages>0,hasNext:page<totalPages,
  outOfRange:totalPages>0&&page>totalPages,empty:rows.length===0,
  advisoryOnly:true,executionEnabled:false,persistencePerformed:false,sourceStateMutated:false});
 if(JSON.stringify(state)!==before) throw new Error('CPU review pagination mutated GameState');
 return snapshot;
}
module.exports={paginateCPUReviewFeed};
