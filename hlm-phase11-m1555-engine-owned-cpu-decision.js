'use strict';
/* Mission 1555: engine-owned, deterministic CPU policy evaluation.
 * No caller-supplied decision, evidence ledger, persistence, or settlement authority.
 * This pure evaluator is not an authenticated authorization service.
 */
const {deriveProposalId}=require('./hlm-phase11-m1554-cpu-authorization-proposal-binding');
const {evaluateCpuTrade}=require('./hlm-phase11-m1544-cpu-decision-authority');
const deny=code=>Object.freeze({ok:false,code,decision:null,saved:false,consentAuthenticated:false,settlementAuthorized:false});
function decideCpuTrade(state,input={}){
 const proposal=deriveProposalId(state,input);
 if(proposal.ok!==true)return deny(proposal.code);
 const policy=evaluateCpuTrade(state,input);
 if(policy.ok!==true)return deny(policy.code);
 if(String(policy.receivingTeamId)!==proposal.receivingTeamId||policy.gameRevision!==proposal.gameRevision)
  return deny('cpu-policy-proposal-mismatch');
 // Decisions are derived exclusively from validated state and engine policy.
 // Flags and ledger entries supplied by the caller are intentionally ignored.
 return Object.freeze({ok:true,code:'engine-cpu-policy-decision-only',proposalId:proposal.proposalId,
  receivingTeamId:proposal.receivingTeamId,gameRevision:proposal.gameRevision,
  policyId:policy.policyId,decision:policy.decision,reason:policy.reason,
  decisionOrigin:'deterministic-engine-policy',requiresHumanGmApproval:true,
  consentAuthenticated:false,settlementAuthorized:false,saved:false});
}
module.exports={decideCpuTrade};
