'use strict';
/* Mission 1519: CPU organization authority boundary, review-only.
 * Re-evaluates the CPU organization's own policy against the source GameState.
 * A caller's consent flag or evidence digest is never sufficient for settlement.
 */
const {evidence,verify}=require('./hlm-phase11-m1518-cpu-decision-provenance');
const {review}=require('./hlm-phase11-m1517-guarded-trade-integration');
const deny=(code)=>Object.freeze({ok:false,code,cpuDecision:'unavailable',
 cpuConsentAuthenticated:false,saved:false,settlementAuthorized:false});
function decide(state,input,options={}){
 if(options.experimentalEnabled!==true)return deny('experiment-disabled');
 if(options.cancelled===true||options.declined===true)return deny('gm-cancelled-or-declined');
 const proof=evidence(state,input,options);
 if(!proof.ok)return deny(proof.code);
 if(proof.payload.decision!=='recommend-accept')return deny('cpu-policy-declined');
 const check=verify(state,input,proof,options);
 if(!check.valid)return deny(check.code);
 return Object.freeze({ok:true,code:'cpu-policy-accepted-review-only',
  cpuDecision:'policy-accept',decisionEvidence:proof,
  cpuConsentAuthenticated:false,saved:false,settlementAuthorized:false});
}
function prepareForHumanReview(state,input,options={}){
 const cpu=decide(state,input,options);
 if(!cpu.ok)return cpu;
 if(options.gmApproved!==true)return deny('gm-approval-required');
 const staged=review(state,input,options);
 if(!staged.ok)return deny(staged.code);
 return Object.freeze({ok:true,code:'cpu-and-gm-reviewed-not-settled',
  cpuDecision:cpu.cpuDecision,expectedRevision:staged.expectedRevision,
  candidateState:staged.candidateState,decisionEvidence:cpu.decisionEvidence,
  cpuConsentAuthenticated:false,saved:false,settlementAuthorized:false});
}
module.exports={decide,prepareForHumanReview};
