'use strict';
// Mission 513: process an explicitly reviewed ordered batch of scheduled games in an isolated save.
const {createBrowserSaveAdapter}=require('./hlm-browser-save-adapter');
const {serializeGameState}=require('./hlm-game-state-serialization');
const {executeDeterministicGameLoop}=require('./hlm-deterministic-game-loop');
const {buildGameResultCandidate,verifyGameResultCandidate}=require('./hlm-game-result-transaction');
function fail(code,message){throw Object.assign(new Error(message),{code});}
function persistReviewedGameBatch({storage,sourceSlotId,destinationSlotId,games,resolveEvent,confirmSimulation=false}={}){
 if(confirmSimulation!==true)fail('GAME_BATCH_APPROVAL_REQUIRED','GM approval required');
 if(!Array.isArray(games)||games.length===0)fail('GAME_BATCH_EMPTY','At least one game required');
 const ids=new Set();
 for(const g of games){
  if(!g||typeof g.gameId!=='string'||!g.gameId.trim()||ids.has(g.gameId.trim()))
   fail('GAME_BATCH_DUPLICATE_OR_INVALID','Unique game IDs required');
  ids.add(g.gameId.trim());
  if(typeof g.deterministicSeed!=='string'||!g.deterministicSeed.trim())
   fail('GAME_BATCH_SEED_REQUIRED','Each game needs a reproducible seed');
 }
 const repo=createBrowserSaveAdapter(storage);
 if(typeof sourceSlotId!=='string'||!sourceSlotId.trim()||!repo.has(sourceSlotId.trim()))
  fail('GAME_BATCH_SOURCE_REQUIRED','Existing source save required');
 if(typeof destinationSlotId!=='string'||!destinationSlotId.trim()||destinationSlotId.trim()===sourceSlotId.trim()||repo.has(destinationSlotId.trim()))
  fail('GAME_BATCH_DESTINATION_UNAVAILABLE','Separate empty destination required');
 let current=repo.load(sourceSlotId.trim()).state;
 const sourceFingerprint=serializeGameState(current);
 const results=[];
 for(const g of games){
  const loop=executeDeterministicGameLoop(current,g.gameId.trim(),{
   deterministicSeed:g.deterministicSeed,eventCount:g.eventCount===undefined?20:g.eventCount,resolveEvent});
  const tx=buildGameResultCandidate(current,loop);
  if(verifyGameResultCandidate(current,tx).valid!==true)fail('GAME_BATCH_VERIFICATION_FAILED','Candidate game failed verification');
  current=tx.candidateState;
  results.push(Object.freeze({gameId:g.gameId.trim(),score:tx.score,seed:g.deterministicSeed}));
 }
 const candidateFingerprint=serializeGameState(current);
 if(serializeGameState(repo.load(sourceSlotId.trim()).state)!==sourceFingerprint)
  fail('GAME_BATCH_SOURCE_CHANGED','Source changed before save');
 repo.save(destinationSlotId.trim(),current,{label:'Reviewed isolated game batch'});
 if(serializeGameState(repo.load(destinationSlotId.trim()).state)!==candidateFingerprint||
    serializeGameState(repo.load(sourceSlotId.trim()).state)!==sourceFingerprint)
  fail('GAME_BATCH_RELOAD_VERIFICATION_FAILED','Reload verification failed');
 return Object.freeze({kind:'phase9-isolated-game-batch',version:1,verified:true,
  sourceSlotId:sourceSlotId.trim(),destinationSlotId:destinationSlotId.trim(),
  sourceFingerprint,candidateFingerprint,results:Object.freeze(results),
  sourcePreserved:true,activeFranchiseSlotReplaced:false,autonomousCPUExecution:false});
}
module.exports={persistReviewedGameBatch};
