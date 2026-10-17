'use strict';
const {prepareGMReviewIntegrity}=require('./hlm-phase11-gm-review-presentation-integrity');
const {compareGMReviewIntegrity}=require('./hlm-phase11-gm-review-integrity-compare');
/** Human-facing deterministic change summary; never a gameplay authorization. */
function summarizeGMReviewChange(items,previousSha256){
 const current=prepareGMReviewIntegrity(items);
 if(current.status!=='read-only')return denied('invalid-evidence');
 const comparison=compareGMReviewIntegrity(items,previousSha256);
 if(comparison.status==='unavailable')return denied(comparison.reason||'invalid-expected-digest');
 const changed=comparison.status==='changed';
 return Object.freeze({status:changed?'changed':'unchanged',headline:changed?'GM review report changed since prior review':'GM review report unchanged since prior review',
 currentSha256:current.sha256,previousSha256,requiresFreshGMReview:changed,requiresGMApproval:true,
 productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false});
}
function denied(reason){return Object.freeze({status:'unavailable',headline:'GM review summary unavailable',reason,currentSha256:null,previousSha256:null,requiresFreshGMReview:true,requiresGMApproval:true,productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false});}
module.exports={summarizeGMReviewChange};
