/* Mission 1281: deterministic read-only review priority dashboard. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMEvidenceDashboard=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function create(paging){
 if(!paging||typeof paging.page!=='function'||typeof paging.inspect!=='function')throw Error('Paginated review required');
 function snapshot(){
  const state=paging.page(),groups={high:[],medium:[],low:[]};let gaps=0,notes=0;
  // This is an evidence-gap workload heuristic, not a verification or player-quality score.
  for(const id of state.taskIds){const item=paging.inspect(id),count=item.missingEvidence.length;gaps+=count;if(item.note)notes++;groups[count>=2?'high':count===1?'medium':'low'].push(id)}
  return Object.freeze({page:state.page,pages:state.pages,totalFiltered:state.totalFiltered,visible:state.taskIds.length,groups:Object.freeze({high:Object.freeze(groups.high),medium:Object.freeze(groups.medium),low:Object.freeze(groups.low)}),visibleEvidenceGaps:gaps,visibleUnsavedNotes:notes,allTasks:state.summary.total,allWithGaps:state.summary.withEvidenceGaps,allWithNotes:state.summary.withLocalNotes,verified:0,approved:0,independentVerification:'pending',productionActivationAllowed:false});
 }
 return Object.freeze({snapshot,page:()=>paging.page(),next:()=>paging.next(),previous:()=>paging.previous(),goTo:p=>paging.goTo(p),search:q=>paging.search(q),filter:f=>paging.filter(f),inspect:id=>paging.inspect(id),setNote:(id,n)=>paging.setNote(id,n),clearNote:id=>paging.clearNote(id),persistencePerformed:false,productionActivationAllowed:false,automaticTransactionsAllowed:false,finalDecisionMaker:'human-gm'});
}
return {create};
});