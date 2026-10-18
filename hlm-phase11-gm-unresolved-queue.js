/* Mission 1285: deterministic privacy-safe unresolved review queue. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMUnresolvedQueue=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function create(checklist){
 if(!checklist||typeof checklist.snapshot!=='function')throw Error('Preparation checklist required');
 let category='all',page=1;const pageSize=3;
 function entries(){const s=checklist.snapshot(),out=[];
 if(s.missingEvidenceItems>0)out.push({key:'evidence-gaps',category:'evidence',title:'Resolve outstanding evidence gaps',count:s.missingEvidenceItems});
 out.push({key:'independent-verification',category:'verification',title:'Obtain independent evidence verification',count:1});
 out.push({key:'human-approval',category:'approval',title:'Human GM decision remains unapproved',count:1});
 for(const step of s.steps)if(!step.prepared)out.push({key:'prepare-'+step.id,category:'preparation',title:step.label,count:1});
 return out;
 }
 function snapshot(){const all=entries(),filtered=category==='all'?all:all.filter(x=>x.category===category),pages=Math.max(1,Math.ceil(filtered.length/pageSize));page=Math.min(page,pages);const base=checklist.snapshot();return Object.freeze({kind:'experimental-human-gm-unresolved-queue',category,page,pages,total:filtered.length,totalUnresolved:all.length,items:Object.freeze(filtered.slice((page-1)*pageSize,page*pageSize).map(x=>Object.freeze({...x}))),missingEvidenceItems:base.missingEvidenceItems,preparedCount:base.preparedCount,independentVerification:'pending',verified:0,approved:0,productionActivationAllowed:false,containsNoteContents:false});}
 function filter(value){if(!['all','evidence','verification','approval','preparation'].includes(value))throw Error('Invalid queue category');category=value;page=1;return snapshot()}
 function next(){page+=1;return snapshot()}function previous(){page=Math.max(1,page-1);return snapshot()}
 function serialize(){const s=snapshot();return JSON.stringify({kind:s.kind,category:s.category,total:s.total,totalUnresolved:s.totalUnresolved,missingEvidenceItems:s.missingEvidenceItems,preparedCount:s.preparedCount,independentVerification:s.independentVerification,verified:0,approved:0,productionActivationAllowed:false,containsNoteContents:false})}
 return Object.freeze({snapshot,filter,next,previous,serialize,persistencePerformed:false,productionActivationAllowed:false,automaticTransactionsAllowed:false,finalDecisionMaker:'human-gm'});
}
return {create};
});