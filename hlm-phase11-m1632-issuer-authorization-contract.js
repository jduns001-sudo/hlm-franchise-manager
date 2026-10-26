'use strict';
/* Mission 1632: read-only source-bound issuer authorization contract.
 * A claimed issuer, browser callback, or client-side signature is not a trust anchor.
 * No issuer registry or protected verifier is provisioned. Never authorize settlement.
 */
const {inspectDurableReplayBoundary}=require('./hlm-phase11-m1631-durable-replay-boundary');
const deny=code=>Object.freeze({ok:false,code,issuerAuthenticated:false,consentAuthenticated:false,replayProtected:false,nonceConsumed:false,settlementAuthorized:false,saved:false});
function inspectIssuerAuthorizationContract(state,input={},evidence={},untrustedOptions={}){
 const prior=inspectDurableReplayBoundary(state,input,evidence,untrustedOptions);
 if(prior.code!=='independent-atomic-replay-authority-unavailable')return deny(prior.code);
 // All evidence is untrusted, including asserted issuer IDs, key IDs, signatures,
 // delegated rights and browser-injected allowlists. A protected issuer registry
 // and independent verifier are required before any positive result is possible.
 void untrustedOptions;
 return deny('protected-issuer-authorization-registry-unavailable');
}
module.exports=Object.freeze({inspectIssuerAuthorizationContract});
