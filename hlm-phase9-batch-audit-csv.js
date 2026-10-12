'use strict';
// Mission 522: produce a spreadsheet-friendly CSV of game batch audit results, read-only.
const {buildGameBatchAuditReport}=require('./hlm-phase9-batch-audit-report');
function csvCell(value){
 const str=String(value==null?'':value);
 const safe=/^[=+@\-\t\r]/.test(str)?"'"+str:str;
 return /[",\r\n]/.test(safe)?'"'+safe.replace(/"/g,'""')+'"':safe;
}
function exportGameBatchAuditCsv({storage,json}={}){
 const report=buildGameBatchAuditReport({storage,json});
 if(!report.valid){
  const error=Object.assign(new Error('Audit must pass verification before CSV export'),{code:'GAME_BATCH_CSV_UNVERIFIED'});
  throw error;
 }
 const headers=['order','gameId','homeGoals','awayGoals','seed','sourceSlotId','destinationSlotId','gmApproved','verified'];
 const rows=report.games.map(g=>[g.order,g.gameId,g.homeGoals,g.awayGoals,g.seed,
  report.sourceSlotId,report.destinationSlotId,report.gmApproved,report.valid]);
 const csv=[headers.join(','),...rows.map(row=>row.map(csvCell).join(','))].join('\r\n')+'\r\n';
 return Object.freeze({kind:'phase9-game-batch-audit-csv',version:1,csv,
  gameCount:report.gameCount,verified:true,persistencePerformed:false});
}
module.exports={exportGameBatchAuditCsv};
