'use strict';
const {timingSafeEqual}=require('node:crypto');
const {prepareGMReviewIntegrity}=require('./hlm-phase11-gm-review-presentation-integrity');
/** Compare a previously reviewed SHA-256 with the current computed, read-only report. */
function compareGMReviewIntegrity(items,expectedSha256){
 const current=prepareGMReviewIntegrity(items);
 if(current.status!=='read-only'||typeof current.sha256!=='string')return denied('invalid-evidence');
 if(typeof expectedSha256!=='string'||!/^[a-f0-9]{64}$/.test(expectedSha256))return denied('invalid-expected-digest');
 const matches=timingSafeEqual(Buffer.from(current.sha256,'hex'),Buffer.from(expectedSha256,'hex'));
 return Object.freeze({status:matches?'unchanged':'changed',matches,currentSha256:current.sha256,requiresGMApproval:true,productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false});
}
function denied(reason){return Object.freeze({status:'unavailable',matches:false,currentSha256:null,reason,requiresGMApproval:true,productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false});}
module.exports={compareGMReviewIntegrity};
