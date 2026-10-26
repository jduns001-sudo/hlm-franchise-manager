'use strict';
/* Mission 1635: descriptive, read-only CPU consent provider boundary.
 * This contract is NOT an adapter loader or a source of trust.
 * In particular, do not invoke provider objects supplied by callers, evidence,
 * browser state, or options. No external protected provider is provisioned.
 */
const {inspectCpuConsentInfrastructureReadiness}=require('./hlm-phase11-m1634-cpu-consent-infrastructure-readiness');
const PROVIDER_CAPABILITIES=Object.freeze([
 'protected-issuer-identity-and-team-scope',
 'independent-consent-signature-and-revocation-verification',
 'durable-atomic-nonce-consumption-with-settlement'
]);
function inspectCpuConsentProviderBoundary(state,input={},evidence={},untrustedOptions={}){
 const prior=inspectCpuConsentInfrastructureReadiness(state,input,evidence,untrustedOptions);
 return Object.freeze({
  ok:false,ready:false,code:prior.code,
  providerAvailable:false,providerTrusted:false,
  issuerAuthenticated:false,consentAuthenticated:false,
  replayProtected:false,nonceConsumed:false,
  settlementAuthorized:false,saved:false,
  capabilities:PROVIDER_CAPABILITIES,
  requirements:prior.requirements
 });
}
module.exports=Object.freeze({PROVIDER_CAPABILITIES,inspectCpuConsentProviderBoundary});
