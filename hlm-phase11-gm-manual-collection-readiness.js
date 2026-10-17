/* Mission 1255: read-only human GM manual evidence collection readiness priorities. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-gm-evidence-packet-completeness'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMManualCollectionReadiness=api;})(typeof globalThis!=='undefined'?globalThis:this,function(dep){
'use strict';
function prioritize(review,approved){
if(approved!==true)throw Error('Explicit human GM approval required');
const source=dep||(typeof globalThis!=='undefined'&&globalThis.HLMGMEvidencePacketCompleteness);
if(!source||typeof source.assess!=='function')throw Error('Evidence packet completeness unavailable');
const report=source.assess(review,true);
const packets=report.packets.map(p=>{
const missingProvenanceFields=p.missingProvenanceFields.slice(),missingCollectionFields=p.missingCollectionFields.slice();
const missingSourceReference=missingCollectionFields.includes('source-reference');
const missingVerificationNotes=missingCollectionFields.includes('verification-notes');
const missingObservedEvidence=missingCollectionFields.includes('observed-evidence');
const nextHumanChecks=[...missingProvenanceFields.map(field=>'Document source provenance: '+field),...(missingSourceReference?['Record independent source reference']:[]),...(missingObservedEvidence?['Record observed source evidence']:[]),...(missingVerificationNotes?['Record human verification notes']:[])];
return {packetId:p.packetId,gateId:p.gateId,reviewOrder:p.reviewOrder,sourceScope:p.sourceScope,reviewAcknowledged:p.reviewAcknowledged,reviewNote:p.reviewNote,evidenceNeeded:p.evidenceNeeded,uncertainty:p.uncertainty,missingProvenanceFields,missingCollectionFields,missingSourceReference,missingObservedEvidence,missingVerificationNotes,missingFieldCount:p.missingFieldCount,nextHumanChecks,readiness:'not-ready-for-human-verification',sourceVerification:'not-performed',evidenceResolution:'unresolved',eligibility:'unknown',confidence:'not-established'};
});
packets.sort((a,b)=>Number(b.missingProvenanceFields.length>0)-Number(a.missingProvenanceFields.length>0)||Number(b.missingSourceReference)-Number(a.missingSourceReference)||Number(b.missingVerificationNotes)-Number(a.missingVerificationNotes)||b.missingFieldCount-a.missingFieldCount||a.reviewOrder-b.reviewOrder||a.packetId.localeCompare(b.packetId));
packets.forEach((p,i)=>{p.collectionPriority=i+1});
return {kind:'experimental-gm-manual-collection-readiness',packets,packetCount:packets.length,incompletePacketCount:report.incompletePacketCount,missingProvenanceCount:report.missingProvenanceCount,missingCollectionCount:report.missingCollectionCount,acknowledgedButUnverifiedCount:report.acknowledgedButUnverifiedCount,sourceVerification:'not-performed',evidenceResolution:'unresolved',eligibility:'unknown',confidence:'not-established',warning:'Readiness priority orders missing manual fields only. Completeness is not independent source validation or player eligibility.',productionActivationAllowed:false,persistencePerformed:false,automaticTransactionsAllowed:false,automaticRosterChangesAllowed:false,finalDecisionMaker:'human-gm'};
}
return {prioritize};});