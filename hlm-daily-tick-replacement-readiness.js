'use strict';

/**
 * Phase 3 Mission 206: daily tick existing-slot replacement readiness.
 * Read-only gate before any occupied target save replacement.
 */
function readinessError(message){const error=new Error(message);error.code='DAILY_TICK_REPLACEMENT_NOT_READY';return error;}

function evaluateExistingSlotDailyTickReplacementReadiness(input={}){
 const reload=input.reloadVerification,checkpoint=input.checkpoint,repository=input.repository;
 const targetSlotId=typeof input.targetSlotId==='string'?input.targetSlotId.trim():'';
 const storageKey=typeof input.storageKey==='string'?input.storageKey.trim():'';

 if(!reload||reload.kind!=='persisted-daily-tick-gamestate-reload-verification'||reload.version!==1||
 reload.verified!==true||reload.exactlyOneDayVerified!==true||reload.eventsUnprocessed!==true||
 reload.gameSimulationPerformed!==false||reload.universeSystemsProcessed!==false||reload.days!==1||
 typeof reload.slotId!=='string'||!reload.slotId.trim()||!reload.verification||!reload.state)
  throw readinessError('Verified persisted daily tick GameState reload is required.');

 if(!repository||typeof repository.has!=='function')throw readinessError('A repository with slot lookup capability is required.');
 if(!targetSlotId||!storageKey)throw readinessError('Exact target slot and storage key are required.');
 if(targetSlotId===reload.slotId)throw readinessError('Verified daily tick candidate staging slot must remain separate from the occupied target slot.');
 if(!repository.has(targetSlotId))throw readinessError('Target save slot must already exist before replacement can be considered.');

 if(!checkpoint||checkpoint.kind!=='daily-tick-persistence-recovery-checkpoint'||checkpoint.version!==1||
 checkpoint.verified!==true||checkpoint.slotId!==targetSlotId||checkpoint.storageKey!==storageKey||
 checkpoint.saveStoreValue===null)
  throw readinessError('Verified daily tick recovery checkpoint for the exact occupied target is required.');

 return Object.freeze({
  kind:'existing-slot-daily-tick-replacement-readiness',version:1,ready:true,
  replacementAuthorized:false,replacementPerformed:false,candidateSlotId:reload.slotId,targetSlotId,storageKey,
  fromDate:reload.fromDate,toDate:reload.toDate,days:1,reloadVerification:reload,checkpoint,
  requirements:Object.freeze({explicitReplacementAuthorizationRequired:true,verifyAfterReplacementRequired:true,restoreCheckpointOnFailureRequired:true})
 });
}
module.exports={evaluateExistingSlotDailyTickReplacementReadiness};
