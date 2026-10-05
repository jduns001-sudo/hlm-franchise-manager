'use strict';

/**
 * Phase 3 Mission 172: persisted next-game GameState reload verification.
 * Freshly reloads the isolated slot and compares it to the exact candidate. No writes.
 */
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {serializeGameState}=require('./hlm-game-state-serialization');
function reloadError(message){const error=new Error(message);error.code='NEXT_GAME_CALENDAR_PERSISTENCE_RELOAD_VERIFICATION_FAILED';return error;}
function verifyPersistedNextGameCalendarGameStateReload(input={}){
 const verification=input.verification,repository=input.repository;
 if(!verification||verification.kind!=='next-game-calendar-persistence-execution-verification'||
 verification.version!==1||verification.verified!==true||!verification.targetGame||
 verification.targetGame.kind!=='calendar-event'||verification.targetGame.type!=='game'||
 verification.targetGame.date!==verification.toDate||!verification.execution||
 verification.execution.slotId!==verification.slotId||verification.execution.fromDate!==verification.fromDate||
 verification.execution.toDate!==verification.toDate||verification.execution.targetGame!==verification.targetGame)
  throw reloadError('A valid Mission 171 next-game persistence execution verification is required.');
 if(!repository||typeof repository.load!=='function')throw reloadError('A repository with load capability is required.');
 let loaded;try{loaded=repository.load(verification.slotId);}catch(_){throw reloadError('Persisted next-game GameState could not be reloaded.');}
 const state=loaded&&loaded.state,expected=verification.execution.package?.candidateState;
 if(!state||!expected||!validateGameStateEnvelope(state).valid||state.meta.currentDate!==verification.toDate||
 expected.meta?.currentDate!==verification.toDate)
  throw reloadError('Reloaded next-game GameState is invalid or has the wrong date.');
 let equivalent=false;try{equivalent=serializeGameState(state)===serializeGameState(expected);}catch(_){equivalent=false;}
 if(!equivalent)throw reloadError('Reloaded next-game GameState does not match the persisted candidate.');
 return Object.freeze({kind:'persisted-next-game-calendar-gamestate-reload-verification',version:1,verified:true,
  slotId:verification.slotId,fromDate:verification.fromDate,toDate:verification.toDate,
  targetGame:verification.targetGame,verification,state});
}
module.exports={verifyPersistedNextGameCalendarGameStateReload};
