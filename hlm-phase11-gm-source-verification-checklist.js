/* Mission 1247: source-specific, unresolved human verification checklist. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-gm-verification-review-order'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMSourceVerificationChecklist=api;})(typeof globalThis!=='undefined'?globalThis:this,function(dep){
'use strict';
function prepare(queue,state,focus,ids,left,right,approved){
if(approved!==true)throw Error('Explicit human GM approval required');
const source=dep||(typeof globalThis!=='undefined'&&globalThis.HLMGMVerificationReviewOrder);
if(!source||typeof source.prioritize!=='function')throw Error('Verification review order unavailable');
const order=source.prioritize(queue,state,focus,ids,left,right,true);
const questions=order.items.map((task,index)=>Object.freeze({sequence:index+1,gateId:task.gateId,evidenceState:task.evidenceState,priority:task.priority,humanQuestion:task.humanQuestion||'What evidence can the human GM verify?',evidenceNeeded:task.evidenceNeeded||'Independent source verification required',uncertainty:task.uncertainty,sourceScope:order.sourceCountScope,verificationStatus:'unresolved',checklistAction:'inspect source evidence manually',canConfirmEligibility:false,canResolveAutomatically:false}));
return {kind:'experimental-gm-source-verification-checklist',questions,openCount:questions.length,selectedPlayerCount:order.selectedPlayerCount,sourceCountScope:order.sourceCountScope,eligibility:'unknown',confidence:'not-established',warning:'Questions and evidence requirements are not proof of eligibility or completeness',productionActivationAllowed:false,persistencePerformed:false,automaticTransactionsAllowed:false,automaticRosterChangesAllowed:false,finalDecisionMaker:'human-gm'};
}
return {prepare};});