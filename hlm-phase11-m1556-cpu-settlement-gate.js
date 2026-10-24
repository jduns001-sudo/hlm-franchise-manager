'use strict';
/* Mission 1556: integrated fail-closed CPU decision and atomic preview gate.
 * Engine policy acceptance is not independent consent. No writes, candidate state,
 * production activation, or settlement authority. */
const {decideCpuTrade}=require('./hlm-phase11-m1555-engine-owned-cpu-decision');
const {requestAtomicTradeCommit}=require('./hlm-phase11-m1542-atomic-trade-commit-guard');
const deny=(code,stage)=>Object.freeze({ok:false,code,stage,saved:false,consentAuthenticated:false,settlementAuthorized:false});
function requestCpuTradeSettlement({state,input={},readCurrent,writeCurrent,storageKey}={}){
 if(typeof storageKey!=='string'||!/^hlm-[a-zA-Z0-9_-]+$/.test(storageKey)||
    storageKey==='hlm_front_office_v8')return deny('isolated-storage-required','storage');
 if(typeof readCurrent!=='function')return deny('source-reader-required','source');
 // Read the persisted state, not the caller's mutable state, for CPU policy.
 const current=readCurrent();
 if(!current||!Number.isSafeInteger(current.meta?.revision))return deny('persisted-source-required','source');
 if(!state||state.meta?.revision!==current.meta.revision)return deny('stale-persisted-source','source');
 const decision=decideCpuTrade(current,input);
 if(decision.ok!==true)return deny(decision.code,'cpu-policy');
 if(decision.decision!=='accept')return deny('cpu-policy-declined','cpu-policy');
 // Existing guard independently re-reads and checks source revision and preview.
 const guard=requestAtomicTradeCommit({state:current,input,readCurrent,writeCurrent,storageKey});
 if(guard.ok!==true)return Object.freeze({ok:false,code:guard.code,stage:'atomic-guard',
  proposalId:decision.proposalId,gameRevision:decision.gameRevision,
  decision:decision.decision,saved:false,consentAuthenticated:false,settlementAuthorized:false});
 return deny('independent-cpu-consent-required','authorization');
}
module.exports={requestCpuTradeSettlement};
