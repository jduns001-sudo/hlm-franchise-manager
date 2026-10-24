'use strict';
/* Mission 1552: isolated, read-only CPU trade authorization review.
 * Evidence agreement is not CPU consent. No writes or settlement authority.
 */
const {inspectCpuTradeLifecycle}=require('./hlm-phase11-m1551-cpu-trade-decision-lifecycle');
const {requestAtomicTradeCommit}=require('./hlm-phase11-m1542-atomic-trade-commit-guard');
const deny=(code,stage)=>Object.freeze({ok:false,code,stage,saved:false,consentAuthenticated:false,settlementAuthorized:false});
function reviewCpuTradeAuthorization({state,input,readCurrent,storageKey}={}){
 const lifecycle=inspectCpuTradeLifecycle(state,input);
 if(lifecycle.stage==='blocked')return deny(lifecycle.code,'blocked');
 if(lifecycle.stage!=='source-evidence-agrees'||lifecycle.decisionMatches!==true||
    lifecycle.policyDecision!=='accept'||lifecycle.evidenceDecision!=='accept')
  return deny(lifecycle.stage==='source-evidence-unavailable'?'cpu-evidence-unavailable':'cpu-decision-not-agreed',lifecycle.stage);
 const guard=requestAtomicTradeCommit({state,input,readCurrent,storageKey});
 if(guard.ok!==true)return deny(guard.code,'settlement-blocked');
 return deny('independent-cpu-consent-required','settlement-blocked');
}
module.exports={reviewCpuTradeAuthorization};
