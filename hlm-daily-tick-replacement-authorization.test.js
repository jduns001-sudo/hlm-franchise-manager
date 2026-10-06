'use strict';
const assert=require('assert');
const {createExistingSlotDailyTickReplacementAuthorization,assertExistingSlotDailyTickReplacementAuthorized}=require('./hlm-daily-tick-replacement-authorization');

const state=Object.freeze({kind:'game-state',meta:Object.freeze({currentDate:'2027-04-18'})});
const reload=Object.freeze({kind:'persisted-daily-tick-gamestate-reload-verification',version:1,verified:true,
 exactlyOneDayVerified:true,eventsUnprocessed:true,gameSimulationPerformed:false,universeSystemsProcessed:false,
 slotId:'daily-tick-stage',fromDate:'2027-04-17',toDate:'2027-04-18',days:1,verification:Object.freeze({}),state});
const checkpoint=Object.freeze({kind:'daily-tick-persistence-recovery-checkpoint',version:1,verified:true,
 storageKey:'hlm-save-store',slotId:'franchise',saveStoreValue:'{"existing":true}'});
const requirements=Object.freeze({explicitReplacementAuthorizationRequired:true,verifyAfterReplacementRequired:true,restoreCheckpointOnFailureRequired:true});
const readiness=Object.freeze({kind:'existing-slot-daily-tick-replacement-readiness',version:1,ready:true,
 replacementAuthorized:false,replacementPerformed:false,candidateSlotId:'daily-tick-stage',targetSlotId:'franchise',
 storageKey:'hlm-save-store',fromDate:'2027-04-17',toDate:'2027-04-18',days:1,reloadVerification:reload,checkpoint,requirements});

const authorization=createExistingSlotDailyTickReplacementAuthorization({readiness,approved:true});
assert.strictEqual(authorization.kind,'existing-slot-daily-tick-replacement-authorization');assert.strictEqual(authorization.version,1);
assert.strictEqual(authorization.approved,true);assert.strictEqual(authorization.days,1);assert.strictEqual(authorization.readiness,readiness);
assert.strictEqual(authorization.reloadVerification,reload);assert.strictEqual(authorization.checkpoint,checkpoint);assert.strictEqual(authorization.candidateState,state);
assert.strictEqual(authorization.candidateSlotId,'daily-tick-stage');assert.strictEqual(authorization.targetSlotId,'franchise');
assert.strictEqual(authorization.storageKey,'hlm-save-store');assert.strictEqual(authorization.fromDate,'2027-04-17');assert.strictEqual(authorization.toDate,'2027-04-18');
assert.strictEqual(Object.isFrozen(authorization),true);assert.strictEqual(assertExistingSlotDailyTickReplacementAuthorized(readiness,authorization),true);

assert.throws(()=>createExistingSlotDailyTickReplacementAuthorization({readiness,approved:false}),e=>e.code==='DAILY_TICK_REPLACEMENT_NOT_APPROVED');
assert.throws(()=>createExistingSlotDailyTickReplacementAuthorization({readiness:{...readiness,days:2},approved:true}),e=>e.code==='INVALID_DAILY_TICK_REPLACEMENT_AUTHORIZATION');
assert.throws(()=>assertExistingSlotDailyTickReplacementAuthorized(readiness,{...authorization,readiness:{...readiness}}),e=>e.code==='DAILY_TICK_REPLACEMENT_AUTHORIZATION_MISMATCH');
assert.throws(()=>assertExistingSlotDailyTickReplacementAuthorized(readiness,{...authorization,candidateState:{...state}}),e=>e.code==='DAILY_TICK_REPLACEMENT_AUTHORIZATION_MISMATCH');
console.log('Daily tick existing-slot replacement authorization tests passed.');
