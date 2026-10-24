'use strict';
/* Mission 1507I: read-only cross-asset trade proposal invariant gate.
 * Validates a detached proposal; never approves, authenticates CPU consent or saves.
 */
const {propose}=require('./hlm-phase11-m1507h-trade-proposal');
function inspect(state,input,candidate){
 const blocked=(code)=>Object.freeze({status:'trade-proposal-blocked',code,settlementAuthorized:false,saved:false,experimental:true});
 let expected;
 try{expected=propose(state,input).nextState}catch{return blocked('invalid-source-proposal')}
 if(!candidate||typeof candidate!=='object'||Array.isArray(candidate))return blocked('missing-candidate');
 let actual,reference;
 try{actual=JSON.stringify(candidate);reference=JSON.stringify(expected)}
 catch{return blocked('unserializable-candidate')}
 if(actual!==reference)return blocked('cross-asset-invariant-mismatch');
 return Object.freeze({status:'trade-proposal-invariants-verified',sourceBacked:true,
  playerAndContractOwnershipConsistent:true,unrelatedAssetsUnchanged:true,
  independentCpuConsentVerified:false,humanGmSettlementApproved:false,
  settlementAuthorized:false,saved:false,experimental:true,
  reason:'Atomic settlement and independent receiving-team authority are not available'});
}
module.exports={inspect};
