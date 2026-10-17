'use strict';
/* Pure review comparison of experimental exports, never a production save diff. */
const {validateGMReviewEvidenceExport}=require('./hlm-phase11-gm-evidence-export-validation');
function compareGMReviewEvidenceExports(left,right){
 const a=validateGMReviewEvidenceExport(left),b=validateGMReviewEvidenceExport(right);
 if(!a.valid||!b.valid)return Object.freeze({valid:false,errors:Object.freeze([...a.errors.map(e=>'left:'+e),...b.errors.map(e=>'right:'+e)]),productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false});
 const l=typeof left==='string'?JSON.parse(left):left;
 const r=typeof right==='string'?JSON.parse(right):right;
 const leftByThreshold=new Map(l.rows.map(x=>[x.threshold,x.reviewed]));
 const rightByThreshold=new Map(r.rows.map(x=>[x.threshold,x.reviewed]));
 const thresholds=[...new Set([...leftByThreshold.keys(),...rightByThreshold.keys()])].sort((x,y)=>x-y);
 const changes=thresholds.filter(t=>leftByThreshold.get(t)!==rightByThreshold.get(t)).map(t=>Object.freeze({threshold:t,before:leftByThreshold.has(t)?leftByThreshold.get(t):null,after:rightByThreshold.has(t)?rightByThreshold.get(t):null,actionAuthorized:false}));
 return Object.freeze({valid:true,changes:Object.freeze(changes),productionActivationEnabled:false,gameplayActionAuthorized:false,saveWriteAllowed:false,requiresGMApproval:true});
}
module.exports={compareGMReviewEvidenceExports};
