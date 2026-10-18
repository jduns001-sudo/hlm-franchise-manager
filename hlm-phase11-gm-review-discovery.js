/* Mission 1279: deterministic, read-only discovery over an unsaved human GM review session. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMReviewDiscovery=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function create(review){
 if(!review||typeof review.list!=='function'||typeof review.inspect!=='function')throw Error('Review session required');
 function query(term='',filter='all'){
  if(typeof term!=='string'||term.length>200)throw Error('Search must be at most 200 characters');
  if(!['all','gaps','notes'].includes(filter))throw Error('Unknown filter');
  const q=term.trim().toLocaleLowerCase('en-US');
  return Object.freeze(review.list().filter(e=>{
   const gaps=Array.isArray(e.missingEvidence)?e.missingEvidence:[];
   const matches=!q||[e.taskId,e.sourceRequirement,e.uncertainty,...gaps].some(v=>String(v||'').toLocaleLowerCase('en-US').includes(q));
   return matches&&(filter==='all'||filter==='gaps'&&gaps.length>0||filter==='notes'&&!!e.note);
  }).map(e=>e.taskId));
 }
 function summary(){
  const entries=review.list();return Object.freeze({total:entries.length,withEvidenceGaps:entries.filter(e=>e.missingEvidence.length>0).length,withLocalNotes:entries.filter(e=>!!e.note).length,verified:0,independentReviewPending:entries.length,approvalGranted:0,productionActivationAllowed:false});
 }
 return Object.freeze({query,summary,inspect:id=>review.inspect(id),setNote:(id,note)=>review.setNote(id,note),clearNote:id=>review.clearNote(id),productionActivationAllowed:false,persistencePerformed:false,automaticTransactionsAllowed:false,finalDecisionMaker:'human-gm'});
}
return {create};
});