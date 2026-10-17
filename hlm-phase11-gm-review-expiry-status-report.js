'use strict';
const {evaluateGMReviewExpiryBoundaries}=require('./hlm-phase11-gm-review-expiry-boundary-matrix');
/** Plain-text human review status, derived only from deterministic evidence checks. */
function buildGMReviewExpiryStatusReport(items,digest,acknowledged,acknowledgedAtMs,nowMs,maxAgeMs=86400000){
 const state=evaluateGMReviewExpiryBoundaries(items,digest,acknowledged,acknowledgedAtMs,nowMs,maxAgeMs);
 const labels={current:'Acknowledgement current; human GM approval still required',expired:'Acknowledgement expired; fresh human review required',blocked:'Evidence acknowledgement blocked', 'invalid-clock':'Invalid review timing', 'future-acknowledgement':'Acknowledgement timestamp is in the future'};
 const lines=Object.freeze([labels[state.status]||'Review unavailable',state.remainingMs===null?'Remaining validity unavailable':'Remaining validity: '+state.remainingMs+' ms','No gameplay action authorized']);
 return Object.freeze({status:state.status,lines,requiresFreshAcknowledgement:state.requiresFreshAcknowledgement,requiresGMApproval:true,productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false});
}
module.exports={buildGMReviewExpiryStatusReport};
