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

const {verifyExistingSlotDailyTickReplacement}=require('./hlm-daily-tick-replacement-verification');
const {completeDailyTickReplacementTransaction}=require('./hlm-daily-tick-replacement-transaction-completion');

{const f=fixture();const execution=executeExistingSlotDailyTickReplacement(f);
 const verification=verifyExistingSlotDailyTickReplacement({execution,repository:f.repository});
 const completion=completeDailyTickReplacementTransaction({verification});
 assert.strictEqual(completion.kind,'daily-tick-replacement-transaction-completion');assert.strictEqual(completion.version,1);assert.strictEqual(completion.complete,true);
 assert.strictEqual(completion.durableVerificationComplete,true);assert.strictEqual(completion.cleanupPerformed,false);
 assert.strictEqual(completion.checkpointPreserved,true);assert.strictEqual(completion.stagingSlotPreserved,true);assert.strictEqual(completion.exactlyOneDayComplete,true);
 assert.strictEqual(completion.days,1);assert.strictEqual(completion.verification,verification);assert.strictEqual(completion.execution,execution);
 assert.strictEqual(completion.authorization,f.authorization);assert.strictEqual(completion.checkpoint,f.checkpoint);assert.strictEqual(completion.state,verification.state);
 assert.strictEqual(Object.isFrozen(completion),true);assert.strictEqual(f.repository.has('daily-tick-staging'),true);}
{const f=fixture();const execution=executeExistingSlotDailyTickReplacement(f);const verification=verifyExistingSlotDailyTickReplacement({execution,repository:f.repository});
 assert.throws(()=>completeDailyTickReplacementTransaction({verification:{...verification,days:2}}),e=>e.code==='DAILY_TICK_REPLACEMENT_TRANSACTION_NOT_COMPLETE');}
{const f=fixture();const execution=executeExistingSlotDailyTickReplacement(f);const verification=verifyExistingSlotDailyTickReplacement({execution,repository:f.repository});
 assert.throws(()=>completeDailyTickReplacementTransaction({verification:{...verification,authorization:{...f.authorization}}}),e=>e.code==='DAILY_TICK_REPLACEMENT_TRANSACTION_NOT_COMPLETE');}
console.log('Daily tick replacement transaction completion tests passed.');
