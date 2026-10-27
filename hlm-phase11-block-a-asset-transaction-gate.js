'use strict';
// Block A: unified read-only transaction readiness gate. Never settles or saves.
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {audit,reconcilePickOwnershipHistory}=require('./hlm-phase11-block-a-authoritative-assets');
function inspectAssetTransaction(source,state,proposal){
 if(!validateGameStateEnvelope(state).valid)throw Error('Valid franchise state required');
 if(!proposal||!Array.isArray(proposal.players)||!Array.isArray(proposal.picks))throw Error('Explicit player and pick arrays required');
 const inventory=audit(source,state);
 const ownership=reconcilePickOwnershipHistory(source,state);
 const issues=[...inventory.issues,...ownership.issues];
 const teams=new Set(state.universe.teams.map(t=>String(t.id)));
 const seenPlayers=new Set(),seenPicks=new Set();
 const details={players:[],picks:[],contracts:[],prospects:[]};
 for(const item of proposal.players){
  const id=String(item?.playerId??''),from=String(item?.fromTeamId??''),to=String(item?.toTeamId??'');
  const matches=state.universe.players.filter(p=>String(p.id)===id);
  if(!id||seenPlayers.has(id)||matches.length!==1||!teams.has(from)||!teams.has(to)||from===to||String(matches[0]?.teamId)!==from){
   issues.push({code:'invalid-player-transfer',id});continue;
  }
  seenPlayers.add(id);
  const contracts=state.assets.contracts.filter(c=>String(c.playerId)===id&&c.status!=='expired');
  if(contracts.length!==1||String(contracts[0].teamId)!==from)issues.push({code:'contract-identity-unverified',id});
  details.players.push({id,from,to});
  details.contracts.push({playerId:id,matchingActiveContracts:contracts.length});
 }
 for(const item of proposal.picks){
  const id=String(item?.pickId??''),from=String(item?.fromTeamId??''),to=String(item?.toTeamId??'');
  const matches=state.assets.draftPicks.filter(p=>String(p.pickId??p.id)===id);
  if(!id||seenPicks.has(id)||matches.length!==1||!teams.has(from)||!teams.has(to)||from===to||String(matches[0]?.currentOwnerId)!==from||matches[0]?.status!=='AVAILABLE'){
   issues.push({code:'invalid-pick-transfer',id});continue;
  }
  seenPicks.add(id);
  details.picks.push({id,from,to});
 }
 for(const item of proposal.prospects||[]){
  const id=String(item?.prospectId??'');
  const matches=state.universe.prospects.filter(p=>String(p.id)===id);
  if(matches.length!==1||matches[0].draftPickId==null)issues.push({code:'unverified-prospect-rights',id});
  details.prospects.push({id,verified:matches.length===1&&matches[0].draftPickId!=null});
 }
 if(!proposal.players.length&&!proposal.picks.length&&!(proposal.prospects||[]).length)issues.push({code:'empty-transaction'});
 // A reviewer cannot grant CPU authority merely by setting proposal flags.
 issues.push({code:'independent-cpu-consent-required'});
 return Object.freeze({status:'blocked-pending-independent-authorization',issues:Object.freeze(issues.map(x=>Object.freeze(x))),details:JSON.parse(JSON.stringify(details)),gmApproved:false,cpuConsentAuthenticated:false,settlementAuthorized:false,saved:false,experimental:true});
}
module.exports={inspectAssetTransaction};
