'use strict';

/**
 * Phase 3 Mission 204: persisted daily tick GameState reload verification.
 * Freshly reloads the isolated slot and compares it to the exact one-day candidate. No writes.
 */
const {validateGameStateEnvelope}=require('./hlm-game-state');
const {serializeGameState}=require('./hlm-game-state-serialization');

function reloadError(message){const error=new Error(message);error.code='DAILY_TICK_PERSISTENCE_RELOAD_VERIFICATION_FAILED';return error;}

function verifyPersistedDailyTickGameStateReload(input={}){
 const verification=input.verification,repository=input.repository;
 if(!verification||verification.kind!=='daily-tick-persistence-execution-verification'||
 verification.version!==1||verification.verified!==true||verification.exactlyOneDayVerified!==true||
 verification.eventsUnprocessed!==true||verification.gameSimulationPerformed!==false||
 verification.universeSystemsProcessed!==false||verification.days!==1||!verification.execution||
 verification.execution.slotId!==verification.slotId||verification.execution.fromDate!==verification.fromDate||
 verification.execution.toDate!==verification.toDate||verification.execution.days!==1)
  throw reloadError('A valid Mission 203 daily tick persistence execution verification is required.');

 if(!repository||typeof repository.load!=='function')
  throw reloadError('A repository with load capability is required.');

 let loaded;
 try{loaded=repository.load(verification.slotId);}
 catch(_){throw reloadError('Persisted daily tick GameState could not be reloaded.');}

 const state=loaded&&loaded.state,expected=verification.execution.package?.candidateState;
 if(!state||!expected||!validateGameStateEnvelope(state).valid||
 state.meta.currentDate!==verification.toDate||expected.meta?.currentDate!==verification.toDate)
  throw reloadError('Reloaded daily tick GameState is invalid or has the wrong date.');

 let equivalent=false;
 try{equivalent=serializeGameState(state)===serializeGameState(expected);}catch(_){equivalent=false;}
 if(!equivalent)throw reloadError('Reloaded daily tick GameState does not match the persisted candidate.');

 return Object.freeze({
  kind:'persisted-daily-tick-gamestate-reload-verification',version:1,verified:true,
  exactlyOneDayVerified:true,eventsUnprocessed:true,gameSimulationPerformed:false,
  universeSystemsProcessed:false,slotId:verification.slotId,fromDate:verification.fromDate,
  toDate:verification.toDate,days:1,verification,state
 });
}
module.exports={verifyPersistedDailyTickGameStateReload};
