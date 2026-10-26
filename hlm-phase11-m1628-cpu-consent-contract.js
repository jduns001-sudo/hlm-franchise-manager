'use strict';
/* Mission 1628: read-only CPU consent trust boundary.
 * No independently established issuer is currently available.
 * Never trust caller-provided issuer, signature, or ledger fields as authentication.
 * This module never writes or authorizes settlement.
 */
const {inspect}=require('./hlm-phase11-m1627-cpu-consent-boundary');
const deny=(code,sourceBound=false)=>Object.freeze({ok:false,code,sourceBound,consentAuthenticated:false,settlementAuthorized:false,saved:false});
function verifyCpuConsent(state,input={},evidence={}){
 const source=inspect(state,input);
 if(!source.ok)return deny(source.code);
 if(!evidence||typeof evidence!=='object'||Array.isArray(evidence))return deny('independent-cpu-issuer-required',true);
 const fields=['proposalId','outgoingPlayerId','incomingPlayerId','gmTeamId','receivingTeamId','gameRevision','policyId'];
 const expected=[input.proposalId,input.outgoingPlayerId,input.incomingPlayerId,String(state.meta.controlledTeamId),source.receivingTeamId,state.meta.revision,'incoming-team-aav-nonincreasing-v1'];
 if(fields.some((key,i)=>evidence[key]!==expected[i]))return deny('cpu-consent-binding-mismatch',true);
 if(evidence.decision!=='accept')return deny(evidence.decision==='decline'?'cpu-declined':'invalid-cpu-consent-decision',true);
 if(!Number.isSafeInteger(evidence.issuedAt)||!Number.isSafeInteger(evidence.expiresAt)||evidence.expiresAt<=evidence.issuedAt)return deny('invalid-cpu-consent-window',true);
 if(!Number.isSafeInteger(input.reviewTime)||input.reviewTime<evidence.issuedAt||input.reviewTime>=evidence.expiresAt)return deny('expired-or-not-yet-valid-cpu-consent',true);
 if(typeof evidence.nonce!=='string'||!evidence.nonce.trim())return deny('cpu-consent-nonce-required',true);
 // No issuer registry, independently protected verification key, or replay ledger exists.
 // In particular, do NOT interpret evidence.authenticated or evidence.signature as proof.
 return deny('independent-cpu-issuer-required',true);
}
module.exports=Object.freeze({verifyCpuConsent});
