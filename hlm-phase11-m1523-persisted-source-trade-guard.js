'use strict';
/* Mission 1523: require an existing matching persisted experimental universe
 * before delegating to M1522's synthetic atomic trade transaction.
 * Never authenticates CPU consent or permits real production settlement.
 */
const store=require('./hlm-phase11-m1516-atomic-isolated-state-persistence');
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {settleIsolated}=require('./hlm-phase11-m1522-isolated-atomic-trade-settlement');
const deny=code=>Object.freeze({ok:false,code,saved:false,settlementAuthorized:false});
async function settlePersisted(state,input,options={}){
 if(options.experimentalEnabled!==true)return deny('experiment-disabled');
 if(options.cancelled===true||options.declined===true)return deny('gm-cancelled-or-declined');
 if(options.gmApproved!==true)return deny('gm-approval-required');
 if(options.realTradeSettlement===true)return deny('production-trade-settlement-disabled');
 if(options.syntheticTestAuthorization!==true)return deny('synthetic-authorization-required');
 if(!state||validateGameStateEnvelope(state).valid!==true)return deny('invalid-source-state');
 const revision=state.meta?.revision;
 if(!Number.isSafeInteger(revision)||revision<1)return deny('persisted-source-required');
 const dbName=options.experimentalDatabaseName;
 try{
  const persisted=await store.read(dbName);
  if(!persisted.game||!persisted.ledger)return deny('persisted-source-required');
  if(validateGameStateEnvelope(persisted.game).valid!==true)return deny('invalid-persisted-state');
  if(persisted.game.meta?.revision!==revision||persisted.ledger.revision!==revision)
   return deny('stale-persisted-revision');
  if(JSON.stringify(persisted.game)!==JSON.stringify(state))return deny('source-state-mismatch');
  return await settleIsolated(state,input,options);
 }catch{return deny('isolated-storage-error')}
}
module.exports={settlePersisted};
