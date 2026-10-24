'use strict';
/* Mission 1512: source-backed preparation only. No consent, writes or settlement. */
const {inspect}=require('./hlm-phase11-m1511-source-backed-transaction-preview');
function prepare(state,input,options={}){
 const preview=inspect(state,input,options);
 if(!preview.ok)return Object.freeze({...preview,prepared:false});
 if(preview.financial?.eligibleForFurtherReview!==true||
    preview.restrictions?.eligibleForFurtherReview!==true)
  return Object.freeze({ok:false,prepared:false,code:'eligibility-unverified',saved:false,settlementAuthorized:false});
 const {gameRevision,controlledTeamId,otherTeamId,outgoingPlayerId,incomingPlayerId}=preview;
 const plan=Object.freeze({gameRevision,controlledTeamId,otherTeamId,outgoingPlayerId,incomingPlayerId,
  projectedPayroll:Object.freeze({...preview.financial.projectedPayroll})});
 return Object.freeze({ok:true,prepared:true,code:'preparation-only',plan,
  receivingTeamConsentAuthenticated:false,gmSettlementApproved:false,
  atomicSettlementVerified:false,settlementAuthorized:false,saved:false,experimental:true});
}
module.exports={prepare};
