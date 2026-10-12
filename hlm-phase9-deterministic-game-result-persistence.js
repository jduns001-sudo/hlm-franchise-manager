'use strict';
// Controlled deterministic game result persistence; no automatic franchise progression.
const {serializeGameState}=require('./hlm-game-state-serialization');
const {executeDeterministicGameLoop}=require('./hlm-deterministic-game-loop');
const {buildGameResultCandidate,verifyGameResultCandidate}=require('./hlm-game-result-transaction');
function fail(code,message){const e=new Error(message);e.code=code;throw e;}
function previewDeterministicGameResult({repository,sourceSlotId,gameId,deterministicSeed,eventCount,resolveEvent}={}){
 if(!repository||typeof repository.has!=='function'||!repository.has(sourceSlotId))
  fail('GAME_RESULT_SOURCE_REQUIRED','Existing franchise save required');
 const source=repository.load(sourceSlotId).state;
 const sourceFingerprint=serializeGameState(source);
 const loop=executeDeterministicGameLoop(source,gameId,{deterministicSeed,eventCount,resolveEvent});
 const transaction=buildGameResultCandidate(source,loop);
 const verification=verifyGameResultCandidate(source,transaction);
 if(verification.valid!==true)fail('GAME_RESULT_CANDIDATE_INVALID','Game result candidate verification failed');
 if(serializeGameState(source)!==sourceFingerprint)fail('GAME_RESULT_SOURCE_MUTATED','Preview changed source');
 return Object.freeze({kind:'phase9-deterministic-game-result-preview',version:1,sourceSlotId,gameId,
  deterministicSeed,eventCount:loop.eventCount,sourceFingerprint,
  candidateFingerprint:serializeGameState(transaction.candidateState),candidateState:transaction.candidateState,
  score:transaction.score,output:transaction.output,verified:true,persistencePerformed:false});
}
function commitDeterministicGameResult({repository,reviewedPreview,destinationSlotId,confirmCommit=false}={}){
 if(confirmCommit!==true)fail('GAME_RESULT_APPROVAL_REQUIRED','Human GM approval required');
 if(!reviewedPreview||reviewedPreview.kind!=='phase9-deterministic-game-result-preview'||reviewedPreview.verified!==true)
  fail('GAME_RESULT_REVIEW_REQUIRED','Verified preview required');
 if(typeof destinationSlotId!=='string'||!destinationSlotId.trim()||destinationSlotId===reviewedPreview.sourceSlotId||
    repository.has(destinationSlotId))
  fail('GAME_RESULT_DESTINATION_UNAVAILABLE','Separate empty destination required');
 if(serializeGameState(repository.load(reviewedPreview.sourceSlotId).state)!==reviewedPreview.sourceFingerprint)
  fail('GAME_RESULT_SOURCE_STALE','Original franchise changed since review');
 if(serializeGameState(reviewedPreview.candidateState)!==reviewedPreview.candidateFingerprint)
  fail('GAME_RESULT_PREVIEW_CHANGED','Reviewed candidate changed');
 repository.save(destinationSlotId,reviewedPreview.candidateState);
 if(serializeGameState(repository.load(destinationSlotId).state)!==reviewedPreview.candidateFingerprint||
    serializeGameState(repository.load(reviewedPreview.sourceSlotId).state)!==reviewedPreview.sourceFingerprint)
  fail('GAME_RESULT_PERSISTENCE_FAILED','Saved result failed verification');
 return Object.freeze({kind:'phase9-persisted-deterministic-game-result',version:1,
  sourceSlotId:reviewedPreview.sourceSlotId,destinationSlotId,gameId:reviewedPreview.gameId,
  score:reviewedPreview.score,verified:true,sourcePreserved:true,activeSlotReplaced:false,
  humanGMApproved:true,autonomousExecutionEnabled:false});
}
module.exports={previewDeterministicGameResult,commitDeterministicGameResult};
