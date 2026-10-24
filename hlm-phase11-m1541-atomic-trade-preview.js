'use strict';
/* Mission 1541: immutable, uncommittable atomic trade preview. No I/O. */
const {planTrade}=require('./hlm-phase11-m1540-readonly-trade-plan');
function previewAtomicTrade(state,input={}){
 const plan=planTrade(state,input);
 if(plan.ok!==true)return Object.freeze({...plan,previewOnly:true});
 // Never expose a candidate as a saved or settlement-authorized state.
 const next=JSON.parse(JSON.stringify(state));
 const [outgoing,incoming]=plan.transfers;
 for(const transfer of [outgoing,incoming]){
  const p=next.universe.players.filter(x=>String(x.id)===String(transfer.playerId));
  const c=next.assets.contracts.filter(x=>String(x.playerId)===String(transfer.contractPlayerId)&&x.status==='active');
  if(p.length!==1||c.length!==1||String(p[0].teamId)!==transfer.fromTeamId||
     String(c[0].teamId)!==transfer.fromTeamId)
   return Object.freeze({ok:false,code:'stale-transfer-source',saved:false,settlementAuthorized:false,previewOnly:true});
  p[0].teamId=transfer.toTeamId;
  c[0].teamId=transfer.toTeamId;
 }
 // Return a change summary only. Candidate state is intentionally not exposed.
 const before=state.meta.revision;
 return Object.freeze({ok:true,code:'atomic-preview-only',expectedRevision:before,
  proposedRevision:before+1,transfers:plan.transfers,projectedPayroll:plan.projectedPayroll,
  playerTransfers:2,contractTransfers:2,consentStatus:plan.consentStatus,
  eventType:'experimental-player-trade-preview',saved:false,settlementAuthorized:false,previewOnly:true});
}
module.exports={previewAtomicTrade};
