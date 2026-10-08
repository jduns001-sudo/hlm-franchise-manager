'use strict';
const {sortCPUReviewFeed}=require('./hlm-cpu-review-sort');
function queryCPUReviewFeed(state,teamId,options={}){
 const before=JSON.stringify(state);
 const sorted=sortCPUReviewFeed(state,teamId,options);
 // 386: combined query pipeline; 387: pagination after filtering and sorting;
 // 388: explicit empty and boundary flags; 389: summary metadata;
 // 390: immutable, read-only query response.
 const page=options.reviewPage??1;
 const pageSize=options.reviewPageSize??20;
 if(!Number.isSafeInteger(page)||page<1) throw new RangeError('Invalid CPU review page');
 if(!Number.isSafeInteger(pageSize)||pageSize<1||pageSize>100) throw new RangeError('Invalid CPU review page size');
 const totalPages=Math.ceil(sorted.total/pageSize);
 const rows=Object.freeze(sorted.rows.slice((page-1)*pageSize,page*pageSize));
 const result=Object.freeze({kind:'cpu-review-query',version:1,teamId:sorted.teamId,
  total:sorted.total,page,pageSize,totalPages,rows,
  hasPrevious:page>1&&totalPages>0,hasNext:page<totalPages,
  outOfRange:totalPages>0&&page>totalPages,empty:rows.length===0,
  sortBy:sorted.sortBy,direction:sorted.direction,
  advisoryOnly:true,executionEnabled:false,persistencePerformed:false,sourceStateMutated:false});
 if(JSON.stringify(state)!==before) throw new Error('CPU review query mutated GameState');
 return result;
}
module.exports={queryCPUReviewFeed};
