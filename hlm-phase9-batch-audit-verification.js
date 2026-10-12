'use strict';
// Mission 517: verify a game batch audit receipt against two browser save slots.
const {createBrowserSaveAdapter}=require('./hlm-browser-save-adapter');
const {serializeGameState}=require('./hlm-game-state-serialization');
function verifyGameBatchAudit({storage,receipt}={}){
 const errors=[];
 if(!receipt||receipt.kind!=='phase9-approved-game-batch-audit'||receipt.version!==1||
  receipt.gmApproved!==true||receipt.previewMatched!==true||receipt.persistenceVerified!==true||
  receipt.activeFranchiseSlotReplaced!==false||!Array.isArray(receipt.games)||receipt.games.length===0)
  return Object.freeze({valid:false,errors:Object.freeze(['INVALID_AUDIT_RECEIPT'])});
 if(typeof receipt.sourceSlotId!=='string'||!receipt.sourceSlotId.trim()||
  typeof receipt.destinationSlotId!=='string'||!receipt.destinationSlotId.trim()||
  receipt.sourceSlotId===receipt.destinationSlotId)
  return Object.freeze({valid:false,errors:Object.freeze(['INVALID_AUDIT_SLOTS'])});
 const repo=createBrowserSaveAdapter(storage);
 let source,destination;
 try{source=repo.load(receipt.sourceSlotId).state;}catch(_){errors.push('AUDIT_SOURCE_UNAVAILABLE');}
 try{destination=repo.load(receipt.destinationSlotId).state;}catch(_){errors.push('AUDIT_DESTINATION_UNAVAILABLE');}
 if(source&&serializeGameState(source)!==receipt.sourceFingerprint)errors.push('AUDIT_SOURCE_CHANGED');
 if(destination&&serializeGameState(destination)!==receipt.candidateFingerprint)errors.push('AUDIT_DESTINATION_CHANGED');
 if(destination){
  const games=destination.activity&&destination.activity.games||[];
  const history=destination.history&&destination.history.records||[];
  const seen=new Set();
  for(let i=0;i<receipt.games.length;i++){
   const entry=receipt.games[i];
   if(!entry||entry.order!==i+1||typeof entry.gameId!=='string'||seen.has(entry.gameId)||
    typeof entry.seed!=='string'||!entry.seed.trim()||
    !entry.score||!Number.isInteger(entry.score.homeGoals)||!Number.isInteger(entry.score.awayGoals)||
    entry.score.homeGoals<0||entry.score.awayGoals<0){errors.push('AUDIT_GAME_ENTRY_INVALID');break;}
   seen.add(entry.gameId);
   const game=games.find(g=>String(g.id)===entry.gameId);
   if(!game||game.status!=='Played'||game.homeScore!==entry.score.homeGoals||
    game.awayScore!==entry.score.awayGoals||
    !history.some(h=>String(h.gameId)===entry.gameId&&h.homeGoals===entry.score.homeGoals&&h.awayGoals===entry.score.awayGoals))
    errors.push('AUDIT_GAME_RESULT_MISMATCH');
  }
 }
 return Object.freeze({kind:'phase9-game-batch-audit-verification',valid:errors.length===0,errors:Object.freeze(errors),
  gamesChecked:receipt.games.length,sourcePreserved:!!source&&serializeGameState(source)===receipt.sourceFingerprint});
}
module.exports={verifyGameBatchAudit};
