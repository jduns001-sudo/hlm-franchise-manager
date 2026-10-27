'use strict';
// Isolated server-side transaction planner. This module NEVER executes a write.
// The future protected service must own the database, signing root and GM session.
const {inspectAtomicPersistenceProtocol}=require('./hlm-phase11-block-a-atomic-persistence-protocol');
const {validateGameStateEnvelope}=require('./hlm-game-state');
function planAuthoritativeAssetTransaction(source,state,intent,decision,expectedRevision,options={}){
 if(!validateGameStateEnvelope(state).valid)throw Error('Invalid authoritative GameState');
 const protocol=inspectAtomicPersistenceProtocol(intent,expectedRevision,decision,options);
 const blockers=[...protocol.blockers];
 const assets=intent?.manifest?.assets;
 if(!assets||!['players','contracts','picks','prospects'].every(k=>Array.isArray(assets[k])))blockers.push('invalid-asset-deltas');
 else{
  const playerIds=new Set(assets.players.map(p=>String(p.id)));
  const contractIds=new Set(assets.contracts.map(c=>String(c.playerId)));
  if(playerIds.size!==assets.players.length||contractIds.size!==assets.contracts.length||
     playerIds.size!==contractIds.size||[...playerIds].some(id=>!contractIds.has(id)))blockers.push('player-contract-delta-mismatch');
  for(const p of assets.players){
   if(state.universe.players.filter(x=>String(x.id)===String(p.id)&&String(x.teamId)===String(p.from)).length!==1)blockers.push('stale-player-ownership');
  }
  for(const c of assets.contracts){
   if(state.assets.contracts.filter(x=>String(x.playerId)===String(c.playerId)&&String(x.teamId)===String(c.from)&&x.status!=='expired').length!==1)blockers.push('unverified-contract-ownership');
  }
  for(const p of assets.picks){
   if(state.assets.draftPicks.filter(x=>String(x.pickId??x.id)===String(p.id)&&String(x.currentOwnerId)===String(p.from)&&x.status==='AVAILABLE').length!==1)blockers.push('stale-pick-ownership');
  }
  for(const p of assets.prospects){
   if(state.universe.prospects.filter(x=>String(x.id)===String(p.id)&&String(x.rightsTeamId)===String(p.from)&&x.draftPickId!=null).length!==1)blockers.push('unverified-prospect-rights');
  }
 }
 return Object.freeze({
  schema:'hlm-block-a-authoritative-transaction-plan-v1',
  status:'blocked-read-only',
  blockers:Object.freeze([...new Set(blockers)]),
  expectedRevision,
  digest:typeof intent?.digest==='string'?intent.digest:null,
  requiresSingleTransaction:Object.freeze(['compare-revision','verify-protected-cpu-consent','verify-gm-session','consume-decision-once','apply-linked-asset-deltas','append-history','advance-revision','commit-or-rollback']),
  independentlyAuthenticated:false,replayProtected:false,atomicCommitAvailable:false,settlementAuthorized:false,saved:false
 });
}
module.exports={planAuthoritativeAssetTransaction};
