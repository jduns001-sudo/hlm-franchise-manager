'use strict';
// Phase 11 Block A: protected transaction service readiness only.
// No browser-supplied service, signer, replay adapter or storage callback is trusted.
const {validateAssetIntentEnvelope}=require('./hlm-phase11-block-a-service-intent-validation');
function inspectProtectedServiceRequest(intent,authoritativeRevision,decision,options={}){
 const validation=validateAssetIntentEnvelope(intent,authoritativeRevision,options);
 const reasons=[...validation.reasons];
 if(!decision||typeof decision!=='object'||Array.isArray(decision)||
    typeof decision.decisionId!=='string'||!decision.decisionId||
    typeof decision.proposalDigest!=='string'||decision.proposalDigest!==intent?.digest||
    typeof decision.stateRevision!=='string'||decision.stateRevision!==authoritativeRevision||
    decision.decision!=='accepted')reasons.push('cpu-decision-binding-invalid');
 // A caller-supplied decision is never independently authenticated.
 reasons.push('protected-cpu-decision-verifier-unavailable');
 // Replay consumption and state write MUST occur together in the same trusted DB transaction.
 // The existing isolated D1 consent ledger alone cannot commit franchise asset state.
 reasons.push('replay-consumption-and-asset-write-not-atomic');
 return Object.freeze({
  status:'protected-service-not-configured',
  reasons:Object.freeze([...new Set(reasons)]),
  digestValid:validation.digestValid===true,
  revisionMatched:validation.revisionMatched===true,
  gmApprovalRequested:options.gmApproved===true&&!options.cancelled&&!options.declined,
  independentlyAuthenticated:false,
  replayProtected:false,
  atomicCommitAvailable:false,
  settlementAuthorized:false,
  saved:false,
  experimental:true
 });
}
module.exports={inspectProtectedServiceRequest};
