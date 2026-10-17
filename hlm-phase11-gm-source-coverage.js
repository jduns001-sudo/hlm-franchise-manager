/* Mission 1250: source-coverage ledger for unresolved human GM review gates. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-gm-source-followup'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMSourceCoverage=api;})(typeof globalThis!=='undefined'?globalThis:this,function(dep){
'use strict';
function summarize(review,approved){
if(approved!==true)throw Error('Explicit human GM approval required');
const source=dep||(typeof globalThis!=='undefined'&&globalThis.HLMGMSourceFollowup);
if(!source||typeof source.plan!=='function')throw Error('Source follow-up unavailable');
const followup=source.plan(review,true);
const questions=followup.questions.map(q=>({gateId:q.gateId,sequence:q.sequence,reviewAcknowledged:q.reviewAcknowledged,reviewNote:q.reviewNote,evidenceNeeded:q.evidenceNeeded,sourceScope:q.sourceScope,uncertainty:q.uncertainty,manualAction:q.nextStep,sourceVerification:'not-performed',evidenceResolution:'unresolved',eligibility:'unknown',confidence:'not-established'}));
return {kind:'experimental-gm-source-coverage',questions,unresolvedCount:questions.length,acknowledgedCount:questions.filter(q=>q.reviewAcknowledged).length,unverifiedCount:questions.length,coverageStatus:'not-verified',eligibility:'unknown',confidence:'not-established',warning:'Acknowledgement is not source verification. No lineup eligibility or source resolution is inferred.',productionActivationAllowed:false,persistencePerformed:false,automaticTransactionsAllowed:false,automaticRosterChangesAllowed:false,finalDecisionMaker:'human-gm'};
}
return {summarize};});