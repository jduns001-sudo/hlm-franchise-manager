'use strict';
/* Mission 1554: deterministic proposal binding for advisory CPU decisions.
 * Never authenticates CPU consent or grants settlement authority.
 */
const {planTrade}=require('./hlm-phase11-m1540-readonly-trade-plan');
const {evaluateCpuTrade}=require('./hlm-phase11-m1544-cpu-decision-authority');
const deny=code=>Object.freeze({ok:false,code,saved:false,consentAuthenticated:false,settlementAuthorized:false});
function inspectCpuProposalBinding(state,input={},record){
 const plan=planTrade(state,input);
 if(plan.ok!==true)return deny(plan.code);
 const policy=evaluateCpuTrade(state,input);
 if(policy.ok!==true)return deny(policy.code);
 const receiver=String(plan.transfers[0].toTeamId);
 const proposalId=[plan.revision,String(plan.transfers[0].fromTeamId),receiver,
  String(input.outgoingPlayerId),String(input.incomingPlayerId)].map(v=>v.length+':'+v).join('|');
 if(!record||typeof record!=='object'||Array.isArray(record))return deny('authorization-record-required');
 if(typeof record.proposalId!=='string'||record.proposalId!==proposalId)return deny('proposal-binding-mismatch');
 if(!Number.isSafeInteger(record.gameRevision)||record.gameRevision!==plan.revision)return deny('stale-authorization-revision');
 if(String(record.receivingTeamId)!==receiver)return deny('receiving-team-binding-mismatch');
 if(record.decision!=='accept'&&record.decision!=='decline')return deny('invalid-authorization-decision');
 if(record.decision!==policy.decision)return deny('cpu-policy-decision-conflict');
 if(record.decision==='decline')return deny('cpu-policy-declined');
 // Caller or save-controlled records cannot establish independent CPU consent.
 return Object.freeze({ok:false,code:'independent-cpu-authorization-required',proposalId,
  receivingTeamId:receiver,gameRevision:plan.revision,saved:false,
  consentAuthenticated:false,settlementAuthorized:false});
}
function deriveProposalId(state,input={}){
 const plan=planTrade(state,input);
 if(plan.ok!==true)return deny(plan.code);
 const receiver=String(plan.transfers[0].toTeamId);
 const proposalId=[plan.revision,String(plan.transfers[0].fromTeamId),receiver,
  String(input.outgoingPlayerId),String(input.incomingPlayerId)].map(v=>v.length+':'+v).join('|');
 return Object.freeze({ok:true,code:'read-only-proposal-identity',proposalId,
  gameRevision:plan.revision,receivingTeamId:receiver,saved:false,
  consentAuthenticated:false,settlementAuthorized:false});
}
module.exports={inspectCpuProposalBinding,deriveProposalId};
