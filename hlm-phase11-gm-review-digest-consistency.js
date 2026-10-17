'use strict';
const {buildGMReviewChangeDigest}=require('./hlm-phase11-gm-review-change-digest');
const {narrateGMReviewChangeDigest}=require('./hlm-phase11-gm-review-digest-narrative');
const {describeGMReviewDigest}=require('./hlm-phase11-gm-review-digest-accessibility');
/* Cross-check all read-only GM review digest representations before presenting them. */
function checkGMReviewDigestConsistency(before,after){
 const digest=buildGMReviewChangeDigest(before,after);
 const narrative=narrateGMReviewChangeDigest(before,after);
 const accessible=describeGMReviewDigest(before,after);
 const valid=digest.valid===true&&narrative.valid===true&&accessible.valid===true;
 const counts=digest.counts;
 const consistent=valid&&narrative.lines.length===(digest.totalChanges?4:1)&&
 (digest.totalChanges===0?accessible.text==='No review-state changes.':
  accessible.text.startsWith(digest.totalChanges+' review-state change'))&&
 Object.values(counts).reduce((a,b)=>a+b,0)===digest.totalChanges;
 return Object.freeze({valid,consistent:!!consistent,totalChanges:valid?digest.totalChanges:null,
  productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false,requiresGMApproval:true});
}
module.exports={checkGMReviewDigestConsistency};
