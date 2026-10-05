'use strict';
const assert=require('assert');
const {createNextGameCalendarPersistenceRecoveryCheckpoint,restoreNextGameCalendarPersistenceRecoveryCheckpoint}=require('./hlm-calendar-next-game-persistence-recovery-checkpoint');
function memoryStorage(initial={}){
 const values=new Map(Object.entries(initial));
 return {getItem:key=>values.has(key)?values.get(key):null,setItem:(key,value)=>values.set(key,String(value)),
  removeItem:key=>values.delete(key),values};
}
const storage=memoryStorage({'hlm-saves':'{"active":{"date":"2027-03-03"}}'});
const checkpoint=createNextGameCalendarPersistenceRecoveryCheckpoint({storage,storageKey:'hlm-saves',slotId:'active'});
assert.strictEqual(checkpoint.kind,'next-game-calendar-persistence-recovery-checkpoint');assert.strictEqual(checkpoint.version,1);
assert.strictEqual(checkpoint.verified,true);assert.strictEqual(checkpoint.storageKey,'hlm-saves');assert.strictEqual(checkpoint.slotId,'active');
assert.strictEqual(checkpoint.saveStoreValue,'{"active":{"date":"2027-03-03"}}');assert.strictEqual(Object.isFrozen(checkpoint),true);
storage.setItem('hlm-saves','{"changed":true}');
const restoration=restoreNextGameCalendarPersistenceRecoveryCheckpoint({storage,checkpoint});
assert.strictEqual(restoration.kind,'next-game-calendar-persistence-recovery-restoration');assert.strictEqual(restoration.restored,true);
assert.strictEqual(restoration.checkpoint,checkpoint);assert.strictEqual(storage.getItem('hlm-saves'),checkpoint.saveStoreValue);
assert.strictEqual(Object.isFrozen(restoration),true);
const emptyStorage=memoryStorage();
const emptyCheckpoint=createNextGameCalendarPersistenceRecoveryCheckpoint({storage:emptyStorage,storageKey:'hlm-saves',slotId:'active'});
assert.strictEqual(emptyCheckpoint.saveStoreValue,null);emptyStorage.setItem('hlm-saves','temporary');
restoreNextGameCalendarPersistenceRecoveryCheckpoint({storage:emptyStorage,checkpoint:emptyCheckpoint});
assert.strictEqual(emptyStorage.getItem('hlm-saves'),null);
assert.throws(()=>createNextGameCalendarPersistenceRecoveryCheckpoint({storage:{},storageKey:'hlm-saves',slotId:'active'}),e=>e.code==='INVALID_NEXT_GAME_CALENDAR_PERSISTENCE_RECOVERY_CHECKPOINT');
assert.throws(()=>createNextGameCalendarPersistenceRecoveryCheckpoint({storage:memoryStorage(),storageKey:'',slotId:'active'}),e=>e.code==='INVALID_NEXT_GAME_CALENDAR_PERSISTENCE_RECOVERY_CHECKPOINT');
assert.throws(()=>restoreNextGameCalendarPersistenceRecoveryCheckpoint({storage:memoryStorage(),checkpoint:{...checkpoint,verified:false}}),e=>e.code==='INVALID_NEXT_GAME_CALENDAR_PERSISTENCE_RECOVERY_CHECKPOINT');
console.log('Next-game calendar persistence recovery checkpoint tests passed.');
