'use strict';
// Mission 526: verify a portable audit package against existing source/destination saves.
// Package integrity alone is not proof of authenticity. Always revalidate the embedded receipt.
const {inspectGameBatchAuditPackage}=require('./hlm-phase9-batch-audit-package');
const {validateImportedGameBatchAudit}=require('./hlm-phase9-batch-audit-import-validation');
function verifyGameBatchAuditPackageAgainstSaves({storage,json}={}){
 const inspection=inspectGameBatchAuditPackage(json);
 if(!inspection.valid)return Object.freeze({
  kind:'phase9-game-batch-audit-package-save-verification',version:1,
  valid:false,errors:inspection.errors,gameCount:0,
  persistencePerformed:false,activeFranchiseSlotReplaced:false
 });
 let payload;
 try{payload=JSON.parse(json);}catch(_){throw new Error('Unexpected invalid package after inspection');}
 const validation=validateImportedGameBatchAudit({storage,json:payload.files['audit.json']});
 const errors=[...validation.errors];
 if(validation.gamesChecked!==inspection.gameCount)errors.push('AUDIT_PACKAGE_SAVED_GAME_COUNT_MISMATCH');
 return Object.freeze({
  kind:'phase9-game-batch-audit-package-save-verification',version:1,
  valid:errors.length===0,errors:Object.freeze(errors),
  gameCount:inspection.gameCount,sourceSlotId:validation.sourceSlotId,
  destinationSlotId:validation.destinationSlotId,
  persistencePerformed:false,activeFranchiseSlotReplaced:false
 });
}
module.exports={verifyGameBatchAuditPackageAgainstSaves};
