'use strict';
// Mission 514: dry-run an ordered batch before GM authorization. No storage writes.
const {createBrowserSaveAdapter}=require('./hlm-browser-save-adapter');
const {serializeGameState}=require('./hlm-game-state-serialization');
const {executeDeterministicGameLoop}=require('./hlm-deterministic-game-loop');
const {buildGameResultCandidate,verifyGameResultCandidate}=require('./hlm-game-result-transaction');
function fail(code,message){throw Object.assign(new Error(message),{code});}
function previewGameBatch({storage,sourceSlotId,games,resolveEvent}={}){
 if(!Array.isArray(games)||games.length===0)fail('GAME_PREVIEW_EMPTY','At least one game required');
 const ids=new Set();
 for(const g of games){
  if(!g||typeof g.gameId!=='string'||!g.gameId.trim()||ids.has(g.gameId.trim()))
   fail('GAME_PREVIEW_INVALID_GAME','Unique nonempty game IDs required');
  ids.add(g.gameId.trim());
  if(typeof g.deterministicSeed!=='string'||!g.deterministicSeed.trim())
   fail('GAME_PREVIEW_SEED_REQUIRED','Every game needs a deterministic seed');
 }
 const repo=createBrowserSaveAdapter(storage);
 if(typeof sourceSlotId!=='string'||!sourceSlotId.trim()||!repo.has(sourceSlotId.trim()))
  fail('GAME_PREVIEW_SOURCE_REQUIRED','Existing source slot required');
 let current=repo.load(sourceSlotId.trim()).state;
 const sourceFingerprint=serializeGameState(current);
 const results=[];
 for(const g of games){
  const loop=executeDeterministicGameLoop(current,g.gameId.trim(),{
   deterministicSeed:g.deterministicSeed,eventCount:g.eventCount===undefined?20:g.eventCount,resolveEvent});
  const tx=buildGameResultCandidate(current,loop);
  if(verifyGameResultCandidate(current,tx).valid!==true)fail('GAME_PREVIEW_INVALID_RESULT','Game verification failed');
  current=tx.candidateState;
  results.push(Object.freeze({gameId:g.gameId.trim(),score:tx.score,seed:g.deterministicSeed}));
 }
 if(serializeGameState(repo.load(sourceSlotId.trim()).state)!==sourceFingerprint)
  fail('GAME_PREVIEW_SOURCE_CHANGED','Source changed during preview');
 return Object.freeze({kind:'phase9-game-batch-preview',version:1,sourceSlotId:sourceSlotId.trim(),
  sourceFingerprint,candidateFingerprint:serializeGameState(current),results:Object.freeze(results),
  gamesPreviewed:results.length,simulationPerformed:true,persistencePerformed:false,
  sourcePreserved:true,approvalGranted:false});
}
module.exports={previewGameBatch};
