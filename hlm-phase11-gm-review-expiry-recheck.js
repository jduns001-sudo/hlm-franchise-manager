'use strict';
const {buildGMReviewExpiryStatusReport}=require('./hlm-phase11-gm-review-expiry-status-report');
/** Deterministic read-only recheck; never persists acknowledgement or authorizes play. */
function recheckGMReviewExpiry(items,digest,acknowledged,acknowledgedAtMs,firstCheckMs,recheckMs,maxAgeMs=86400000){
 const first=buildGMReviewExpiryStatusReport(items,digest,acknowledged,acknowledgedAtMs,firstCheckMs,maxAgeMs);
 const latest=buildGMReviewExpiryStatusReport(items,digest,acknowledged,acknowledgedAtMs,recheckMs,maxAgeMs);
 const ordered=Number.isSafeInteger(firstCheckMs)&&firstCheckMs>=0&&Number.isSafeInteger(recheckMs)&&recheckMs>=firstCheckMs;
 const status=ordered?latest.status:'invalid-recheck-order';
 const stillCurrent=ordered&&first.status==='current'&&latest.status==='current';
 return Object.freeze({status,firstStatus:first.status,latestStatus:latest.status,stillCurrent,
  requiresFreshAcknowledgement:!stillCurrent,requiresGMApproval:true,productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false});
}
module.exports={recheckGMReviewExpiry};
