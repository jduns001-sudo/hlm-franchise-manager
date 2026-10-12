'use strict';
// Mission 520: render a read-only review report from a verified exported batch audit.
const {validateImportedGameBatchAudit}=require('./hlm-phase9-batch-audit-import-validation');
const {parseGameBatchAuditExport}=require('./hlm-phase9-batch-audit-export');
function buildGameBatchAuditReport({storage,json}={}){
 const validation=validateImportedGameBatchAudit({storage,json});
 const {receipt}=parseGameBatchAuditExport(json);
 const games=Object.freeze(receipt.games.map(g=>Object.freeze({
  order:g.order,gameId:g.gameId,seed:g.seed,
  homeGoals:g.score.homeGoals,awayGoals:g.score.awayGoals
 })));
 return Object.freeze({
  kind:'phase9-game-batch-audit-review-report',version:1,
  valid:validation.valid,errors:validation.errors,
  sourceSlotId:receipt.sourceSlotId,destinationSlotId:receipt.destinationSlotId,
  sourceFingerprint:receipt.sourceFingerprint,candidateFingerprint:receipt.candidateFingerprint,
  games,gameCount:games.length,
  gmApproved:receipt.gmApproved===true,
  safeToReview:validation.safeToReview,
  persistencePerformed:false,activeFranchiseSlotReplaced:false
 });
}
module.exports={buildGameBatchAuditReport};
