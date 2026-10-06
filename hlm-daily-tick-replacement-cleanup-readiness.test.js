'use strict';
const assert=require('assert');
const {DEFAULT_STORAGE_KEY,createBrowserSaveAdapter}=require('./hlm-browser-save-adapter');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {serializeGameState}=require('./hlm-game-state-serialization');
const {createDailyTickPersistenceRecoveryCheckpoint}=require('./hlm-daily-tick-persistence-recovery-checkpoint');
const {createExistingSlotDailyTickReplacementAuthorization}=require('./hlm-daily-tick-replacement-authorization');
const {executeExistingSlotDailyTickReplacement}=require('./hlm-daily-tick-replacement-executor');

function memoryStorage(){const data=new Map();return {getItem:key=>data.has(key)?data.get(key):null,setItem:(key,value)=>data.set(key,String(value)),removeItem:key=>data.delete(key)};}
function fixture(){
 const storage=memoryStorage(),repository=createBrowserSaveAdapter(storage);
 const oldState=createGameStateEnvelope({meta:{currentDate:'2027-04-17',controlledTeamId:'PIT'}});
 const candidateState=createGameStateEnvelope({meta:{currentDate:'2027-04-18',controlledTeamId:'PIT'}});
 repository.save('franchise',oldState,{saveId:'franchise'});repository.save('daily-tick-staging',candidateState,{saveId:'daily-tick-staging'});
 const checkpoint=createDailyTickPersistenceRecoveryCheckpoint({storage,storageKey:DEFAULT_STORAGE_KEY,slotId:'franchise'});
 const reloadVerification=Object.freeze({kind:'persisted-daily-tick-gamestate-reload-verification',version:1,verified:true,
  exactlyOneDayVerified:true,eventsUnprocessed:true,gameSimulationPerformed:false,universeSystemsProcessed:false,
  slotId:'daily-tick-staging',fromDate:'2027-04-17',toDate:'2027-04-18',days:1,verification:Object.freeze({}),state:candidateState});
 const readiness=Object.freeze({kind:'existing-slot-daily-tick-replacement-readiness',version:1,ready:true,replacementAuthorized:false,
  replacementPerformed:false,candidateSlotId:'daily-tick-staging',targetSlotId:'franchise',storageKey:DEFAULT_STORAGE_KEY,
  fromDate:'2027-04-17',toDate:'2027-04-18',days:1,reloadVerification,checkpoint,
  requirements:Object.freeze({explicitReplacementAuthorizationRequired:true,verifyAfterReplacementRequired:true,restoreCheckpointOnFailureRequired:true})});
 const authorization=createExistingSlotDailyTickReplacementAuthorization({readiness,approved:true});
 return {storage,repository,oldState,candidateState,checkpoint,readiness,authorization};
}
const {verifyExistingSlotDailyTickReplacement}=require('./hlm-daily-tick-replacement-verification');
const {completeDailyTickReplacementTransaction}=require('./hlm-daily-tick-replacement-transaction-completion');
const {evaluateDailyTickReplacementCleanupReadiness}=require('./hlm-daily-tick-replacement-cleanup-readiness');

{const f=fixture();const execution=executeExistingSlotDailyTickReplacement(f);
 const verification=verifyExistingSlotDailyTickReplacement({execution,repository:f.repository});
 const completion=completeDailyTickReplacementTransaction({verification});
 const readiness=evaluateDailyTickReplacementCleanupReadiness({completion,repository:f.repository});
 assert.strictEqual(readiness.kind,'daily-tick-replacement-cleanup-readiness');assert.strictEqual(readiness.version,1);assert.strictEqual(readiness.ready,true);
 assert.strictEqual(readiness.cleanupAuthorized,false);assert.strictEqual(readiness.cleanupPerformed,false);assert.strictEqual(readiness.days,1);
 assert.strictEqual(readiness.candidateSlotId,'daily-tick-staging');assert.strictEqual(readiness.targetSlotId,'franchise');
 assert.strictEqual(readiness.completion,completion);assert.strictEqual(readiness.checkpoint,f.checkpoint);
 assert.strictEqual(readiness.requirements.explicitCleanupAuthorizationRequired,true);assert.strictEqual(readiness.requirements.targetMustRemainDurable,true);
 assert.strictEqual(Object.isFrozen(readiness),true);assert.strictEqual(Object.isFrozen(readiness.requirements),true);
 assert.strictEqual(f.repository.has('daily-tick-staging'),true);}
{const f=fixture();const execution=executeExistingSlotDailyTickReplacement(f);const verification=verifyExistingSlotDailyTickReplacement({execution,repository:f.repository});
 const completion=completeDailyTickReplacementTransaction({verification});
 assert.throws(()=>evaluateDailyTickReplacementCleanupReadiness({completion:{...completion,days:2},repository:f.repository}),e=>e.code==='DAILY_TICK_REPLACEMENT_CLEANUP_NOT_READY');}
{const f=fixture();const execution=executeExistingSlotDailyTickReplacement(f);const verification=verifyExistingSlotDailyTickReplacement({execution,repository:f.repository});
 const completion=completeDailyTickReplacementTransaction({verification});f.repository.remove('daily-tick-staging');
 assert.throws(()=>evaluateDailyTickReplacementCleanupReadiness({completion,repository:f.repository}),e=>e.code==='DAILY_TICK_REPLACEMENT_CLEANUP_NOT_READY');}
{const f=fixture();const execution=executeExistingSlotDailyTickReplacement(f);const verification=verifyExistingSlotDailyTickReplacement({execution,repository:f.repository});
 const completion=completeDailyTickReplacementTransaction({verification});f.repository.save('franchise',f.oldState,{saveId:'franchise'},{replace:true});
 assert.throws(()=>evaluateDailyTickReplacementCleanupReadiness({completion,repository:f.repository}),e=>e.code==='DAILY_TICK_REPLACEMENT_CLEANUP_NOT_READY');}
console.log('Daily tick replacement cleanup readiness tests passed.');
