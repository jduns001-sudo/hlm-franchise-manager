'use strict';
const {queryCPUReviewFeed}=require('./hlm-cpu-review-query');
function exportCPUReviewFeed(state,teamId,options={}){
 const before=JSON.stringify(state);
 const query=queryCPUReviewFeed(state,teamId,options);
 // 391: export schema; 392: escaped CSV; 393: JSON output;
 // 394: deterministic headers and row order; 395: advisory-only immutable result.
 const format=options.reviewExportFormat??'json';
 if(!['json','csv'].includes(format)) throw new RangeError('Invalid CPU review export format');
 const rows=query.rows.map(row=>Object.freeze({
  id:row.id,title:row.title,subtitle:row.subtitle,section:row.section,
  actionKind:'inspect-only',executionEnabled:false
 }));
 const fields=['id','title','subtitle','section','actionKind','executionEnabled'];
 const csvCell=value=>'"'+String(value??'').replace(/"/g,'""')+'"';
 const content=format==='json'?JSON.stringify({kind:'cpu-review-export',version:1,teamId:query.teamId,
  page:query.page,total:query.total,rows},null,2):
  [fields.join(','),...rows.map(row=>fields.map(field=>csvCell(row[field])).join(','))].join('\n');
 const result=Object.freeze({kind:'cpu-review-export',version:1,teamId:query.teamId,
  format,mimeType:format==='json'?'application/json':'text/csv',content,
  exportedRows:rows.length,totalMatches:query.total,advisoryOnly:true,
  executionEnabled:false,persistencePerformed:false,sourceStateMutated:false});
 if(JSON.stringify(state)!==before) throw new Error('CPU review export mutated GameState');
 return result;
}
module.exports={exportCPUReviewFeed};
