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
{const f=fixture();const result=executeExistingSlotDailyTickReplacement(f);
 assert.strictEqual(result.kind,'existing-slot-daily-tick-replacement-execution');assert.strictEqual(result.executed,true);
 assert.strictEqual(result.verified,true);assert.strictEqual(result.rolledBack,false);assert.strictEqual(result.days,1);
 assert.strictEqual(result.authorization,f.authorization);assert.strictEqual(result.readiness,f.readiness);assert.strictEqual(result.checkpoint,f.checkpoint);
 assert.strictEqual(result.candidateState,f.candidateState);assert.strictEqual(Object.isFrozen(result),true);
 assert.strictEqual(serializeGameState(f.repository.load('franchise').state),serializeGameState(f.candidateState));
 assert.strictEqual(f.repository.has('daily-tick-staging'),true);}
{const f=fixture();const before=f.storage.getItem(DEFAULT_STORAGE_KEY);
 const failingRepository={storageKey:DEFAULT_STORAGE_KEY,has:id=>f.repository.has(id),save:(...args)=>f.repository.save(...args),
  load:id=>id==='franchise'?{state:createGameStateEnvelope({meta:{currentDate:'2027-04-17',controlledTeamId:'PIT'}})}:f.repository.load(id)};
 let thrown;try{executeExistingSlotDailyTickReplacement({...f,repository:failingRepository});}catch(error){thrown=error;}
 assert(thrown);assert.strictEqual(thrown.code,'DAILY_TICK_REPLACEMENT_POST_WRITE_VERIFICATION_FAILED');
 assert.strictEqual(thrown.persistenceRolledBack,true);assert.strictEqual(f.storage.getItem(DEFAULT_STORAGE_KEY),before);
 assert.strictEqual(serializeGameState(f.repository.load('franchise').state),serializeGameState(f.oldState));
 assert.strictEqual(f.repository.has('daily-tick-staging'),true);}
{const f=fixture();assert.throws(()=>executeExistingSlotDailyTickReplacement({...f,authorization:{...f.authorization,readiness:{...f.readiness}}}),e=>e.code==='DAILY_TICK_REPLACEMENT_EXECUTION_NOT_AUTHORIZED');}
{const f=fixture();assert.throws(()=>executeExistingSlotDailyTickReplacement({...f,repository:{...f.repository,storageKey:'wrong-key'}}),e=>e.code==='DAILY_TICK_REPLACEMENT_STORAGE_MISMATCH');}
console.log('Existing-slot daily tick replacement executor tests passed.');
