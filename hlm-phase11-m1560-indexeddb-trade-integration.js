'use strict';
/* Mission 1560: reuse existing IndexedDB transaction machinery for synthetic
 * isolated trade settlement. Not a production trade or authenticated CPU consent.
 * Real authorization and production settlement remain blocked by M1522.
 */
const {settleIsolated}=require('./hlm-phase11-m1522-isolated-atomic-trade-settlement');
const {decideCpuTrade}=require('./hlm-phase11-m1555-engine-owned-cpu-decision');
const {prepareIsolatedAtomicTrade}=require('./hlm-phase11-m1557-isolated-atomic-trade');
const deny=code=>Object.freeze({ok:false,code,saved:false,settlementAuthorized:false});
async function settleSyntheticTradeWithIndexedDb(state,input={},options={}){
 if(options.experimentalEnabled!==true)return deny('experiment-disabled');
 if(options.cancelled===true||options.declined===true)return deny('gm-cancelled-or-declined');
 if(options.gmApproved!==true||input.gmApproved!==true)return deny('human-gm-approval-required');
 if(options.realTradeSettlement===true)return deny('production-trade-settlement-disabled');
 if(options.syntheticTestAuthorization!==true)return deny('synthetic-test-authorization-required');
 if(typeof options.experimentalDatabaseName!=='string'||!/^hlm-phase11-[a-zA-Z0-9_-]*experimental[a-zA-Z0-9_-]*$/.test(options.experimentalDatabaseName))
  return deny('isolated-experimental-database-required');
 const decision=decideCpuTrade(state,input);
 if(decision.ok!==true)return deny(decision.code);
 if(decision.decision!=='accept')return deny('cpu-policy-declined');
 const prepared=prepareIsolatedAtomicTrade(state,input);
 if(prepared.ok!==true)return deny(prepared.code);
 const result=await settleIsolated(state,input,{
  experimentalEnabled:true,gmApproved:true,syntheticTestAuthorization:true,
  expectedGameRevision:input.expectedGameRevision,eventId:options.eventId,
  experimentalDatabaseName:options.experimentalDatabaseName,realTradeSettlement:false
 });
 return Object.freeze({ok:result.ok===true,code:result.code,saved:result.saved===true,
  experimentalSyntheticSave:result.saved===true,settlementAuthorized:false,
  cpuConsentAuthenticated:false,proposalId:decision.proposalId});
}
module.exports={settleSyntheticTradeWithIndexedDb};
