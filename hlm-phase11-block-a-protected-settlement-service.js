'use strict';
// Isolated protected-service dependency boundary, deliberately NOT an HTTP endpoint.
// Construction does not grant trust: only deployment-owned server modules may
// eventually supply authenticated identities and durable transaction coordinators.
const {inspectServerOwnedSettlementBoundary}=require('./hlm-phase11-block-a-server-owned-settlement-boundary');
function createProtectedSettlementService(){
 const inspect=(request,serverSnapshot,options={})=>{
  // The service does not accept caller-provided authentication callbacks,
  // identity assertions, CPU signatures, database handles or commit functions.
  const boundary=inspectServerOwnedSettlementBoundary(request,serverSnapshot,options);
  return Object.freeze({
   schema:'hlm-block-a-protected-service-v1',
   status:'not-configured',
   reasons:Object.freeze([...new Set([...boundary.reasons,
    'deployment-owned-gm-identity-provider-not-installed',
    'deployment-owned-cpu-verifier-not-installed',
    'deployment-owned-transaction-store-not-installed'])]),
   verifiedGmSession:false,
   verifiedCpuConsent:false,
   authoritativeRevisionConfirmed:false,
   durableReplayProtected:false,
   atomicLinkedAssets:false,
   settlementAuthorized:false,
   saved:false,
   productionSaved:false
  });
 };
 return Object.freeze({inspect});
}
module.exports={createProtectedSettlementService};
