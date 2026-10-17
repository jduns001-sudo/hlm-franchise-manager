/* Mission 1254: deterministic, non-authoritative completeness of manual evidence handoff packets. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./hlm-phase11-gm-evidence-collection-handoff'):null);if(typeof module==='object'&&module.exports)module.exports=api;else root.HLMGMEvidencePacketCompleteness=api;})(typeof globalThis!=='undefined'?globalThis:this,function(dep){
'use strict';
function assess(review,approved){
if(approved!==true)throw Error('Explicit human GM approval required');
const source=dep||(typeof globalThis!=='undefined'&&globalThis.HLMGMEvidenceCollectionHandoff);
if(!source||typeof source.handoff!=='function')throw Error('Evidence collection handoff unavailable');
const handoff=source.handoff(review,true);
const packets=handoff.packets.map(p=>{
const provenance=p.sourceProvenance||{};
const missingProvenance=['sourceIdentifier','sourceLocation','sourceCheckedAt','sourceAuthenticity'].filter(key=>typeof provenance[key]!=='string'||!provenance[key].trim()||['not-provided','not-performed','not-assessed'].includes(provenance[key]));
const fields=Array.isArray(p.humanCollectionFields)?p.humanCollectionFields:[];
const missingCollectionFields=['source-reference','observed-evidence','verification-notes'].filter(name=>!fields.some(f=>f.field===name&&typeof f.value==='string'&&f.value.trim()&&f.value!=='not-collected'));
return {packetId:p.packetId,gateId:p.gateId,reviewOrder:p.reviewOrder,sourceScope:p.sourceScope,reviewAcknowledged:p.reviewAcknowledged,reviewNote:p.reviewNote,uncertainty:p.uncertainty,evidenceNeeded:p.evidenceNeeded,missingProvenanceFields:missingProvenance,missingCollectionFields,missingFieldCount:missingProvenance.length+missingCollectionFields.length,completeness:'incomplete',sourceVerification:'not-performed',evidenceResolution:'unresolved',eligibility:'unknown',confidence:'not-established'};
});
return {kind:'experimental-gm-evidence-packet-completeness',packets,packetCount:packets.length,incompletePacketCount:packets.filter(p=>p.missingFieldCount>0).length,missingProvenanceCount:packets.reduce((n,p)=>n+p.missingProvenanceFields.length,0),missingCollectionCount:packets.reduce((n,p)=>n+p.missingCollectionFields.length,0),acknowledgedButUnverifiedCount:handoff.acknowledgedButUnverifiedCount,sourceVerification:'not-performed',evidenceResolution:'unresolved',eligibility:'unknown',confidence:'not-established',warning:'Completeness describes missing manual packet fields only; no independent source validation, evidence collection, or eligibility determination occurred.',productionActivationAllowed:false,persistencePerformed:false,automaticTransactionsAllowed:false,automaticRosterChangesAllowed:false,finalDecisionMaker:'human-gm'};
}
return {assess};});