'use strict';
const assert=require('assert');
const {evaluateExistingSlotDailyTickReplacementReadiness}=require('./hlm-daily-tick-replacement-readiness');

const state=Object.freeze({kind:'game-state',meta:Object.freeze({currentDate:'2027-04-18'})});
const execution=Object.freeze({slotId:'daily-tick-stage',fromDate:'2027-04-17',toDate:'2027-04-18',days:1});
const executionVerification=Object.freeze({kind:'daily-tick-persistence-execution-verification',version:1,verified:true,execution});
const reload=Object.freeze({kind:'persisted-daily-tick-gamestate-reload-verification',version:1,verified:true,
 exactlyOneDayVerified:true,eventsUnprocessed:true,gameSimulationPerformed:false,universeSystemsProcessed:false,
 slotId:'daily-tick-stage',fromDate:'2027-04-17',toDate:'2027-04-18',days:1,verification:executionVerification,state});
const checkpoint=Object.freeze({kind:'daily-tick-persistence-recovery-checkpoint',version:1,verified:true,
 storageKey:'hlm-save-store',slotId:'franchise',saveStoreValue:'{"existing":true}'});
const repository={has:id=>id==='franchise'||id==='daily-tick-stage'};

const readiness=evaluateExistingSlotDailyTickReplacementReadiness({reloadVerification:reload,checkpoint,repository,targetSlotId:'franchise',storageKey:'hlm-save-store'});
assert.strictEqual(readiness.kind,'existing-slot-daily-tick-replacement-readiness');assert.strictEqual(readiness.version,1);assert.strictEqual(readiness.ready,true);
assert.strictEqual(readiness.replacementAuthorized,false);assert.strictEqual(readiness.replacementPerformed,false);assert.strictEqual(readiness.days,1);
assert.strictEqual(readiness.candidateSlotId,'daily-tick-stage');assert.strictEqual(readiness.targetSlotId,'franchise');assert.strictEqual(readiness.storageKey,'hlm-save-store');
assert.strictEqual(readiness.fromDate,'2027-04-17');assert.strictEqual(readiness.toDate,'2027-04-18');
assert.strictEqual(readiness.reloadVerification,reload);assert.strictEqual(readiness.checkpoint,checkpoint);
assert.strictEqual(readiness.requirements.explicitReplacementAuthorizationRequired,true);assert.strictEqual(readiness.requirements.verifyAfterReplacementRequired,true);
assert.strictEqual(readiness.requirements.restoreCheckpointOnFailureRequired,true);assert.strictEqual(Object.isFrozen(readiness),true);assert.strictEqual(Object.isFrozen(readiness.requirements),true);

assert.throws(()=>evaluateExistingSlotDailyTickReplacementReadiness({reloadVerification:{...reload,days:2},checkpoint,repository,targetSlotId:'franchise',storageKey:'hlm-save-store'}),e=>e.code==='DAILY_TICK_REPLACEMENT_NOT_READY');
assert.throws(()=>evaluateExistingSlotDailyTickReplacementReadiness({reloadVerification:reload,checkpoint,repository,targetSlotId:'daily-tick-stage',storageKey:'hlm-save-store'}),e=>e.code==='DAILY_TICK_REPLACEMENT_NOT_READY');
assert.throws(()=>evaluateExistingSlotDailyTickReplacementReadiness({reloadVerification:reload,checkpoint,repository:{has:()=>false},targetSlotId:'franchise',storageKey:'hlm-save-store'}),e=>e.code==='DAILY_TICK_REPLACEMENT_NOT_READY');
assert.throws(()=>evaluateExistingSlotDailyTickReplacementReadiness({reloadVerification:reload,checkpoint:{...checkpoint,slotId:'other'},repository,targetSlotId:'franchise',storageKey:'hlm-save-store'}),e=>e.code==='DAILY_TICK_REPLACEMENT_NOT_READY');
assert.throws(()=>evaluateExistingSlotDailyTickReplacementReadiness({reloadVerification:reload,checkpoint:{...checkpoint,saveStoreValue:null},repository,targetSlotId:'franchise',storageKey:'hlm-save-store'}),e=>e.code==='DAILY_TICK_REPLACEMENT_NOT_READY');
console.log('Daily tick existing-slot replacement readiness tests passed.');
