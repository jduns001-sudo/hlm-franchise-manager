'use strict';
/* Mission 1631: durable replay authority boundary.
 * An in-browser nonce list, a caller-supplied verifier, or a claimed durable store
 * cannot prove independent issuance or atomic nonce consumption.
 * This module never persists and never authorizes settlement.
 */
const {inspectTrustedIssuerContract}=require('./hlm-phase11-m1630-trusted-issuer-contract');
const deny=code=>Object.freeze({ok:false,code,issuerAuthenticated:false,consentAuthenticated:false,replayProtected:false,nonceConsumed:false,settlementAuthorized:false,saved:false});
function inspectDurableReplayBoundary(state,input={},evidence={},untrustedOptions={}){
 const prior=inspectTrustedIssuerContract(state,input,evidence,untrustedOptions);
 if(prior.code!=='trusted-issuer-and-authoritative-replay-store-unavailable')return deny(prior.code);
 // No independent transaction service exists. Do not invoke injected storage or
 // verification callbacks, even when they claim a valid nonce or successful write.
 void untrustedOptions;
 return deny('independent-atomic-replay-authority-unavailable');
}
module.exports=Object.freeze({inspectDurableReplayBoundary});
