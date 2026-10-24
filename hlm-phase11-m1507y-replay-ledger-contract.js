'use strict';
/* Mission 1507Y: immutable replay-ledger transition contract.
 * No persistence, transaction lock, or trade settlement is provided.
 * Callers MUST NOT treat a proposed next ledger as committed or durable.
 */
const crypto=require('node:crypto');
const own=Object.prototype.hasOwnProperty;
const MAX_ENTRIES=10000;
function fail(code){return Object.freeze({ok:false,code,committed:false,durable:false,
 replayProtected:false,settlementAuthorized:false,saved:false});}
function validString(x){return typeof x==='string'&&x.length>=1&&x.length<=256&&/^[A-Za-z0-9:_-]+$/.test(x);}
function fingerprint(fields){
 return crypto.createHash('sha256').update(JSON.stringify([
 'hlm-m1507y-replay-v1',fields.receivingTeamId,fields.keyId,
 fields.proposalDigest,fields.stateRevision,fields.nonce])).digest('hex');
}
function propose(ledger,receipt,keyId,authorization,options={}){
 if(options.cancelled===true||options.declined===true)return fail('gm-declined-or-cancelled');
 if(!authorization||authorization.signatureValid!==true||
  authorization.receivingTeamVerified!==true||authorization.authenticatedCpuConsent!==true)
  return fail('cpu-consent-not-independently-authenticated');
 if(!ledger||typeof ledger!=='object'||Array.isArray(ledger)||
  ledger.schema!=='hlm-m1507y-replay-ledger-v1'||
  !Number.isSafeInteger(ledger.revision)||ledger.revision<0||
  !ledger.consumed||typeof ledger.consumed!=='object'||Array.isArray(ledger.consumed)||
  Object.getPrototypeOf(ledger.consumed)!==Object.prototype)
  return fail('invalid-ledger');
 const entries=Object.keys(ledger.consumed);
 if(entries.length>MAX_ENTRIES||entries.some(k=>! /^[a-f0-9]{64}$/.test(k)||
  ledger.consumed[k]!==true))return fail('invalid-ledger-entries');
 if(!receipt||typeof receipt!=='object'||Array.isArray(receipt)||
  ![receipt.receivingTeamId,keyId,receipt.proposalDigest,receipt.stateRevision,receipt.nonce].every(validString))
  return fail('invalid-receipt-identity');
 if(!Number.isSafeInteger(options.expectedLedgerRevision)||
  options.expectedLedgerRevision!==ledger.revision)return fail('stale-ledger-revision');
 if(ledger.revision===Number.MAX_SAFE_INTEGER||entries.length===MAX_ENTRIES)return fail('ledger-capacity-exceeded');
 const digest=fingerprint({...receipt,keyId});
 if(own.call(ledger.consumed,digest))return fail('authorization-already-consumed');
 const next=Object.freeze({schema:ledger.schema,revision:ledger.revision+1,
  consumed:Object.freeze({...ledger.consumed,[digest]:true})});
 return Object.freeze({ok:true,code:'proposed-only-requires-atomic-durable-commit',
  fingerprint:digest,expectedLedgerRevision:ledger.revision,nextLedger:next,
  committed:false,durable:false,replayProtected:false,
  settlementAuthorized:false,saved:false});
}
module.exports={fingerprint,propose};
