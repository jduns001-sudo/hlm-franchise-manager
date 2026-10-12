'use strict';
// Mission 531: plain-text GM review summary, suitable for copying or downloading.
const {summarizeGameBatchAuditReview}=require('./hlm-phase9-batch-audit-review-summary');
function safe(value){return String(value==null?'':value).replace(/[\r\n\t\x00-\x1f\x7f]/g,' ').slice(0,256);}
function formatGameBatchAuditReviewSummary({storage,json,receipt}={}){
 const summary=summarizeGameBatchAuditReview({storage,json,receipt});
 const lines=[
  'HOCKEY FRANCHISE MANAGER | GAME BATCH AUDIT REVIEW',
  'Status: '+summary.status,
  'Verified: '+(summary.verified?'YES':'NO')
 ];
 if(summary.verified){
  lines.push('Reviewer: '+safe(summary.reviewerId));
  lines.push('Games: '+summary.gameCount);
  lines.push('Source save: '+safe(summary.sourceSlotId));
  lines.push('Destination save: '+safe(summary.destinationSlotId));
  lines.push('GM review confirmed: '+(summary.approvalConfirmed?'YES':'NO'));
  lines.push('JSON fingerprint: '+safe(summary.jsonFingerprint));
  lines.push('CSV fingerprint: '+safe(summary.csvFingerprint));
  lines.push('Text fingerprint: '+safe(summary.textFingerprint));
 }else{
  lines.push('Errors: '+summary.errors.map(safe).join(', '));
 }
 lines.push('Franchise save modified: NO');
 return Object.freeze({kind:'phase9-game-batch-audit-review-summary-text',version:1,
  text:lines.join('\n')+'\n',verified:summary.verified,
  persistencePerformed:false,activeFranchiseSlotReplaced:false});
}
module.exports={formatGameBatchAuditReviewSummary};
