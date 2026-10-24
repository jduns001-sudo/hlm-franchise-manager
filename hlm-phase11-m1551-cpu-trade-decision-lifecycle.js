'use strict';
/* Mission 1551: pure CPU decision lifecycle for one source-backed trade proposal.
 * No persistence, no CPU consent authentication, no settlement authorization.
 */
const {evaluateCpuTrade}=require('./hlm-phase11-m1544-cpu-decision-authority');
const {reviewCpuTradeEvidence}=require('./hlm-phase11-m1549-cpu-trade-evidence-bridge');
const deny=code=>Object.freeze({ok:false,code,stage:'blocked',saved:false,consentAuthenticated:false,settlementAuthorized:false});
function inspectCpuTradeLifecycle(state,input={}){
 const policy=evaluateCpuTrade(state,input);
 if(policy.ok!==true)return deny(policy.code);
 const evidence=reviewCpuTradeEvidence(state,input);
 if(evidence.ok!==true)return deny(evidence.code);
 const stage=evidence.code==='cpu-policy-evidence-agrees'?'source-evidence-agrees':
  evidence.code==='cpu-policy-evidence-conflict'?'source-evidence-conflicts':'source-evidence-unavailable';
 return Object.freeze({ok:true,code:'cpu-trade-lifecycle-read-only',stage,
  receivingTeamId:policy.receivingTeamId,gameRevision:policy.gameRevision,
  policyId:policy.policyId,policyDecision:policy.decision,
  evidenceStatus:evidence.evidenceStatus||evidence.code,
  evidenceDecision:evidence.evidenceDecision||null,
  decisionMatches:evidence.decisionMatches===true,
  requiresIndependentCpuConsent:true,requiresHumanGmApproval:true,
  saved:false,consentAuthenticated:false,settlementAuthorized:false});
}
module.exports={inspectCpuTradeLifecycle};
