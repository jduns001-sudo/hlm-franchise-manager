/* Mission 1251: deterministic, non-authoritative human source verification priorities. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-gm-source-coverage'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMVerificationPriorities=api;})(typeof globalThis!=='undefined'?globalThis:this,function(dep){
'use strict';
function prioritize(review,approved){
if(approved!==true)throw Error('Explicit human GM approval required');
const source=dep||(typeof globalThis!=='undefined'&&globalThis.HLMGMSourceCoverage);
if(!source||typeof source.summarize!=='function')throw Error('Source coverage unavailable');
const coverage=source.summarize(review,true);
const items=coverage.questions.map((q,index)=>({gateId:q.gateId,sourceSequence:q.sequence,originalIndex:index,acknowledged:q.reviewAcknowledged===true,priority:q.reviewAcknowledged===true?'review-acknowledged-evidence-still-unverified':'unacknowledged-source-question',priorityRank:q.reviewAcknowledged===true?2:1,evidenceNeeded:q.evidenceNeeded,sourceScope:q.sourceScope,uncertainty:q.uncertainty,manualVerification:q.manualAction,reviewNote:q.reviewNote,sourceVerification:'not-performed',evidenceResolution:'unresolved',eligibility:'unknown',confidence:'not-established'}));
items.sort((a,b)=>a.priorityRank-b.priorityRank||a.originalIndex-b.originalIndex);
const compared=items.map((item,index)=>({...item,reviewOrder:index+1,comparison:index===0?'first-unresolved-question':'also-unresolved-no-verified-evidence'}));
return {kind:'experimental-gm-source-verification-priorities',items:compared,unresolvedCount:compared.length,unacknowledgedCount:compared.filter(x=>!x.acknowledged).length,acknowledgedButUnverifiedCount:compared.filter(x=>x.acknowledged).length,sourceVerification:'not-performed',evidenceResolution:'unresolved',eligibility:'unknown',confidence:'not-established',priorityMeaning:'Ordering is for human evidence gathering only, not player ranking or lineup approval.',warning:'All source evidence remains unresolved and eligibility unknown. Human GM must independently verify before any decision.',productionActivationAllowed:false,persistencePerformed:false,automaticTransactionsAllowed:false,automaticRosterChangesAllowed:false,finalDecisionMaker:'human-gm'};
}
return {prioritize};});