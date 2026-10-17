/* Mission 1248: transient human-only source review acknowledgements. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-gm-source-verification-checklist'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMSourceReviewNotes=api;})(typeof globalThis!=='undefined'?globalThis:this,function(dep){
'use strict';
function prepare(queue,state,focus,ids,left,right,approved){
if(approved!==true)throw Error('Explicit human GM approval required');
const source=dep||(typeof globalThis!=='undefined'&&globalThis.HLMGMSourceVerificationChecklist);
if(!source||typeof source.prepare!=='function')throw Error('Source verification checklist unavailable');
const checklist=source.prepare(queue,state,focus,ids,left,right,true);
return {kind:'experimental-gm-source-review-notes',questions:checklist.questions.map(q=>({...q,reviewAcknowledged:false,reviewNote:'',verificationStatus:'unresolved'})),openCount:checklist.openCount,eligibility:'unknown',confidence:'not-established',sourceCountScope:checklist.sourceCountScope,warning:'Acknowledgement and notes are not verified evidence or eligibility decisions',productionActivationAllowed:false,persistencePerformed:false,automaticTransactionsAllowed:false,automaticRosterChangesAllowed:false,finalDecisionMaker:'human-gm'};
}
function acknowledge(review,gateId,note,approved){
if(approved!==true)throw Error('Explicit human GM approval required');
if(!review||review.kind!=='experimental-gm-source-review-notes'||!Array.isArray(review.questions))throw Error('Review unavailable');
if(typeof gateId!=='string'||!review.questions.some(q=>q.gateId===gateId))throw Error('Unknown review gate');
if(typeof note!=='string'||note.length>500||/[\u0000-\u001f\u007f]/.test(note))throw Error('Review note must be plain text up to 500 characters');
return {...review,questions:review.questions.map(q=>q.gateId===gateId?{...q,reviewAcknowledged:true,reviewNote:note,verificationStatus:'unresolved'}:{...q}),eligibility:'unknown',confidence:'not-established',persistencePerformed:false};
}
return {prepare,acknowledge};});