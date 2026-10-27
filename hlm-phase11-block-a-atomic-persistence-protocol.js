'use strict';
// Experimental protected persistence protocol: declaration, never execution.
// A browser-provided adapter, verifier or state revision cannot authorize settlement.
const REQUIRED=Object.freeze([
 'load-authoritative-state',
 'compare-expected-revision',
 'recompute-source-backed-asset-deltas',
 'verify-independent-cpu-consent',
 'verify-explicit-gm-approval',
 'reject-consumed-decision',
 'apply-linked-assets',
 'append-transaction-history',
 'advance-state-revision',
 'consume-cpu-decision',
 'commit-all-or-rollback'
]);
function inspectAtomicPersistenceProtocol(intent,revision,decision,options={}){
 const {inspectProtectedServiceRequest}=require('./hlm-phase11-block-a-protected-service-request');
 const readiness=inspectProtectedServiceRequest(intent,revision,decision,options);
 const blockers=[...readiness.reasons];
 if(options.cancelled===true||options.declined===true)blockers.push('gm-cancelled-or-declined');
 if(options.experimentalEnabled!==true)blockers.push('experimental-service-disabled');
 // No externally supplied "trusted" object is inspected or invoked.
 blockers.push('server-owned-transaction-coordinator-unavailable');
 return Object.freeze({
  schema:'hlm-block-a-atomic-persistence-protocol-v1',
  steps:REQUIRED,
  status:'not-executable',
  blockers:Object.freeze([...new Set(blockers)]),
  expectedRevision:typeof revision==='string'?revision:null,
  intentDigest:typeof intent?.digest==='string'?intent.digest:null,
  independentlyAuthenticated:false,
  durableReplayProtected:false,
  linkedAssetCommitAtomic:false,
  settlementAuthorized:false,
  saved:false,
  experimental:true
 });
}
module.exports={inspectAtomicPersistenceProtocol,REQUIRED};
