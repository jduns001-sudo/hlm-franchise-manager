'use strict';
/* Mission 1633: fail-closed protected CPU consent verification boundary.
 * No independently protected verifier, trusted issuer registry, or durable atomic
 * replay store is provisioned. Caller-provided adapters are not authority.
 * This read-only inspection must never authorize or persist a settlement.
 */
const {inspectIssuerAuthorizationContract}=require('./hlm-phase11-m1632-issuer-authorization-contract');
const deny=code=>Object.freeze({
 ok:false,code,issuerAuthenticated:false,consentAuthenticated:false,
 replayProtected:false,nonceConsumed:false,settlementAuthorized:false,saved:false
});
function inspectProtectedCpuVerifierBoundary(state,input={},evidence={},untrustedOptions={}){
 const prior=inspectIssuerAuthorizationContract(state,input,evidence,untrustedOptions);
 if(prior.code!=='protected-issuer-authorization-registry-unavailable')return deny(prior.code);
 // The protected verifier is intentionally NOT injected from the browser,
 // evidence, state, or options. Such a verifier would be caller-controlled.
 // An independently provisioned trust anchor is required in a later mission.
 return deny('protected-cpu-consent-verifier-unavailable');
}
module.exports=Object.freeze({inspectProtectedCpuVerifierBoundary});
