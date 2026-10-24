'use strict';
/* Mission 1507Z: atomic ledger adapter protocol, isolated experimental only.
 * Adapter must independently guarantee atomic durable compare-and-swap.
 * This module cannot verify adapter provenance or durable storage semantics.
 * No game state writes, player transfers, or trade settlement.
 */
const {propose}=require('./hlm-phase11-m1507y-replay-ledger-contract');
function fail(code){return Object.freeze({ok:false,code,committed:false,durable:false,replayProtected:false,settlementAuthorized:false,saved:false});}
async function attempt(adapter,receipt,keyId,authorization,options={}){
 if(options.cancelled===true||options.declined===true)return fail('gm-declined-or-cancelled');
 if(!adapter||typeof adapter.read!=='function'||typeof adapter.compareAndSwap!=='function')
  return fail('missing-atomic-adapter');
 if(!authorization||authorization.authenticatedCpuConsent!==true||
  authorization.signatureValid!==true||authorization.receivingTeamVerified!==true)
  return fail('unverified-cpu-consent');
 // A caller flag is not an independently established authority.
 if(options.experimentalEnabled!==true)return fail('experiment-disabled');
 let snapshot;
 try{snapshot=await adapter.read()}catch{return fail('ledger-read-failed')}
 if(!snapshot||typeof snapshot!=='object')return fail('invalid-ledger-snapshot');
 const candidate=propose(snapshot,receipt,keyId,authorization,{
  expectedLedgerRevision:options.expectedLedgerRevision});
 if(!candidate.ok)return fail(candidate.code);
 // This call must be an atomic CAS at the storage layer. Never trust a
 // plain read-then-write implementation for production.
 let result;
 try{result=await adapter.compareAndSwap({
  expectedRevision:candidate.expectedLedgerRevision,
  nextLedger:candidate.nextLedger,fingerprint:candidate.fingerprint});
 }catch{return fail('atomic-commit-error')}
 if(!result||result.committed!==true)return fail('atomic-commit-conflict-or-failure');
 // Do not assert durability/replay protection based on a caller's return
 // value: the storage backend must be independently audited first.
 return Object.freeze({ok:true,code:'adapter-reports-commit-not-independently-audited',
  committed:false,durable:false,replayProtected:false,
  settlementAuthorized:false,saved:false,adapterReportedCommit:true});
}
module.exports={attempt};
