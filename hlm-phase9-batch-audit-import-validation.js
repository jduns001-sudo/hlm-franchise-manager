'use strict';
// Mission 519: validate a portable audit export against existing saves without importing or overwriting.
const {parseGameBatchAuditExport}=require('./hlm-phase9-batch-audit-export');
const {verifyGameBatchAudit}=require('./hlm-phase9-batch-audit-verification');
function validateImportedGameBatchAudit({storage,json}={}){
 const parsed=parseGameBatchAuditExport(json);
 const verification=verifyGameBatchAudit({storage,receipt:parsed.receipt});
 return Object.freeze({
  kind:'phase9-game-batch-audit-import-validation',version:1,
  valid:verification.valid,errors:verification.errors,
  gamesChecked:verification.gamesChecked||0,
  sourceSlotId:parsed.receipt.sourceSlotId,
  destinationSlotId:parsed.receipt.destinationSlotId,
  persistencePerformed:false,activeFranchiseSlotReplaced:false,
  safeToReview:verification.valid===true
 });
}
module.exports={validateImportedGameBatchAudit};
