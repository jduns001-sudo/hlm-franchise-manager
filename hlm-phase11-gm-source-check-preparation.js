/* Mission 1252: read-only, deterministic human GM manual source-check preparation. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-gm-verification-priorities'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMSourceCheckPreparation=api;})(typeof globalThis!=='undefined'?globalThis:this,function(dep){
'use strict';
function prepare(review,approved){
if(approved!==true)throw Error('Explicit human GM approval required');
const source=dep||(typeof globalThis!=='undefined'&&globalThis.HLMGMVerificationPriorities);
if(!source||typeof source.prioritize!=='function')throw Error('Verification priorities unavailable');
const priorities=source.prioritize(review,true);
const groups=[];
for(const item of priorities.items){
const scope=typeof item.sourceScope==='string'&&item.sourceScope.trim()?item.sourceScope:'unspecified-source-scope';
let group=groups.find(g=>g.sourceScope===scope);
if(!group){group={sourceScope:scope,questions:[],unresolvedCount:0,acknowledgedButUnverifiedCount:0};groups.push(group)}
group.questions.push({gateId:item.gateId,reviewOrder:item.reviewOrder,acknowledged:item.acknowledged,reviewNote:item.reviewNote,evidenceNeeded:item.evidenceNeeded,uncertainty:item.uncertainty,manualSteps:['Identify the independent source for scope: '+scope,'Locate evidence required: '+item.evidenceNeeded,'Check source evidence against unresolved question: '+item.gateId,'Record findings outside this read-only preview for human GM review; do not infer eligibility'],sourceVerification:'not-performed',evidenceResolution:'unresolved',eligibility:'unknown',confidence:'not-established'});
group.unresolvedCount++;
if(item.acknowledged)group.acknowledgedButUnverifiedCount++;
}
return {kind:'experimental-gm-source-check-preparation',groups,groupCount:groups.length,unresolvedCount:priorities.unresolvedCount,unacknowledgedCount:priorities.unacknowledgedCount,acknowledgedButUnverifiedCount:priorities.acknowledgedButUnverifiedCount,sourceVerification:'not-performed',evidenceResolution:'unresolved',eligibility:'unknown',confidence:'not-established',warning:'Manual preparation is not independent source verification. No eligibility decision or source resolution is authorized.',productionActivationAllowed:false,persistencePerformed:false,automaticTransactionsAllowed:false,automaticRosterChangesAllowed:false,finalDecisionMaker:'human-gm'};
}
return {prepare};});