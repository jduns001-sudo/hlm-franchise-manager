'use strict';
/* Mission 1507V: authority-contract verifier, read-only and fail-closed.
 * No trusted receiving-team authority is configured. Caller-supplied proofs,
 * signatures, flags, or callbacks cannot authenticate consent.
 */
const {identity}=require('./hlm-phase11-m1507p-trade-authority-readiness');
const {inspect:readiness}=require('./hlm-phase11-m1507u-settlement-readiness');
function verify(state,input,revision,receipt,options){
 const deny=(code,id=null)=>Object.freeze({
  status:'receiving-team-authority-unverified',code,
  proposalDigest:id?.digest||null,stateRevision:id?.revision||null,
  independentlyAuthenticated:false,authenticatedCpuConsent:false,
  replayProtected:false,settlementAuthorized:false,saved:false,experimental:true
 });
 if(options?.declined===true||options?.cancelled===true)return deny('gm-declined-or-cancelled');
 let id;
 try{id=identity(state,input,revision)}catch{return deny('invalid-proposal-or-revision')}
 if(!receipt||typeof receipt!=='object'||Array.isArray(receipt))return deny('missing-receiving-team-proof',id);
 if(receipt.proposalDigest!==id.digest||receipt.stateRevision!==id.revision)
  return deny('proposal-identity-mismatch',id);
 if(typeof receipt.receivingTeamId!=='string'||!receipt.receivingTeamId.trim())
  return deny('missing-receiving-team-identity',id);
 const check=readiness(state,input,revision,receipt);
 if(check.code==='cpu-source-review-blocked'||check.code==='cpu-recommends-decline')
  return deny('source-eligibility-failed',id);
 // Never accept supplied trusted/authenticated/signed/nonce/replay flags as proof.
 // A trusted identity registry, cryptographic verifier, and durable replay ledger
 // must be provided by separately reviewed infrastructure before this can pass.
 return deny('trusted-receiving-team-verifier-unavailable',id);
}
module.exports={verify};
