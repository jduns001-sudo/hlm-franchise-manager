'use strict';
const assert=require('assert');
const {createDailyTickPersistenceRecoveryCheckpoint,restoreDailyTickPersistenceRecoveryCheckpoint}=require('./hlm-daily-tick-persistence-recovery-checkpoint');

function memoryStorage(initial={}){
 const values=new Map(Object.entries(initial));
 return {values,getItem:key=>values.has(key)?values.get(key):null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};
}
const original='{"slots":{"franchise":{"date":"2027-04-17"}}}';
const storage=memoryStorage({'hlm-save-store':original});
const checkpoint=createDailyTickPersistenceRecoveryCheckpoint({storage,storageKey:'hlm-save-store',slotId:'franchise'});
assert.strictEqual(checkpoint.kind,'daily-tick-persistence-recovery-checkpoint');assert.strictEqual(checkpoint.version,1);assert.strictEqual(checkpoint.verified,true);
assert.strictEqual(checkpoint.storageKey,'hlm-save-store');assert.strictEqual(checkpoint.slotId,'franchise');assert.strictEqual(checkpoint.saveStoreValue,original);
assert.strictEqual(Object.isFrozen(checkpoint),true);assert.strictEqual(storage.getItem('hlm-save-store'),original);

storage.setItem('hlm-save-store','changed');
const restoration=restoreDailyTickPersistenceRecoveryCheckpoint({storage,checkpoint});
assert.strictEqual(restoration.kind,'daily-tick-persistence-recovery-restoration');assert.strictEqual(restoration.version,1);assert.strictEqual(restoration.restored,true);
assert.strictEqual(restoration.checkpoint,checkpoint);assert.strictEqual(storage.getItem('hlm-save-store'),original);assert.strictEqual(Object.isFrozen(restoration),true);

const empty=memoryStorage();
const emptyCheckpoint=createDailyTickPersistenceRecoveryCheckpoint({storage:empty,storageKey:'hlm-save-store',slotId:'franchise'});
assert.strictEqual(emptyCheckpoint.saveStoreValue,null);
empty.setItem('hlm-save-store','temporary');
restoreDailyTickPersistenceRecoveryCheckpoint({storage:empty,checkpoint:emptyCheckpoint});
assert.strictEqual(empty.getItem('hlm-save-store'),null);

assert.throws(()=>createDailyTickPersistenceRecoveryCheckpoint({storage:{},storageKey:'x',slotId:'y'}),e=>e.code==='INVALID_DAILY_TICK_PERSISTENCE_RECOVERY_CHECKPOINT');
assert.throws(()=>createDailyTickPersistenceRecoveryCheckpoint({storage,storageKey:'',slotId:'franchise'}),e=>e.code==='INVALID_DAILY_TICK_PERSISTENCE_RECOVERY_CHECKPOINT');
assert.throws(()=>restoreDailyTickPersistenceRecoveryCheckpoint({storage,checkpoint:{...checkpoint,kind:'wrong'}}),e=>e.code==='INVALID_DAILY_TICK_PERSISTENCE_RECOVERY_CHECKPOINT');
console.log('Daily tick persistence recovery checkpoint tests passed.');
