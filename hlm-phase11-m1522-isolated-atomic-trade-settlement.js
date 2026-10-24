'use strict';
/* Mission 1522: one-call experimental isolated trade settlement.
 * CPU policy is recomputed from source on each attempt. In this client-only
 * trust model this is NOT cryptographic CPU consent or production authority.
 * Real production settlement is unavailable. Atomic write is limited to the
 * existing synthetic experimental IndexedDB store.
 */
const {prepareTransaction}=require('./hlm-phase11-m1521-atomic-trade-transaction-contract');
const store=require('./hlm-phase11-m1516-atomic-isolated-state-persistence');
const deny=code=>Object.freeze({ok:false,code,saved:false,settlementAuthorized:false});
async function settleIsolated(state,input,options={}){
 if(options.experimentalEnabled!==true)return deny('experiment-disabled');
 if(options.cancelled===true||options.declined===true)return deny('gm-cancelled-or-declined');
 if(options.gmApproved!==true)return deny('gm-approval-required');
 if(options.realTradeSettlement===true)return deny('production-trade-settlement-disabled');
 // Synthetic authorization must be explicit; it cannot grant real CPU consent.
 if(options.syntheticTestAuthorization!==true)return deny('synthetic-authorization-required');
 const tx=prepareTransaction(state,input,options);
 if(!tx.ok)return deny(tx.code);
 const dbName=options.experimentalDatabaseName;
 try{
  const stored=await store.read(dbName);
  if(stored.game!==null){
   if(stored.game.meta?.revision!==tx.expectedRevision)return deny('stale-state');
   if(JSON.stringify(stored.game)!==JSON.stringify(state))return deny('source-state-mismatch');
  }else if(tx.expectedRevision!==0)return deny('uninitialized-experimental-store');
  const result=await store.commit({
   experimentalEnabled:true,gmApproved:true,syntheticTestAuthorization:true,
   expectedRevision:tx.expectedRevision,candidateState:tx.candidateState,
   eventId:tx.eventId,realTradeSettlement:false
  },dbName);
  return Object.freeze({ok:result.committed===true,code:result.code,
   saved:result.saved===true,experimentalSyntheticSave:result.saved===true,
   cpuConsentAuthenticated:false,settlementAuthorized:false});
 }catch(error){return deny('isolated-storage-error')}
}
module.exports={settleIsolated};
