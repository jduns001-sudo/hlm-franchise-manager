'use strict';
/* Mission 1562: verified browser provenance -> existing synthetic IndexedDB
 * settlement. No authenticated CPU consent and no production authorization.
 */
const {verify}=require('./hlm-phase11-m1561-browser-trade-provenance');
const {settleSyntheticTradeWithIndexedDb}=require('./hlm-phase11-m1560-indexeddb-trade-integration');
const deny=code=>Object.freeze({ok:false,code,saved:false,settlementAuthorized:false,cpuConsentAuthenticated:false});
async function settleBrowserVerifiedSyntheticTrade(state,input={},record,options={}){
 if(options.experimentalEnabled!==true)return deny('experiment-disabled');
 if(options.cancelled===true||options.declined===true)return deny('gm-cancelled-or-declined');
 if(options.gmApproved!==true||input.gmApproved!==true)return deny('human-gm-approval-required');
 if(options.realTradeSettlement===true)return deny('production-trade-settlement-disabled');
 if(options.syntheticTestAuthorization!==true)return deny('synthetic-test-authorization-required');
 if(!Number.isSafeInteger(input.expectedGameRevision)||input.expectedGameRevision!==state?.meta?.revision)
  return deny('stale-game-revision');
 if(typeof options.eventId!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(options.eventId))
  return deny('invalid-event-id');
 const checked=await verify(state,input,record,{
  experimentalEnabled:true,expectedGameRevision:input.expectedGameRevision,
  cryptoApi:options.cryptoApi
 });
 if(checked.valid!==true)return deny(checked.code);
 if(record.payload?.decision!=='recommend-accept'&&record.payload?.decision!=='accept')
  return deny('cpu-policy-declined');
 const result=await settleSyntheticTradeWithIndexedDb(state,input,options);
 return Object.freeze({...result,settlementAuthorized:false,cpuConsentAuthenticated:false,
  browserProvenanceVerified:true});
}
module.exports={settleBrowserVerifiedSyntheticTrade};
