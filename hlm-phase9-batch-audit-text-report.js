'use strict';
// Mission 521: present a human-readable read-only summary of a game batch audit report.
const {buildGameBatchAuditReport}=require('./hlm-phase9-batch-audit-report');
function formatGameBatchAuditReport({storage,json}={}){
 const report=buildGameBatchAuditReport({storage,json});
 const lines=[
  'HOCKEY FRANCHISE MANAGER | GAME BATCH AUDIT',
  'Verification: '+(report.valid?'PASS':'FAIL'),
  'GM approval: '+(report.gmApproved?'YES':'NO'),
  'Source slot: '+report.sourceSlotId,
  'Destination slot: '+report.destinationSlotId,
  'Games reviewed: '+report.gameCount,
  'Source fingerprint: '+report.sourceFingerprint,
  'Candidate fingerprint: '+report.candidateFingerprint
 ];
 for(const game of report.games)
  lines.push(game.order+'. '+game.gameId+' | '+game.homeGoals+'-'+game.awayGoals+' | Seed: '+game.seed);
 if(!report.valid)lines.push('Errors: '+report.errors.join(', '));
 lines.push('Read-only report. No save data changed.');
 return Object.freeze({
  kind:'phase9-game-batch-audit-text-report',version:1,
  valid:report.valid,text:lines.join('\n'),
  lineCount:lines.length,gameCount:report.gameCount,
  persistencePerformed:false
 });
}
module.exports={formatGameBatchAuditReport};
