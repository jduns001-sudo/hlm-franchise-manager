/* Mission 1282: deterministic cross-page human review summary, never an approval engine. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMReviewWorkbench=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function create(discovery,pageSize=10){
 if(!discovery||typeof discovery.query!=='function'||typeof discovery.inspect!=='function'||typeof discovery.summary!=='function')throw Error('Review discovery required');
 if(!Number.isInteger(pageSize)||pageSize<1||pageSize>50)throw Error('Page size must be 1 to 50');
 let search='',filter='all',pageIndex=0;
 function ids(){return discovery.query(search,filter)}
 function overview(){
  const all=discovery.query(),visible=ids(),tiers={high:0,medium:0,low:0},gapCount={high:0,medium:0,low:0};let notes=0,missingItems=0;
  for(const id of all){const item=discovery.inspect(id),count=item.missingEvidence.length,tier=count>=2?'high':count===1?'medium':'low';tiers[tier]++;gapCount[tier]+=count;missingItems+=count;if(item.note)notes++}
  const pages=Math.max(1,Math.ceil(visible.length/pageSize));pageIndex=Math.min(pageIndex,pages-1);
  return Object.freeze({allTasks:all.length,matchingTasks:visible.length,pages,page:pageIndex+1,taskIds:Object.freeze(visible.slice(pageIndex*pageSize,(pageIndex+1)*pageSize)),priorityCounts:Object.freeze(tiers),priorityGapCounts:Object.freeze(gapCount),missingEvidenceItems:missingItems,unsavedNotes:notes,verified:0,approved:0,independentVerification:'pending',productionActivationAllowed:false});
 }
 return Object.freeze({overview,search:q=>{if(typeof q!=='string'||q.length>200)throw Error('Invalid search');search=q;pageIndex=0;return overview()},filter:f=>{if(!['all','gaps','notes'].includes(f))throw Error('Invalid filter');filter=f;pageIndex=0;return overview()},next:()=>{const o=overview();if(pageIndex<o.pages-1)pageIndex++;return overview()},previous:()=>{if(pageIndex>0)pageIndex--;return overview()},goTo:n=>{if(!Number.isInteger(n)||n<1||n>overview().pages)throw Error('Invalid page');pageIndex=n-1;return overview()},inspect:id=>discovery.inspect(id),setNote:(id,note)=>{discovery.setNote(id,note);return overview()},clearNote:id=>{discovery.clearNote(id);return overview()},persistencePerformed:false,productionActivationAllowed:false,automaticTransactionsAllowed:false,finalDecisionMaker:'human-gm'});
}
return {create};
});