'use strict';
// Read-only integration boundary. Does not connect to the D1 fixture settlement handler.
const {verifyTrustedCpuConsent}=require('./hlm-phase11-m1642-trusted-cpu-consent-verifier');
const deny=(code,consentCode)=>Object.freeze({ok:false,code,consentCode:consentCode||null,saved:false,settlementAuthorized:false,productionTouched:false,experimental:true});
function inspectCpuTradeReview(request={}){
 if(!request||typeof request!=='object'||Array.isArray(request))return deny('invalid-review');
 if(request.experimentalEnabled!==true)return deny('disabled-by-default');
 if(request.gmAction==='cancel'||request.gmAction==='decline')return deny('gm-declined-or-cancelled');
 if(request.gmAction!=='approve'||request.humanGMApproved!==true)return deny('gm-approval-required');
 const result=verifyTrustedCpuConsent(request);
 if(result.consentAuthenticated!==true)return deny('cpu-consent-not-authenticated',result.code);
 // A future separately audited settlement mission must own atomic D1 writes.
 return deny('settlement-not-connected',result.code);
}
module.exports=Object.freeze({inspectCpuTradeReview});
