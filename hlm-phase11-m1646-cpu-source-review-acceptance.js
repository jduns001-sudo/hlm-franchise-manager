'use strict';
// Read-only composition: neither boundary has write capability or a trusted issuer.
const {inspectTrustedCpuSource}=require('./hlm-phase11-m1645-trusted-cpu-source-boundary');
const {inspectCpuTradeReview}=require('./hlm-phase11-m1643-cpu-trade-review-integration');
const deny=(code,sourceCode,reviewCode)=>Object.freeze({ok:false,code,sourceCode,reviewCode,saved:false,settlementAuthorized:false,productionTouched:false,experimental:true});
function inspectCpuSourceAndTradeReview(request={}){
 if(!request||typeof request!=='object'||Array.isArray(request))return deny('invalid-request',null,null);
 if(request.experimentalEnabled!==true)return deny('disabled-by-default',null,null);
 if(request.gmAction==='cancel'||request.gmAction==='decline')return deny('gm-declined-or-cancelled',null,null);
 if(request.gmAction!=='approve'||request.humanGMApproved!==true)return deny('gm-approval-required',null,null);
 const source=inspectTrustedCpuSource(request);
 const review=inspectCpuTradeReview(request);
 if(source.sourceAuthenticated!==true||review.ok!==true)
  return deny('cpu-consent-not-authenticated',source.code,review.consentCode||review.code);
 // This boundary is intentionally non-settling even if future readers authenticate.
 return deny('settlement-not-connected',source.code,review.code);
}
module.exports=Object.freeze({inspectCpuSourceAndTradeReview});
