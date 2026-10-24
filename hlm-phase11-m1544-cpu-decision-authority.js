'use strict';
/* Mission 1544: isolated CPU authority evaluates the source-backed proposal.
 * This module generates decisions; it never accepts caller-supplied CPU consent.
 * No writes, no authenticated settlement consent, no production activation.
 */
const {planTrade}=require('./hlm-phase11-m1540-readonly-trade-plan');
function evaluateCpuTrade(state,input={}){
 const deny=code=>Object.freeze({ok:false,code,saved:false,consentAuthenticated:false,settlementAuthorized:false});
 const plan=planTrade(state,input);
 if(plan.ok!==true)return deny(plan.code);
 const receiver=plan.transfers[0].toTeamId;
 const outgoing=state.assets.contracts.find(c=>String(c.playerId)===String(input.outgoingPlayerId)&&c.status==='active');
 const incoming=state.assets.contracts.find(c=>String(c.playerId)===String(input.incomingPlayerId)&&c.status==='active');
 // Deterministic experimental receiving-team policy, not a negotiated or signed acceptance.
 const accepted=outgoing.aav<=incoming.aav;
 return Object.freeze({ok:true,code:'cpu-policy-decision-read-only',policyId:'incoming-team-aav-nonincreasing-v1',
  decision:accepted?'accept':'decline',receivingTeamId:receiver,gameRevision:plan.revision,
  outgoingPlayerId:input.outgoingPlayerId,incomingPlayerId:input.incomingPlayerId,
  reason:accepted?'receiving-team-aav-nonincreasing':'receiving-team-aav-increase',
  consentAuthenticated:false,settlementAuthorized:false,saved:false});
}
module.exports={evaluateCpuTrade};
