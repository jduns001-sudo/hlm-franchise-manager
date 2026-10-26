'use strict';
/* Mission 1629: independent CPU issuer boundary, deliberately not a trust issuer.
 * No server-side authority, protected key, trusted replay registry or settlement is supplied.
 * A caller-supplied verifier, signature, issuer flag or localStorage record is never trusted.
 */
const {verifyCpuConsent}=require('./hlm-phase11-m1628-cpu-consent-contract');
const {evaluateCpuTrade}=require('./hlm-phase11-m1544-cpu-decision-authority');
const reject=(code)=>Object.freeze({ok:false,code,issuerAuthenticated:false,consentAuthenticated:false,settlementAuthorized:false,saved:false});
function inspectIndependentIssuer(state,input={},evidence={},options={}){
 const source=verifyCpuConsent(state,input,evidence);
 if(source.code!=='independent-cpu-issuer-required')return reject(source.code);
 const policy=evaluateCpuTrade(state,input);
 if(!policy.ok)return reject(policy.code);
 if(policy.decision!=='accept')return reject('cpu-policy-declined');
 if(evidence.policyId!==policy.policyId||String(evidence.receivingTeamId)!==String(policy.receivingTeamId))return reject('cpu-policy-binding-mismatch');
 // These values can be fabricated by a caller and must never establish authority.
 // No callback or injected verifier is invoked because the application has no trust anchor.
 void options;
 return reject('trusted-cpu-issuer-unavailable');
}
module.exports=Object.freeze({inspectIndependentIssuer});
