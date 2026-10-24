'use strict';
/* Mission 1558: atomic settlement boundary with a non-forgeable engine grant.
 * A caller cannot pass a grant: only a trusted engine-owned closure can invoke commit.
 * Until an independent authorization service is connected, the public entrypoint
 * deliberately fails closed. No production storage key is ever accepted.
 */
const {prepareIsolatedAtomicTrade}=require('./hlm-phase11-m1557-isolated-atomic-trade');
const deny=code=>Object.freeze({ok:false,code,saved:false,settlementAuthorized:false});
function createIsolatedTradeSettlementEngine({readCurrent,compareAndSwap,storageKey,authorizeCpu}={}){
 const isolated=typeof storageKey==='string'&&/^hlm-[a-zA-Z0-9_-]+$/.test(storageKey)&&storageKey!=='hlm_front_office_v8';
 const trustedAuthorization=typeof authorizeCpu==='function';
 function requestSettlement({state,input={}}={}){
  if(!isolated)return deny('isolated-storage-required');
  if(typeof readCurrent!=='function'||typeof compareAndSwap!=='function')return deny('atomic-store-required');
  if(!trustedAuthorization)return deny('independent-cpu-authorization-required');
  const current=readCurrent();
  if(!current||!Number.isSafeInteger(current.meta?.revision))return deny('persisted-source-required');
  if(!state||state.meta?.revision!==current.meta.revision)return deny('stale-persisted-source');
  const prepared=prepareIsolatedAtomicTrade(current,input);
  if(prepared.ok!==true)return deny(prepared.code);
  // Authorization must be engine-owned, not a boolean or ledger supplied in input.
  // No contract for the independent authorizer has been verified. Fail closed
  // rather than treating a callback or policy recommendation as authenticated.
  return deny('trusted-cpu-authorizer-not-integrated');
 }
 return Object.freeze({requestSettlement});
}
module.exports={createIsolatedTradeSettlementEngine};
