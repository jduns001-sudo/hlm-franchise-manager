'use strict';
// Protected service boundary requirements. No caller can inject an authenticator,
// signer, authoritative state, or database transaction into this module.
// This is a readiness gate, not an executable settlement service.
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {inspectProtectedServiceRequest}=require('./hlm-phase11-block-a-protected-service-request');
function inspectServerOwnedSettlementBoundary(request,serverSnapshot,options={}){
 const reasons=[];
 const fail=reason=>{if(!reasons.includes(reason))reasons.push(reason);};
 if(options.experimentalEnabled!==true)fail('experimental-service-disabled');
 if(request?.cancelled===true||request?.declined===true)fail('gm-cancelled-or-declined');
 if(request?.gmApproved!==true)fail('server-authenticated-gm-approval-required');
 if(!serverSnapshot||!validateGameStateEnvelope(serverSnapshot.state).valid)fail('authoritative-server-state-unavailable');
 if(typeof serverSnapshot?.revision!=='string'||!serverSnapshot.revision)fail('authoritative-revision-unavailable');
 if(typeof request?.expectedRevision!=='string'||request.expectedRevision!==serverSnapshot?.revision)fail('stale-or-untrusted-revision');
 const inspection=inspectProtectedServiceRequest(request?.intent,serverSnapshot?.revision,request?.cpuDecision,{
  gmApproved:request?.gmApproved===true,cancelled:request?.cancelled===true,declined:request?.declined===true
 });
 for(const reason of inspection.reasons)fail(reason);
 // Do not accept caller-provided "verified" claims or invoke supplied callbacks.
 fail('server-owned-gm-session-authenticator-unavailable');
 fail('independent-cpu-trust-root-unavailable');
 fail('server-owned-atomic-persistence-coordinator-unavailable');
 return Object.freeze({
  schema:'hlm-block-a-server-owned-settlement-boundary-v1',
  status:'blocked',
  reasons:Object.freeze(reasons),
  requirements:Object.freeze(['authenticate-gm-session-on-server','verify-independent-cpu-decision','load-authoritative-state','compare-and-swap-revision','revalidate-canonical-asset-ownership','consume-decision-durably','apply-linked-asset-changes','append-transaction-history','commit-or-rollback']),
  settlementAuthorized:false,saved:false,productionSaved:false,independentlyAuthenticated:false,
  experimental:true
 });
}
module.exports={inspectServerOwnedSettlementBoundary};
