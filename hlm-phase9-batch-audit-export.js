'use strict';
// Mission 518: export a verified audit receipt as portable JSON, without writing to browser storage.
const {verifyGameBatchAudit}=require('./hlm-phase9-batch-audit-verification');
function fail(code,message){throw Object.assign(new Error(message),{code});}
function exportVerifiedGameBatchAudit({storage,receipt}={}){
 const verification=verifyGameBatchAudit({storage,receipt});
 if(verification.valid!==true)fail('GAME_BATCH_AUDIT_EXPORT_UNVERIFIED','Audit must pass verification before export');
 const payload={
  kind:'phase9-game-batch-audit-export',version:1,
  receipt:JSON.parse(JSON.stringify(receipt)),
  verification:{valid:true,gamesChecked:verification.gamesChecked,sourcePreserved:true}
 };
 const json=JSON.stringify(payload);
 return Object.freeze({kind:payload.kind,version:1,json,bytes:new TextEncoder().encode(json).length,
  gamesChecked:verification.gamesChecked,persistencePerformed:false,verified:true});
}
function parseGameBatchAuditExport(json){
 let parsed;
 try{parsed=JSON.parse(json);}catch(_){fail('GAME_BATCH_AUDIT_EXPORT_INVALID_JSON','Invalid audit export JSON');}
 if(!parsed||parsed.kind!=='phase9-game-batch-audit-export'||parsed.version!==1||
  !parsed.receipt||parsed.receipt.kind!=='phase9-approved-game-batch-audit'||
  !parsed.verification||parsed.verification.valid!==true)
  fail('GAME_BATCH_AUDIT_EXPORT_INVALID','Invalid audit export envelope');
 return Object.freeze({receipt:parsed.receipt,verification:parsed.verification});
}
module.exports={exportVerifiedGameBatchAudit,parseGameBatchAuditExport};
