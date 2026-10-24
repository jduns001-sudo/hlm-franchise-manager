'use strict';
/* Mission 1549: source-backed CPU policy/evidence comparison for GM review.
 * Read-only advisory. Never authenticates consent or enables settlement.
 */
const {evaluateCpuTrade}=require('./hlm-phase11-m1544-cpu-decision-authority');
const {verifyCpuDecisionEvidence}=require('./hlm-phase11-m1543-cpu-decision-evidence');
const deny=code=>Object.freeze({ok:false,code,saved:false,consentAuthenticated:false,settlementAuthorized:false});
function reviewCpuTradeEvidence(state,input={}){
 const policy=evaluateCpuTrade(state,input);
 if(policy.ok!==true)return deny(policy.code);
 const evidence=verifyCpuDecisionEvidence(state,input);
 if(evidence.ok!==true)return Object.freeze({ok:true,code:'cpu-policy-advisory-only',policyDecision:policy.decision,
  evidenceStatus:evidence.code,decisionMatches:false,saved:false,consentAuthenticated:false,settlementAuthorized:false});
 const matches=policy.decision===evidence.decision&&
  String(policy.receivingTeamId)===String(evidence.receivingTeamId)&&
  policy.gameRevision===evidence.gameRevision;
 return Object.freeze({ok:true,code:matches?'cpu-policy-evidence-agrees':'cpu-policy-evidence-conflict',
  policyDecision:policy.decision,evidenceDecision:evidence.decision,
  decisionMatches:matches,saved:false,consentAuthenticated:false,settlementAuthorized:false});
}
module.exports={reviewCpuTradeEvidence};
