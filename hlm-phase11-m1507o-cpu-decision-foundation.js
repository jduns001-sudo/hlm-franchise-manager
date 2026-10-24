'use strict';
/* Mission 1507O: deterministic receiving-team decision recommendation.
 * A CPU recommendation is never an authenticated decision or consent.
 * No storage, mutations, settlement or caller-supplied authority overrides.
 */
const {evaluate}=require('./hlm-phase11-m1507k-cpu-trade-policy');
function review(state,input){
 const valuation=evaluate(state,input);
 const result=(status,reason)=>Object.freeze({
  status,reason,valuation,receivingTeamRecommendation:status==='cpu-review-recommends-accept'?'accept':'decline',
  independentlyAuthenticated:false,authenticatedCpuConsent:false,
  humanGmApprovalRequired:true,settlementAuthorized:false,saved:false,experimental:true
 });
 if(valuation.status!=='cpu-trade-evaluation-preview')
  return result('cpu-review-blocked',valuation.code||'source-review-unavailable');
 if(valuation.recommendation==='favorable-for-receiving-team')
  return result('cpu-review-recommends-accept','receiving-team-overall-improves');
 if(valuation.recommendation==='unfavorable-for-receiving-team')
  return result('cpu-review-recommends-decline','receiving-team-overall-declines');
 return result('cpu-review-recommends-decline','even-value-requires-independent-authority');
}
module.exports={review};
