'use strict';
// Mission 523: collect verified JSON, CSV and text game batch audit reports in memory.
const {exportVerifiedGameBatchAudit}=require('./hlm-phase9-batch-audit-export');
const {exportGameBatchAuditCsv}=require('./hlm-phase9-batch-audit-csv');
const {formatGameBatchAuditReport}=require('./hlm-phase9-batch-audit-text-report');
function buildGameBatchAuditBundle({storage,receipt}={}){
 const json=exportVerifiedGameBatchAudit({storage,receipt});
 const csv=exportGameBatchAuditCsv({storage,json:json.json});
 const text=formatGameBatchAuditReport({storage,json:json.json});
 if(!csv.verified||!text.valid||json.gamesChecked!==csv.gameCount||csv.gameCount!==text.gameCount){
  throw Object.assign(new Error('Audit report formats do not agree'),{code:'GAME_BATCH_AUDIT_BUNDLE_MISMATCH'});
 }
 return Object.freeze({
  kind:'phase9-game-batch-audit-bundle',version:1,
  json:json.json,csv:csv.csv,text:text.text,
  gameCount:json.gamesChecked,verified:true,
  persistencePerformed:false,activeFranchiseSlotReplaced:false
 });
}
module.exports={buildGameBatchAuditBundle};
