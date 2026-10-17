'use strict';
const {renderGMReviewReport}=require('./hlm-phase11-gm-review-report-render');
/** Immutable, bounded HTML response with explicit browser isolation policy. */
function buildSecureGMReviewPage(items){
 const html=renderGMReviewReport(items);
 const policy="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
 return Object.freeze({
  html,headers:Object.freeze({'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':policy,'X-Content-Type-Options':'nosniff'}),
  readOnly:true,requiresGMApproval:true,productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false
 });
}
module.exports={buildSecureGMReviewPage};
