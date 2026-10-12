'use strict';
// Execute one seeded scheduled game into a separate verified browser save. Never overwrite the active franchise.
const {createBrowserSaveAdapter}=require('./hlm-browser-save-adapter');
const {serializeGameState}=require('./hlm-game-state-serialization');
const {executeDeterministicGameLoop}=require('./hlm-deterministic-game-loop');
const {buildGameResultCandidate,verifyGameResultCandidate}=require('./hlm-game-result-transaction');
function fail(code,message){const e=new Error(message);e.code=code;throw e;}
function persistReviewedGameResult({storage,sourceSlotId,destinationSlotId,gameId,deterministicSeed,eventCount=20,
 resolveEvent,confirmSimulation=false}={}){
 if(confirmSimulation!==true)fail('CPU_GAME_SAVE_APPROVAL_REQUIRED','Human GM must approve isolated game processing');
 const repository=createBrowserSaveAdapter(storage);
 if(typeof sourceSlotId!=='string'||!sourceSlotId.trim()||!repository.has(sourceSlotId.trim()))
  fail('CPU_GAME_SAVE_SOURCE_REQUIRED','Existing source save required');
 if(typeof destinationSlotId!=='string'||!destinationSlotId.trim()||destinationSlotId.trim()===sourceSlotId.trim()||
    repository.has(destinationSlotId.trim()))
  fail('CPU_GAME_SAVE_DESTINATION_UNAVAILABLE','Separate empty destination slot required');
 const source=repository.load(sourceSlotId.trim()).state;
 const before=serializeGameState(source);
 const loop=executeDeterministicGameLoop(source,gameId,{deterministicSeed,eventCount,resolveEvent});
 const tx=buildGameResultCandidate(source,loop);
 const verification=verifyGameResultCandidate(source,tx);
 if(verification.valid!==true)fail('CPU_GAME_SAVE_RESULT_INVALID','Game result candidate failed verification');
 const candidateFingerprint=serializeGameState(tx.candidateState);
 if(serializeGameState(repository.load(sourceSlotId.trim()).state)!==before)
  fail('CPU_GAME_SAVE_SOURCE_CHANGED','Source save changed before persistence');
 repository.save(destinationSlotId.trim(),tx.candidateState,{label:'Reviewed isolated game result'});
 try{
  if(serializeGameState(repository.load(destinationSlotId.trim()).state)!==candidateFingerprint||
     serializeGameState(repository.load(sourceSlotId.trim()).state)!==before)
   fail('CPU_GAME_SAVE_VERIFY_FAILED','Game save reload or original source verification failed');
 }catch(error){fail('CPU_GAME_SAVE_VERIFY_FAILED','Game save verification failed; inspect destination slot');}
 return Object.freeze({kind:'phase9-isolated-game-result-browser-save',version:1,
  sourceSlotId:sourceSlotId.trim(),destinationSlotId:destinationSlotId.trim(),gameId:String(gameId),
  sourceFingerprint:before,candidateFingerprint,score:tx.score,verified:true,
  deterministicSeed,gameEventsProcessed:true,sourcePreserved:true,
  activeFranchiseSlotReplaced:false,autonomousCPUExecution:false});
}
module.exports={persistReviewedGameResult};
