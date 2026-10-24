'use strict';
/* Mission 1515: source-backed trade state transition, pure and unsaved.
 * Does NOT independently authenticate CPU consent or permit settlement.
 */
const {prepare}=require('./hlm-phase11-m1512-transaction-preparation');
function stage(state,input,options={}){
 const deny=code=>Object.freeze({ok:false,code,saved:false,settlementAuthorized:false});
 if(options.cancelled===true||options.declined===true)return deny('gm-cancelled-or-declined');
 if(options.gmApproved!==true)return deny('gm-approval-required');
 const p=prepare(state,input,options);
 if(!p.prepared)return deny(p.code||'source-unverified');
 const {outgoingPlayerId:a,incomingPlayerId:b,controlledTeamId:teamA,otherTeamId:teamB}=p.plan;
 const next=JSON.parse(JSON.stringify(state));
 let players=0,contracts=0;
 for(const player of next.universe.players){
  if(String(player.id)===a){player.teamId=teamB;players++}
  if(String(player.id)===b){player.teamId=teamA;players++}
 }
 for(const contract of next.assets.contracts){
  if(contract.status!=='active')continue;
  if(String(contract.playerId)===a){contract.teamId=teamB;contracts++}
  if(String(contract.playerId)===b){contract.teamId=teamA;contracts++}
 }
 if(players!==2||contracts!==2)return deny('source-cardinality-mismatch');
 // Staged state must not escape as a settlement-authorized transaction.
 return Object.freeze({ok:true,code:'unsaved-state-transition-preview',
  nextState:next,gameRevision:p.plan.gameRevision,
  receivingTeamConsentAuthenticated:false,atomicSettlementVerified:false,
  saved:false,settlementAuthorized:false,experimental:true});
}
module.exports={stage};
