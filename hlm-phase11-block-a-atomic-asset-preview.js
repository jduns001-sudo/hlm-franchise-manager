'use strict';
// Deterministic read-only settlement impact plan. This is NOT an authorization or save.
const {inspectSettlementBoundary}=require('./hlm-phase11-block-a-protected-settlement-boundary');
function previewAtomicAssetDelta(source,state,proposal,tradeInput,revision,decision,options={}){
 const before=JSON.stringify(state);
 const boundary=inspectSettlementBoundary(source,state,proposal,tradeInput,revision,decision,options);
 const players=[],contracts=[],picks=[],prospects=[],errors=[];
 const seen=new Set();
 const add=(kind,id,from,to)=>{
  const key=kind+':'+id;
  if(seen.has(key)){errors.push({code:'duplicate-transfer',kind,id});return false}
  seen.add(key);
  if(!id||!from||!to||from===to){errors.push({code:'invalid-transfer',kind,id});return false}
  return true;
 };
 for(const item of proposal.players||[]){
  const id=String(item?.playerId??''),from=String(item?.fromTeamId??''),to=String(item?.toTeamId??'');
  if(!add('player',id,from,to))continue;
  const match=state.universe.players.filter(p=>String(p.id)===id&&String(p.teamId)===from);
  const linked=state.assets.contracts.filter(c=>String(c.playerId)===id&&c.status!=='expired'&&String(c.teamId)===from);
  if(match.length!==1||linked.length!==1){errors.push({code:'player-contract-link-not-verified',id});continue}
  players.push({id,from,to});
  contracts.push({playerId:id,from,to});
 }
 for(const item of proposal.picks||[]){
  const id=String(item?.pickId??''),from=String(item?.fromTeamId??''),to=String(item?.toTeamId??'');
  if(!add('pick',id,from,to))continue;
  const match=state.assets.draftPicks.filter(p=>String(p.pickId??p.id)===id&&String(p.currentOwnerId)===from&&p.status==='AVAILABLE');
  if(match.length!==1){errors.push({code:'pick-owner-or-availability-unverified',id});continue}
  picks.push({id,from,to});
 }
 for(const item of proposal.prospects||[]){
  const id=String(item?.prospectId??''),from=String(item?.fromTeamId??''),to=String(item?.toTeamId??'');
  if(!add('prospect',id,from,to))continue;
  const match=state.universe.prospects.filter(p=>String(p.id)===id&&String(p.rightsTeamId)===from&&p.draftPickId!=null);
  if(match.length!==1){errors.push({code:'prospect-rights-unverified',id});continue}
  prospects.push({id,from,to});
 }
 if(JSON.stringify(state)!==before)throw Error('Read-only invariant violated');
 const changes={players,contracts,picks,prospects};
 return Object.freeze({status:'preview-only-settlement-blocked',changes:JSON.parse(JSON.stringify(changes)),errors:Object.freeze(errors.map(e=>Object.freeze(e))),blockers:boundary.reasons,gmApprovalRequested:boundary.gmApprovalRequested,independentlyAuthenticated:false,replayProtected:false,atomicCommitAvailable:false,settlementAuthorized:false,saved:false,experimental:true});
}
module.exports={previewAtomicAssetDelta};
