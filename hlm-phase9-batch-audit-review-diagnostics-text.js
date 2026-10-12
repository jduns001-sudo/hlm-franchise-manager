'use strict';
// Mission 538: printable diagnostics for GM review package validation.
const {diagnoseGameBatchAuditReviewPackage}=require('./hlm-phase9-batch-audit-review-diagnostics');
function safe(value){return String(value==null?'':value).replace(/[\r\n\t\x00-\x1f\x7f]/g,' ').slice(0,512);}
function formatGameBatchAuditReviewDiagnostics({storage,json,originalAuditJson,receipt}={}){
 const result=diagnoseGameBatchAuditReviewPackage({storage,json,originalAuditJson,receipt});
 const lines=['HOCKEY FRANCHISE MANAGER | GM REVIEW PACKAGE DIAGNOSTICS',
  'Status: '+result.status,'Valid: '+(result.valid?'YES':'NO'),
  'Issues: '+result.issues.length];
 for(let i=0;i<result.issues.length;i++){
  const issue=result.issues[i];
  lines.push((i+1)+'. '+safe(issue.code)+': '+safe(issue.message));
 }
 lines.push('Franchise save modified: NO');
 return Object.freeze({kind:'phase9-game-batch-audit-review-diagnostics-text',version:1,
  valid:result.valid,text:lines.join('\n')+'\n',
  persistencePerformed:false,activeFranchiseSlotReplaced:false});
}
module.exports={formatGameBatchAuditReviewDiagnostics};
