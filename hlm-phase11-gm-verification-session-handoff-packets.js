/* Mission 1273: read-only, human-GM-controlled verification handoff packets. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-gm-cross-group-verification-session-planner'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMVerificationSessionHandoffPackets=api;})(typeof globalThis!=='undefined'?globalThis:this,function(dep){
'use strict';
function packets(review,annotations,approved){
if(approved!==true)throw Error('Explicit human GM approval required');
const source=dep||(typeof globalThis!=='undefined'&&globalThis.HLMGMCrossGroupVerificationSessionPlanner);
if(!source||typeof source.plan!=='function')throw Error('Cross-group session planner unavailable');
const plan=source.plan(review,annotations,true);
const sessions=plan.sessions.map(session=>{
const sourceRequirements=session.actions.map(action=>({
taskId:action.taskId,gateId:action.gateId,roundNumber:action.roundNumber,sessionNumber:action.sessionNumber,
documentationStatus:action.documentationStatus,remainingGap:action.remainingGap,uncertainty:action.uncertainty,
sourceRequirement:action.nextHumanVerificationAction,unresolvedEvidence:action.outstandingQuestion,
independentVerificationCriteria:[...action.independentVerificationCriteria],
gmReviewCheckpoint:'Human GM must inspect source provenance, compare against independent authoritative evidence and explicitly decide next steps outside this read-only packet.',
verificationStatus:'not-independently-verified',checkCompleted:false,eligibility:'unknown'
}));
return {
sessionOrder:session.sessionOrder,prerequisite:session.prerequisite,humanHandoffPriority:session.humanHandoffPriority,
checkCount:session.checkCount,notCollectedCount:session.notCollectedCount,
manuallyDocumentedStillUnverifiedCount:session.manuallyDocumentedStillUnverifiedCount,
sharedBlockers:session.sharedBlockers.map(b=>({...b})),sourceRequirements,
unresolvedEvidenceCount:sourceRequirements.length,
gmReviewCheckpoints:[
'Confirm each source reference and provenance with an independent authoritative source.',
'Review all shared blockers and unresolved evidence before interpreting any candidate source.',
'Human GM independently assesses evidence; this packet does not complete a check, certify eligibility or authorize a move.'
],
independentVerificationRequired:true,sessionStatus:'awaiting-human-verification',completionStatus:'not-completed',
evidenceResolution:'unresolved',eligibility:'unknown',finalDecisionMaker:'human-gm'
};
});
return {
kind:'experimental-gm-verification-session-handoff-packets',sessions,sessionCount:sessions.length,
actionCount:plan.actionCount,notCollectedCount:plan.notCollectedCount,
manuallyDocumentedStillUnverifiedCount:plan.manuallyDocumentedStillUnverifiedCount,
completedCheckCount:0,sharedBlockers:plan.sharedBlockers.map(b=>({...b})),
repeatedPrerequisites:plan.repeatedPrerequisites.map(p=>({...p})),
readiness:'blocked-pending-human-evidence-and-independent-verification',
sourceVerification:'not-performed',evidenceResolution:'unresolved',eligibility:'unknown',
warning:'Read-only suggested handoff packets. Manual documentation is not independent verification. No source checks completed and no eligibility determined.',
productionActivationAllowed:false,persistencePerformed:false,automaticTransactionsAllowed:false,automaticRosterChangesAllowed:false,finalDecisionMaker:'human-gm'
};
}
return {packets};});