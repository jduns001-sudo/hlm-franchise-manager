'use strict';
const {recheckGMReviewExpiry}=require('./hlm-phase11-gm-review-expiry-recheck');
/** Pure, read-only classification of an acknowledgement's two-check transition. */
function auditGMReviewRecheckTransition(items,digest,acknowledged,acknowledgedAtMs,firstCheckMs,recheckMs,maxAgeMs=86400000){
 const recheck=recheckGMReviewExpiry(items,digest,acknowledged,acknowledgedAtMs,firstCheckMs,recheckMs,maxAgeMs);
 const transition=recheck.status==='invalid-recheck-order'?'invalid-order':
  recheck.firstStatus==='current'&&recheck.latestStatus==='current'?'remained-current':
  recheck.firstStatus==='current'?'became-unavailable':
  recheck.latestStatus==='current'?'became-current':'not-current';
 return Object.freeze({status:recheck.status,transition,firstStatus:recheck.firstStatus,latestStatus:recheck.latestStatus,
  requiresFreshAcknowledgement:recheck.requiresFreshAcknowledgement,requiresGMApproval:true,
  productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false});
}
module.exports={auditGMReviewRecheckTransition};
