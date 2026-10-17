/* Mission 1253: non-authoritative, read-only human GM evidence collection handoff packets. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-gm-source-check-preparation'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMEvidenceCollectionHandoff=api;})(typeof globalThis!=='undefined'?globalThis:this,function(dep){
'use strict';
function handoff(review,approved){
if(approved!==true)throw Error('Explicit human GM approval required');
const source=dep||(typeof globalThis!=='undefined'&&globalThis.HLMGMSourceCheckPreparation);
if(!source||typeof source.prepare!=='function')throw Error('Source-check preparation unavailable');
const prepared=source.prepare(review,true),packets=[];
for(const group of prepared.groups)for(const question of group.questions){
packets.push({packetId:'manual-source-check-'+question.reviewOrder,gateId:question.gateId,reviewOrder:question.reviewOrder,sourceScope:group.sourceScope,sourceProvenance:{scope:group.sourceScope,sourceIdentifier:'not-provided',sourceLocation:'not-provided',sourceCheckedAt:'not-performed',sourceAuthenticity:'not-assessed'},evidenceNeeded:question.evidenceNeeded,uncertainty:question.uncertainty,reviewAcknowledged:question.acknowledged,reviewNote:question.reviewNote,manualCollectionSteps:question.manualSteps.slice(),humanCollectionFields:[{field:'source-reference',value:'not-collected'},{field:'observed-evidence',value:'not-collected'},{field:'verification-notes',value:'not-collected'}],collectionStatus:'not-collected',sourceVerification:'not-performed',evidenceResolution:'unresolved',eligibility:'unknown',confidence:'not-established'});
}
return {kind:'experimental-gm-evidence-collection-handoff',packets,packetCount:packets.length,groupCount:prepared.groupCount,unacknowledgedCount:prepared.unacknowledgedCount,acknowledgedButUnverifiedCount:prepared.acknowledgedButUnverifiedCount,collectionStatus:'not-collected',sourceVerification:'not-performed',evidenceResolution:'unresolved',eligibility:'unknown',confidence:'not-established',warning:'Packets are instructions for independent human source collection only. No source has been checked, evidence collected, or eligibility established.',productionActivationAllowed:false,persistencePerformed:false,automaticTransactionsAllowed:false,automaticRosterChangesAllowed:false,finalDecisionMaker:'human-gm'};
}
return {handoff};});