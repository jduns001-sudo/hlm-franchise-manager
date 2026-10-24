'use strict';
/* Mission 1507U: read-only settlement readiness. Never trusts caller-supplied authority. */
const {assess}=require('./hlm-phase11-m1507p-trade-authority-readiness');
function inspect(state,input,revision,receipt,options){
 const readiness=assess(state,input,revision,receipt,options);
 const blockers=[];
 if(readiness.code==='gm-declined-or-cancelled')blockers.push('human-gm-declined-or-cancelled');
 if(readiness.code==='invalid-source-or-revision'||readiness.code==='cpu-source-review-blocked'||readiness.code==='cpu-recommends-decline')blockers.push('source-or-cpu-eligibility');
 if(readiness.code==='stale-or-mismatched-proof')blockers.push('proposal-proof-mismatch');
 blockers.push('independent-receiving-team-authentication-unavailable','durable-replay-ledger-unavailable','atomic-cross-asset-settlement-unavailable');
 return Object.freeze({status:'trade-settlement-not-ready',code:readiness.code,
  proposalDigest:readiness.proposalDigest,stateRevision:readiness.stateRevision,
  blockers:Object.freeze([...new Set(blockers)]),independentlyAuthenticated:false,
  replayProtected:false,atomicSettlementVerified:false,settlementAuthorized:false,
  saved:false,experimental:true});
}
module.exports={inspect};
