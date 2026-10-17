'use strict';
/** Validate a portable GM review audit record without granting gameplay authority. */
const MAX_AUDIT_CHARS=4096;
const REQUIRED=['schemaVersion','status','checkedAtMs','sha256','requiresFreshGMReview','requiresGMApproval','productionActivationEnabled','gameplayActionAuthorized','saveWriteAllowed'];
function validateGMReviewDecisionAuditImport(text){
 let valid=false,reason='invalid-json',record=null;
 if(typeof text!=='string'||text.length>MAX_AUDIT_CHARS){reason='invalid-size';}
 else{
  try{
   const parsed=JSON.parse(text);
   if(!parsed||typeof parsed!=='object'||Array.isArray(parsed)||Object.keys(parsed).length!==REQUIRED.length||REQUIRED.some(key=>!Object.hasOwn(parsed,key))){reason='invalid-schema';}
   else if(parsed.schemaVersion!==1||!['unchanged','changed','unverified','invalid-audit-time'].includes(parsed.status)||
    !(parsed.checkedAtMs===null||(Number.isSafeInteger(parsed.checkedAtMs)&&parsed.checkedAtMs>=0))||
    typeof parsed.sha256!=='string'||!/^[a-f0-9]{64}$/.test(parsed.sha256)||
    typeof parsed.requiresFreshGMReview!=='boolean'||parsed.requiresGMApproval!==true||
    parsed.productionActivationEnabled!==false||parsed.gameplayActionAuthorized!==false||parsed.saveWriteAllowed!==false||
    (parsed.status==='invalid-audit-time')!==(parsed.checkedAtMs===null)||
    (parsed.status!=='unchanged'&&!parsed.requiresFreshGMReview)){reason='invalid-fields';}
   else{valid=true;reason='validated-read-only';record=Object.freeze(Object.fromEntries(REQUIRED.map(key=>[key,parsed[key]])));}
  }catch{reason='invalid-json';}
 }
 return Object.freeze({valid,reason,record,requiresGMApproval:true,productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false});
}
module.exports={MAX_AUDIT_CHARS,validateGMReviewDecisionAuditImport};
