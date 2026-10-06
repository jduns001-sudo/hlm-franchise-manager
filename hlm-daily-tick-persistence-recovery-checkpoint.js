'use strict';

/**
 * Phase 3 Mission 205: daily tick persistence recovery checkpoint.
 * Captures the exact save-store value before any future occupied-slot replacement.
 * Does not replace a save.
 */
function checkpointError(message){const error=new Error(message);error.code='INVALID_DAILY_TICK_PERSISTENCE_RECOVERY_CHECKPOINT';return error;}
function assertStorage(storage){
 if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function'||typeof storage.removeItem!=='function')
  throw checkpointError('Web Storage-compatible storage is required.');
}
function createDailyTickPersistenceRecoveryCheckpoint(input={}){
 const storage=input.storage,storageKey=typeof input.storageKey==='string'?input.storageKey.trim():'',
 slotId=typeof input.slotId==='string'?input.slotId.trim():'';
 assertStorage(storage);if(!storageKey||!slotId)throw checkpointError('Storage key and target slot are required.');
 const saveStoreValue=storage.getItem(storageKey);
 const verified=storage.getItem(storageKey)===saveStoreValue;
 if(!verified)throw checkpointError('Daily tick persistence recovery checkpoint verification failed.');
 return Object.freeze({kind:'daily-tick-persistence-recovery-checkpoint',version:1,verified:true,storageKey,slotId,saveStoreValue});
}
function restoreDailyTickPersistenceRecoveryCheckpoint(input={}){
 const storage=input.storage,checkpoint=input.checkpoint;assertStorage(storage);
 if(!checkpoint||checkpoint.kind!=='daily-tick-persistence-recovery-checkpoint'||checkpoint.version!==1||
 checkpoint.verified!==true||typeof checkpoint.storageKey!=='string'||!checkpoint.storageKey||
 typeof checkpoint.slotId!=='string'||!checkpoint.slotId)
  throw checkpointError('A verified daily tick persistence recovery checkpoint is required.');
 if(checkpoint.saveStoreValue===null)storage.removeItem(checkpoint.storageKey);
 else storage.setItem(checkpoint.storageKey,checkpoint.saveStoreValue);
 if(storage.getItem(checkpoint.storageKey)!==checkpoint.saveStoreValue)
  throw checkpointError('Daily tick persistence recovery checkpoint restoration failed.');
 return Object.freeze({kind:'daily-tick-persistence-recovery-restoration',version:1,restored:true,
  storageKey:checkpoint.storageKey,slotId:checkpoint.slotId,checkpoint});
}
module.exports={createDailyTickPersistenceRecoveryCheckpoint,restoreDailyTickPersistenceRecoveryCheckpoint};
