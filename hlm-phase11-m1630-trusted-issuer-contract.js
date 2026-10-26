'use strict';
/* Mission 1630: read-only specification of an external trusted CPU issuer.
 * Browser state, callbacks, localStorage, and caller-supplied signatures are NOT trust anchors.
 * No protected key, independent verifier, or durable nonce registry exists here.
 * All candidate evidence, including well-formed evidence, fails closed.
 */
const {inspectIndependentIssuer}=require('./hlm-phase11-m1629-independent-cpu-issuer');
const REQUIRED=Object.freeze(['proposalId','outgoingPlayerId','incomingPlayerId','gmTeamId','receivingTeamId','gameRevision','policyId','decision','issuedAt','expiresAt','nonce']);
const deny=(code)=>Object.freeze({ok:false,code,issuerAuthenticated:false,consentAuthenticated:false,replayProtected:false,settlementAuthorized:false,saved:false});
function inspectTrustedIssuerContract(state,input={},evidence={},untrustedOptions={}){
 const boundary=inspectIndependentIssuer(state,input,evidence,untrustedOptions);
 if(boundary.code!=='trusted-cpu-issuer-unavailable')return deny(boundary.code);
 // A real issuer must bind the exact reviewed source revision and proposal and
 // atomically consume a nonce in a durable, independent trust domain.
 if(!evidence||typeof evidence!=='object'||Array.isArray(evidence)||REQUIRED.some(k=>!Object.prototype.hasOwnProperty.call(evidence,k)))
  return deny('issuer-evidence-incomplete');
 // Reject superficially valid caller-provided proof as well as alleged replay ledgers.
 // No injected verification callback is invoked.
 void untrustedOptions;
 return deny('trusted-issuer-and-authoritative-replay-store-unavailable');
}
module.exports=Object.freeze({REQUIRED,inspectTrustedIssuerContract});
