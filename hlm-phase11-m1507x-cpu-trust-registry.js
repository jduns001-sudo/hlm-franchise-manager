'use strict';
/* Mission 1507X: trusted-key registry validation, offline and read-only.
 * A registry is trusted ONLY when supplied from an independently provisioned
 * authority source. This module cannot establish that provenance itself.
 * Never persist a trade or claim replay protection from this result.
 */
const crypto=require('node:crypto');
const {verify}=require('./hlm-phase11-m1507w-cpu-receipt-crypto');
const own=Object.prototype.hasOwnProperty;
function checkRegistry(registry,teamId,keyId){
 if(!registry||typeof registry!=='object'||Array.isArray(registry)||
    registry.schema!=='hlm-cpu-authority-registry-v1'||
    registry.provenance!=='independently-provisioned'||
    registry.trustEstablished!==true||
    typeof registry.revision!=='string'||!registry.revision.trim()||
    !registry.teams||typeof registry.teams!=='object'||Array.isArray(registry.teams)||
    typeof teamId!=='string'||!teamId.trim()||typeof keyId!=='string'||!keyId.trim())
   return {ok:false,code:'untrusted-or-malformed-registry'};
 // Explicit caller fields do NOT authenticate registry provenance.
 if(!registry.provenanceVerifier||typeof registry.provenanceVerifier!=='function')
   return {ok:false,code:'independent-registry-verifier-unavailable'};
 let verified=false;
 try{verified=registry.provenanceVerifier(registry)===true}catch{}
 if(!verified)return {ok:false,code:'registry-provenance-not-verified'};
 if(!own.call(registry.teams,teamId))return {ok:false,code:'receiving-team-not-registered'};
 const team=registry.teams[teamId];
 if(!team||team.active!==true||!team.keys||typeof team.keys!=='object'||
    !own.call(team.keys,keyId))return {ok:false,code:'team-or-key-inactive'};
 const entry=team.keys[keyId];
 if(!entry||entry.active!==true||typeof entry.publicKeyPem!=='string')
   return {ok:false,code:'key-inactive'};
 try{
  const key=crypto.createPublicKey(entry.publicKeyPem);
  if(key.asymmetricKeyType!=='ed25519')return {ok:false,code:'unsupported-key'};
  return {ok:true,key};
 }catch{return {ok:false,code:'invalid-public-key'}}
}
function evaluate(state,input,revision,receipt,registry,keyId,options){
 const deny=(code,signatureValid=false)=>Object.freeze({
  code,signatureValid,receivingTeamVerified:false,authenticatedCpuConsent:false,
  replayProtected:false,settlementAuthorized:false,saved:false,experimental:true});
 if(options?.cancelled===true||options?.declined===true)return deny('gm-declined-or-cancelled');
 if(!receipt||typeof receipt.receivingTeamId!=='string')return deny('missing-receipt');
 const selected=checkRegistry(registry,receipt.receivingTeamId,keyId);
 if(!selected.ok)return deny(selected.code);
 const signed=verify(state,input,revision,receipt,selected.key,options);
 if(!signed.signatureValid)return deny(signed.code);
 // Signature + verified registry can identify a signing team, but cannot
 // replace an actual independent CPU decision, durable replay ledger, or save lock.
 return Object.freeze({code:'verified-key-no-durable-consent-or-replay',
  signatureValid:true,receivingTeamVerified:true,authenticatedCpuConsent:false,
  replayProtected:false,settlementAuthorized:false,saved:false,experimental:true});
}
module.exports={checkRegistry,evaluate};
