'use strict';
/* Mission 1513: deterministic CPU decision advisory derived from saved franchise data.
 * A decision is NOT independently authenticated consent or settlement authorization.
 */
const {prepare}=require('./hlm-phase11-m1512-transaction-preparation');
function fail(code){return Object.freeze({ok:false,code,decision:'unavailable',receivingTeamConsentAuthenticated:false,settlementAuthorized:false,saved:false})}
function evaluate(state,input,options={}){
 const prepared=prepare(state,input,options);
 if(!prepared.prepared)return fail(prepared.code||'not-prepared');
 const p=prepared.plan;
 const players=state.universe.players;
 const find=id=>players.find(x=>String(x.id)===id);
 const outgoing=find(p.outgoingPlayerId),incoming=find(p.incomingPlayerId);
 const contracts=state.assets.contracts;
 const contract=id=>contracts.find(x=>String(x.playerId)===id&&x.status==='active');
 const a=contract(p.outgoingPlayerId),b=contract(p.incomingPlayerId);
 if(!outgoing||!incoming||!a||!b)return fail('missing-source');
 // Explicit, deterministic CPU policy: protect incoming team's contract value.
 // This is only a proposed CPU response, not an authenticated organization decision.
 const cpuAccepts=a.aav<=b.aav;
 return Object.freeze({ok:true,code:'cpu-advisory-only',decision:cpuAccepts?'recommend-accept':'recommend-decline',
  gameRevision:p.gameRevision,otherTeamId:p.otherTeamId,controlledTeamId:p.controlledTeamId,
  outgoingPlayerId:p.outgoingPlayerId,incomingPlayerId:p.incomingPlayerId,
  policy:'incoming-team-aav-nonincreasing-v1',receivingTeamConsentAuthenticated:false,
  gmSettlementApproved:false,settlementAuthorized:false,saved:false,experimental:true});
}
module.exports={evaluate};
