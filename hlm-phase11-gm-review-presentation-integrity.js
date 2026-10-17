'use strict';
const {createHash}=require('node:crypto');
const {presentGMReviewSafely}=require('./hlm-phase11-gm-review-report-safe-presentation');
/** Digest computed HTML so a human GM can detect changed report content between reviews. */
function prepareGMReviewIntegrity(items){
 const presentation=presentGMReviewSafely(items);
 if(presentation.status!=='read-only'||typeof presentation.html!=='string')
  return Object.freeze({status:'unavailable',sha256:null,html:null,reason:presentation.reason,requiresGMApproval:true,productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false});
 const sha256=createHash('sha256').update(presentation.html,'utf8').digest('hex');
 return Object.freeze({status:'read-only',sha256,html:presentation.html,reason:'human-review-required',requiresGMApproval:true,productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false});
}
module.exports={prepareGMReviewIntegrity};
