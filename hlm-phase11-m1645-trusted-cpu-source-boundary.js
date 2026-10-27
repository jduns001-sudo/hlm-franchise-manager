'use strict';
// Read-only source boundary. No authoritative CPU decision issuer is deployed.
// This registry must only be changed through a separately audited deployment.
const TRUSTED_ISSUERS=Object.freeze([]);
const deny=code=>Object.freeze({ok:false,code,sourceAuthenticated:false,settlementAuthorized:false,saved:false,productionTouched:false,experimental:true});
function inspectTrustedCpuSource(request={}){
 if(!request||typeof request!=='object'||Array.isArray(request))return deny('invalid-request');
 if(request.experimentalEnabled!==true)return deny('disabled-by-default');
 if(request.gmAction!=='approve'||request.humanGMApproved!==true)return deny('gm-approval-required');
 const e=request.cpuEvidence;
 if(!e||typeof e!=='object'||Array.isArray(e))return deny('cpu-evidence-missing');
 if(e.synthetic===true||e.localTestFixture===true||e.source==='fixture'||e.classification==='synthetic-fixture')return deny('synthetic-evidence');
 if(e.decision==='decline')return deny('cpu-declined');
 if(e.decision!=='accept')return deny('invalid-decision');
 for(const k of ['slot','revision','proposalDigest','teamId']){
  if(typeof request[k]!=='string'||!request[k]||e[k]!==request[k])return deny('binding-mismatch');
 }
 if(!Number.isSafeInteger(request.now)||!Number.isSafeInteger(e.issuedAt)||!Number.isSafeInteger(e.expiresAt)||e.issuedAt>request.now||e.expiresAt<=request.now||e.expiresAt<=e.issuedAt)return deny('expired-or-invalid');
 if(!Array.isArray(request.consumedDecisionIds)||typeof e.decisionId!=='string'||!e.decisionId)return deny('replay-ledger-required');
 if(request.consumedDecisionIds.includes(e.decisionId))return deny('replayed-decision');
 // A label, caller-supplied key, callback or signed-looking payload is not an authority.
 const issuer=TRUSTED_ISSUERS.find(x=>x.id===e.issuer);
 if(!issuer)return deny('trusted-cpu-source-unavailable');
 return deny('source-verification-not-connected');
}
module.exports=Object.freeze({inspectTrustedCpuSource});
