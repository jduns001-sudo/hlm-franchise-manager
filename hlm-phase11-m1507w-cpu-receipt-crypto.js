'use strict';
/* Mission 1507W: Node-only cryptographic receiving-team receipt verification.
 * This is an offline primitive, NOT an independently provisioned trust root.
 * Caller-supplied public keys never establish trusted receiving-team authority.
 * No storage, durable replay ledger, browser activation, or trade settlement.
 */
const crypto=require('node:crypto');
const {identity}=require('./hlm-phase11-m1507p-trade-authority-readiness');
const MAX_RECEIPT_BYTES=4096;
function canonical(fields){
 return JSON.stringify({schema:'hlm-m1507w-cpu-receipt-v1',
  proposalDigest:fields.proposalDigest,stateRevision:fields.stateRevision,
  receivingTeamId:fields.receivingTeamId,decision:fields.decision,nonce:fields.nonce});
}
function verify(state,input,revision,receipt,publicKey,options){
 const deny=(code,digest=null,signatureValid=false)=>Object.freeze({
  status:'receiving-team-proof-not-authoritative',code,proposalDigest:digest,
  signatureValid,independentlyAuthenticated:false,authenticatedCpuConsent:false,
  replayProtected:false,settlementAuthorized:false,saved:false,experimental:true});
 if(options?.cancelled===true||options?.declined===true)return deny('gm-declined-or-cancelled');
 let id;
 try{id=identity(state,input,revision)}catch{return deny('invalid-source-or-revision')}
 if(!receipt||typeof receipt!=='object'||Array.isArray(receipt))return deny('missing-receipt',id.digest);
 const keys=Object.keys(receipt).sort();
 const allowed=['decision','nonce','proposalDigest','receivingTeamId','signature','stateRevision'];
 if(keys.length!==allowed.length||keys.some((k,i)=>k!==allowed[i]))return deny('invalid-receipt-shape',id.digest);
 if(receipt.proposalDigest!==id.digest||receipt.stateRevision!==id.revision)
  return deny('stale-or-mismatched-receipt',id.digest);
 if(typeof receipt.receivingTeamId!=='string'||!receipt.receivingTeamId.trim()||
    receipt.receivingTeamId.length>128||!['accept','decline'].includes(receipt.decision)||
    typeof receipt.nonce!=='string'||!/^[-_a-zA-Z0-9]{16,128}$/.test(receipt.nonce)||
    typeof receipt.signature!=='string'||! /^[A-Za-z0-9_-]{80,256}$/.test(receipt.signature))
  return deny('invalid-receipt-fields',id.digest);
 const payload=canonical(receipt);
 if(Buffer.byteLength(payload)>MAX_RECEIPT_BYTES)return deny('receipt-too-large',id.digest);
 let valid=false;
 try{
  const key=publicKey instanceof crypto.KeyObject && publicKey.type==='public' ? publicKey : crypto.createPublicKey(publicKey);
  if(key.asymmetricKeyType!=='ed25519')return deny('unsupported-key-type',id.digest);
  valid=crypto.verify(null,Buffer.from(payload),key,Buffer.from(receipt.signature,'base64url'));
 }catch{return deny('signature-verification-failed',id.digest)}
 if(!valid)return deny('signature-verification-failed',id.digest);
 // A valid signature proves possession of the paired key, not that the key
 // belongs to an independently trusted CPU organization. Do not authorize.
 return deny('independent-trust-anchor-and-replay-ledger-unavailable',id.digest,true);
}
module.exports={verify,canonical};
