'use strict';
// Experimental read-only verifier. No deployed CPU signing authority or trusted
// public key is configured. Caller-supplied keys and authentication flags are ignored.
const crypto=require('node:crypto');
const {classifyCpuEvidence}=require('./hlm-phase11-m1641-cpu-consent-boundary');
const TRUSTED_CPU_PUBLIC_KEYS=Object.freeze([]);
const deny=(code)=>Object.freeze({ok:false,code,consentAuthenticated:false,settlementAuthorized:false,saved:false,productionTouched:false,experimental:true});
const nonempty=x=>typeof x==='string'&&x.length>0;
function verifyTrustedCpuConsent(request={}){
 if(!request||typeof request!=='object'||Array.isArray(request))return deny('invalid-request');
 if(request.gmAction!=='approve'||request.humanGMApproved!==true)return deny('gm-approval-required');
 const e=request.cpuEvidence;
 if(!e||typeof e!=='object'||Array.isArray(e))return deny('cpu-evidence-missing');
 if(classifyCpuEvidence(e)==='synthetic-fixture')return deny('synthetic-evidence-not-authenticated');
 if(e.decision==='decline')return deny('cpu-declined');
 if(e.decision!=='accept')return deny('invalid-cpu-decision');
 const keys=['slot','revision','proposalDigest','teamId'];
 if(!keys.every(k=>nonempty(request[k])))return deny('invalid-binding');
 if(keys.some(k=>e[k]!==request[k]))return deny('cpu-evidence-binding-mismatch');
 if(!nonempty(e.decisionId)||!nonempty(e.issuer)||!nonempty(e.signature)||!nonempty(e.keyId))
  return deny('signed-source-evidence-required');
 if(!Number.isSafeInteger(e.issuedAt)||!Number.isSafeInteger(e.expiresAt)||
    !Number.isSafeInteger(request.now)||e.issuedAt>request.now||
    e.expiresAt<=request.now||e.expiresAt<=e.issuedAt)return deny('stale-or-invalid-evidence');
 if(!Array.isArray(request.consumedDecisionIds))return deny('replay-ledger-required');
 if(request.consumedDecisionIds.includes(e.decisionId))return deny('replayed-cpu-decision');
 // Trust anchors must be provisioned by a separate audited deployment mission.
 // Never trust request.publicKey, request.verifier, request.authenticated, etc.
 const key=TRUSTED_CPU_PUBLIC_KEYS.find(k=>k.keyId===e.keyId&&k.issuer===e.issuer);
 if(!key)return deny('trusted-cpu-key-unavailable');
 const payload=JSON.stringify({slot:e.slot,revision:e.revision,proposalDigest:e.proposalDigest,
  teamId:e.teamId,decision:e.decision,decisionId:e.decisionId,issuer:e.issuer,
  keyId:e.keyId,issuedAt:e.issuedAt,expiresAt:e.expiresAt});
 let valid=false;
 try{valid=crypto.verify(null,Buffer.from(payload),key.publicKey,Buffer.from(e.signature,'base64'))}catch{}
 if(!valid)return deny('invalid-cpu-signature');
 // Authentication alone must never authorize settlement or save a game.
 return Object.freeze({ok:true,code:'cpu-consent-cryptographically-verified',
  consentAuthenticated:true,settlementAuthorized:false,saved:false,productionTouched:false,experimental:true});
}
module.exports=Object.freeze({verifyTrustedCpuConsent});
