'use strict';
// Phase 11 Block A protected settlement boundary. No public browser authority.
const {inspectAssetTransaction,inspectProtectedCpuConsent}=require('./hlm-phase11-block-a-asset-transaction-gate');
const {validateGameStateEnvelope}=require('./hlm-game-state');
function inspectSettlementBoundary(source,state,proposal,tradeInput,revision,decision,options={}){
 if(!validateGameStateEnvelope(state).valid)throw Error('Valid GameState required');
 const asset=inspectAssetTransaction(source,state,proposal);
 const authority=inspectProtectedCpuConsent(state,tradeInput,revision,decision,options);
 const reasons=asset.issues.map(x=>x.code);
 if(options.cancelled===true||options.declined===true)reasons.push('gm-cancelled-or-declined');
 else if(options.gmApproved!==true)reasons.push('explicit-gm-approval-required');
 if(!authority.independentlyAuthenticated)reasons.push('independent-cpu-consent-required');
 reasons.push('protected-replay-ledger-and-atomic-commit-unavailable');
 return Object.freeze({
  status:'settlement-blocked',
  reasons:Object.freeze([...new Set(reasons)]),
  authorityCode:authority.authorityCode,
  gmApprovalRequested:options.gmApproved===true&&!options.cancelled&&!options.declined,
  cpuConsentAuthenticated:false,
  replayProtected:false,
  atomicCommitAvailable:false,
  settlementAuthorized:false,
  saved:false,
  experimental:true
 });
}
module.exports={inspectSettlementBoundary};
