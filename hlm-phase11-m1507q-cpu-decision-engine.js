'use strict';
/* Mission 1507Q: isolated deterministic CPU decision engine.
 * The engine owns its policy decision, but has no independent trust root or
 * durable replay ledger. It NEVER represents consent as authenticated and
 * cannot settle trades or write storage.
 */
const {assess,identity}=require('./hlm-phase11-m1507p-trade-authority-readiness');
const {review}=require('./hlm-phase11-m1507o-cpu-decision-foundation');
function create(){
 const seen=new Set();
 function decide(state,input,revision,options){
  const blocked=(code,digest=null)=>Object.freeze({
   status:'cpu-trade-decision-blocked',code,proposalDigest:digest,
   decision:'blocked',independentlyAuthenticated:false,
   authenticatedCpuConsent:false,replayProtected:false,
   settlementAuthorized:false,saved:false,experimental:true
  });
  if(options?.cancelled===true||options?.declined===true)return blocked('gm-declined-or-cancelled');
  let id;
  try{id=identity(state,input,revision)}catch{return blocked('invalid-proposal')}
  if(seen.has(id.digest))return blocked('duplicate-proposal-in-session',id.digest);
  const readiness=assess(state,input,revision);
  const recommendation=review(state,input);
  if(readiness.code==='cpu-source-review-blocked'||recommendation.status==='cpu-review-blocked')
   return blocked('source-eligibility-failed',id.digest);
  // Even a favorable recommendation is not independently authenticated consent.
  // Record only within this engine instance; not a durable replay ledger.
  seen.add(id.digest);
  const decision=recommendation.receivingTeamRecommendation==='accept'?'accept':'decline';
  return Object.freeze({
   status:'cpu-trade-decision-preview',decision,
   proposalDigest:id.digest,stateRevision:id.revision,
   source:'deterministic-isolated-cpu-policy',humanGmApprovalRequired:true,
   independentlyAuthenticated:false,authenticatedCpuConsent:false,
   replayProtected:false,settlementAuthorized:false,saved:false,experimental:true
  });
 }
 return Object.freeze({decide});
}
module.exports={create};
