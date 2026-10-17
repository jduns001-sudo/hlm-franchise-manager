'use strict';
const {validateAndRenderGMReview}=require('./hlm-phase11-gm-review-report-invalid-evidence');
const MAX_ITEMS=50;
const MAX_EVIDENCE_CHARS=250000;
/** Reject oversized evidence before expensive parsing or report construction. */
function renderBoundedGMReview(items){
 if(!Array.isArray(items)||items.length<1||items.length>MAX_ITEMS)return denied('batch-size-limit');
 let total=0;
 for(const item of items){
  if(!item||typeof item.before!=='string'||typeof item.after!=='string')return denied('invalid-batch-shape');
  total+=item.before.length+item.after.length;
  if(total>MAX_EVIDENCE_CHARS)return denied('evidence-size-limit');
 }
 const result=validateAndRenderGMReview(items);
 return Object.freeze({...result,evidenceChars:total});
}
function denied(reason){return Object.freeze({accepted:false,reason,page:null,evidenceChars:0,requiresGMApproval:true,productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false});}
module.exports={renderBoundedGMReview,MAX_ITEMS,MAX_EVIDENCE_CHARS};
