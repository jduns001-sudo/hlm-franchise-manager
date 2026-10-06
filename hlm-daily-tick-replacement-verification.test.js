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

{const f=fixture();const execution=executeExistingSlotDailyTickReplacement(f);
 const verification=verifyExistingSlotDailyTickReplacement({execution,repository:f.repository});
 assert.strictEqual(verification.kind,'existing-slot-daily-tick-replacement-verification');assert.strictEqual(verification.version,1);
 assert.strictEqual(verification.verified,true);assert.strictEqual(verification.exactlyOneDayVerified,true);assert.strictEqual(verification.candidateSlotPreserved,true);
 assert.strictEqual(verification.days,1);assert.strictEqual(verification.candidateSlotId,'daily-tick-staging');assert.strictEqual(verification.targetSlotId,'franchise');
 assert.strictEqual(verification.fromDate,'2027-04-17');assert.strictEqual(verification.toDate,'2027-04-18');
 assert.strictEqual(verification.execution,execution);assert.strictEqual(verification.authorization,f.authorization);assert.strictEqual(verification.checkpoint,f.checkpoint);
 assert.strictEqual(Object.isFrozen(verification),true);assert.strictEqual(f.repository.has('daily-tick-staging'),true);
 assert.strictEqual(serializeGameState(verification.state),serializeGameState(f.candidateState));}
{const f=fixture();const execution=executeExistingSlotDailyTickReplacement(f);
 assert.throws(()=>verifyExistingSlotDailyTickReplacement({execution:{...execution,days:2},repository:f.repository}),e=>e.code==='DAILY_TICK_REPLACEMENT_VERIFICATION_FAILED');}
{const f=fixture();const execution=executeExistingSlotDailyTickReplacement(f);
 const missingStage={storageKey:f.repository.storageKey,has:id=>id==='franchise',load:id=>f.repository.load(id)};
 assert.throws(()=>verifyExistingSlotDailyTickReplacement({execution,repository:missingStage}),e=>e.code==='DAILY_TICK_REPLACEMENT_VERIFICATION_FAILED');}
{const f=fixture();const execution=executeExistingSlotDailyTickReplacement(f);
 f.repository.save('franchise',f.oldState,{saveId:'franchise'},{replace:true});
 assert.throws(()=>verifyExistingSlotDailyTickReplacement({execution,repository:f.repository}),e=>e.code==='DAILY_TICK_REPLACEMENT_VERIFICATION_FAILED');}
console.log('Existing-slot daily tick replacement verification tests passed.');
