'use strict';
/* Explicit opt-in host for synthetic experimental GM review and settlement.
 * Reuses persisted review, WebCrypto provenance and atomic IndexedDB settlement.
 * Never seeds a franchise, authenticates CPU consent or accesses production saves.
 */
const store=require('./hlm-phase11-m1516-atomic-isolated-state-persistence');
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {planTrade}=require('./hlm-phase11-m1540-readonly-trade-plan');
const {evidence}=require('./hlm-phase11-m1561-browser-trade-provenance');
const {settleBrowserVerifiedSyntheticTrade}=require('./hlm-phase11-m1562-browser-indexeddb-trade-settlement');
const deny=code=>Object.freeze({ok:false,code,saved:false,settlementAuthorized:false,cpuConsentAuthenticated:false});
function createHost(config={}){
 const options=Object.freeze({...config}),database=options.experimentalDatabaseName;
 let pending=null,settling=false,epoch=0;
 const guard=()=>options.experimentalEnabled!==true?'experiment-disabled':
  options.syntheticTestAuthorization!==true?'synthetic-test-authorization-required':
  options.realTradeSettlement===true?'production-trade-settlement-disabled':
  typeof database!=='string'||!/^hlm-phase11-[a-zA-Z0-9_-]*experimental[a-zA-Z0-9_-]*$/.test(database)?'isolated-experimental-database-required':null;
 return Object.freeze({
  async review(input){
   const blocked=guard();if(blocked)return deny(blocked);
   if(settling)return deny('settlement-pending');
   const request={outgoingPlayerId:input?.outgoingPlayerId,incomingPlayerId:input?.incomingPlayerId};
   const ticket=++epoch;pending=null;
   try{
    const persisted=await store.read(database),state=persisted.game;
    if(!state||!persisted.ledger)return deny('persisted-source-required');
    if(validateGameStateEnvelope(state).valid!==true)return deny('invalid-source-state');
    const revision=state.meta?.revision;
    if(!Number.isSafeInteger(revision)||revision<1||persisted.ledger.revision!==revision)return deny('stale-persisted-revision');
    const approved={...request,gmApproved:true,expectedGameRevision:revision};
    const plan=planTrade(state,approved);if(!plan.ok)return deny(plan.code);
    const proof=await evidence(state,approved,{experimentalEnabled:true,expectedGameRevision:revision});
    if(!proof.ok)return deny(proof.code);
    if(proof.payload.decision!=='recommend-accept')return deny('cpu-policy-declined');
    if(ticket!==epoch||settling)return deny('review-superseded');
    // Display only scalar terms from this same persisted review snapshot.
    // Projected payroll comes from the validated planner, never from caller input.
    const players=[request.outgoingPlayerId,request.incomingPlayerId].map(id=>{
     const player=state.universe.players.find(p=>String(p.id)===id);
     const contract=state.assets.contracts.find(c=>String(c.playerId)===id&&c.status==='active');
     const team=state.universe.teams.find(t=>String(t.id)===String(player.teamId));
     return Object.freeze({playerId:id,name:typeof player.name==='string'&&player.name.trim()?player.name.trim():id,teamId:String(team.id),teamName:typeof team.name==='string'&&team.name.trim()?team.name.trim():String(team.id),aav:contract.aav});
    });
    const teams=players.map(player=>{
     const teamId=player.teamId,capLimit=state.finances.teamCapLimits[teamId];
     const beforePayroll=state.assets.contracts.filter(c=>c.status==='active'&&String(c.teamId)===teamId).reduce((sum,c)=>sum+c.aav,0);
     const afterPayroll=plan.projectedPayroll[teamId];
     return Object.freeze({teamId,name:player.teamName,beforePayroll,afterPayroll,capLimit,remainingCap:capLimit-afterPayroll});
    });
    const terms=Object.freeze({revision,players:Object.freeze(players),teams:Object.freeze(teams)});
    pending={state,request,proof,revision};
    return Object.freeze({ok:true,code:'persisted-synthetic-review-only',revision,
     terms,cpuDecision:proof.payload.decision,financial:{eligible:true,sourceValidated:true},
     restrictions:{eligible:true,sourceValidated:true},saved:false,
     cpuConsentAuthenticated:false,settlementAuthorized:false});
   }catch{return deny('isolated-review-error')}
  },
  async settle(input={}){
   const blocked=guard();if(blocked)return deny(blocked);
   if(settling)return deny('settlement-pending');
   if(input.cancelled===true||input.declined===true){pending=null;epoch++;return deny('gm-cancelled-or-declined')}
   if(input.gmApproved!==true)return deny('human-gm-approval-required');
   const reviewed=pending;
   if(!reviewed)return deny('review-required');
   if(input.expectedGameRevision!==reviewed.revision||input.outgoingPlayerId!==reviewed.request.outgoingPlayerId||input.incomingPlayerId!==reviewed.request.incomingPlayerId)return deny('reviewed-proposal-mismatch');
   pending=null;epoch++;settling=true;
   try{
    if(typeof globalThis.crypto?.randomUUID!=='function')return deny('browser-crypto-unavailable');
    return await settleBrowserVerifiedSyntheticTrade(reviewed.state,{...reviewed.request,gmApproved:true,expectedGameRevision:reviewed.revision},reviewed.proof,{
     experimentalEnabled:true,syntheticTestAuthorization:true,gmApproved:true,
     realTradeSettlement:false,experimentalDatabaseName:database,eventId:'m1566_'+globalThis.crypto.randomUUID()
    });
   }catch{return deny('isolated-settlement-error')}
   finally{settling=false}
  }
 });
}
module.exports={createHost};
