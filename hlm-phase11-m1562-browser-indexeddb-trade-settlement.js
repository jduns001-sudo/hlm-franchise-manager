'use strict';
/* Mission 1562: verified browser provenance -> existing synthetic IndexedDB
 * settlement. No authenticated CPU consent and no production authorization.
 */
const {verify}=require('./hlm-phase11-m1561-browser-trade-provenance');
const {decideCpuTrade}=require('./hlm-phase11-m1555-engine-owned-cpu-decision');
const {prepareIsolatedAtomicTrade}=require('./hlm-phase11-m1557-isolated-atomic-trade');
const store=require('./hlm-phase11-m1516-atomic-isolated-state-persistence');
const {validateGameStateEnvelope}=require('./hlm-game-state');
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
 if(typeof options.experimentalDatabaseName!=='string'||!/^hlm-phase11-[a-zA-Z0-9_-]*experimental[a-zA-Z0-9_-]*$/.test(options.experimentalDatabaseName))return deny('isolated-experimental-database-required');
 const decision=decideCpuTrade(state,input);
 if(decision.ok!==true)return deny(decision.code);
 if(decision.decision!=='accept')return deny('cpu-policy-declined');
 const prepared=prepareIsolatedAtomicTrade(state,input);
 if(prepared.ok!==true)return deny(prepared.code);
 const candidate=JSON.parse(JSON.stringify(state));
 const controlled=String(state.meta.controlledTeamId),other=String(decision.receivingTeamId);
 for(const [id,from,to] of [[input.outgoingPlayerId,controlled,other],[input.incomingPlayerId,other,controlled]]){
  const players=candidate.universe.players.filter(p=>String(p.id)===String(id));
  const contracts=candidate.assets.contracts.filter(c=>String(c.playerId)===String(id)&&c.status==='active');
  if(players.length!==1||contracts.length!==1||String(players[0].teamId)!==from||String(contracts[0].teamId)!==from)return deny('stale-transfer-source');
  players[0].teamId=to;contracts[0].teamId=to;
 }
 if(candidate.activity.transactions.some(t=>t?.id===options.eventId))return deny('duplicate-transaction-id');
 const label=(entity,id)=>typeof entity?.name==='string'&&entity.name.trim()?entity.name.trim():String(id);
 const transfers=[[input.outgoingPlayerId,controlled,other],[input.incomingPlayerId,other,controlled]].map(([id,from,to])=>{
  const player=state.universe.players.find(p=>String(p.id)===id);
  const contract=state.assets.contracts.find(c=>String(c.playerId)===id&&c.status==='active');
  const fromTeam=state.universe.teams.find(t=>String(t.id)===from),toTeam=state.universe.teams.find(t=>String(t.id)===to);
  return {playerId:id,playerName:label(player,id),fromTeamId:from,fromTeamName:label(fromTeam,from),
   toTeamId:to,toTeamName:label(toTeam,to),aav:contract.aav};
 });
 candidate.activity.transactions.push({id:options.eventId,type:'experimental-player-trade',experimental:true,
  sourceRevision:state.meta.revision,revision:state.meta.revision+1,gmApproved:true,
  cpuConsentAuthenticated:false,productionSettlementAuthorized:false,transfers});
 candidate.meta.revision++;
 if(validateGameStateEnvelope(candidate).valid!==true||candidate.meta.revision!==prepared.proposedRevision)return deny('invalid-candidate');
 try{
  const previous=await store.read(options.experimentalDatabaseName);
  if(previous.game===null||previous.game.meta?.revision!==state.meta.revision||JSON.stringify(previous.game)!==JSON.stringify(state))return deny('uninitialized-or-stale-experimental-store');
  if(!previous.ledger||previous.ledger.revision!==state.meta.revision||
     (options.expectedLedger!==undefined&&JSON.stringify(previous.ledger)!==JSON.stringify(options.expectedLedger)))return deny('stale-experimental-ledger');
  const result=await store.commit({experimentalEnabled:true,gmApproved:true,syntheticTestAuthorization:true,expectedRevision:state.meta.revision,candidateState:candidate,eventId:options.eventId,expectedLedger:previous.ledger,realTradeSettlement:false},options.experimentalDatabaseName);
  return Object.freeze({ok:result.committed===true,code:result.code,saved:result.saved===true,experimentalSyntheticSave:result.saved===true,settlementAuthorized:false,cpuConsentAuthenticated:false,browserProvenanceVerified:true});
 }catch{return deny('isolated-storage-error')}
}
module.exports={settleBrowserVerifiedSyntheticTrade};
