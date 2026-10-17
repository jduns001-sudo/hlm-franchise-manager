'use strict';
/* Strict read-only validation for experimental review exports; never imports into saves. */
function validateGMReviewEvidenceExport(input){
 const errors=[];
 let parsed;
 try{parsed=typeof input==='string'?JSON.parse(input):input;}catch{errors.push('invalid-json');}
 if(!errors.length){
  if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))errors.push('invalid-object');
  else{
   if(parsed.schemaVersion!==1)errors.push('unsupported-schema');
   if(parsed.kind!=='experimental-gm-review-evidence')errors.push('invalid-kind');
   if(parsed.productionActivationEnabled!==false||parsed.gameplayActionAuthorized!==false||parsed.persistent!==false)errors.push('unsafe-flags');
   if(parsed.requiresGMApproval!==true)errors.push('missing-human-approval');
   if(!Array.isArray(parsed.rows)||parsed.rows.length>1000)errors.push('invalid-rows');
   else if(parsed.rows.some(r=>!r||!Number.isSafeInteger(r.threshold)||r.threshold<1||typeof r.reviewed!=='boolean'||r.actionAuthorized!==false))errors.push('invalid-row');
  }
 }
 return Object.freeze({valid:errors.length===0,errors:Object.freeze(errors),productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false});
}
module.exports={validateGMReviewEvidenceExport};
