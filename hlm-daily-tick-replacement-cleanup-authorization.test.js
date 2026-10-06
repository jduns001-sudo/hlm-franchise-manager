'use strict';
const assert=require('assert');
const {createDailyTickReplacementCleanupAuthorization,assertDailyTickReplacementCleanupAuthorized}=require('./hlm-daily-tick-replacement-cleanup-authorization');

const checkpoint=Object.freeze({kind:'daily-tick-persistence-recovery-checkpoint',version:1,verified:true,storageKey:'hlm-save-store',slotId:'franchise'});
const completion=Object.freeze({kind:'daily-tick-replacement-transaction-completion',version:1,complete:true,days:1,
 candidateSlotId:'daily-tick-staging',targetSlotId:'franchise',storageKey:'hlm-save-store',fromDate:'2027-04-17',toDate:'2027-04-18',checkpoint});
const requirements=Object.freeze({explicitCleanupAuthorizationRequired:true,targetMustRemainDurable:true});
const readiness=Object.freeze({kind:'daily-tick-replacement-cleanup-readiness',version:1,ready:true,cleanupAuthorized:false,cleanupPerformed:false,days:1,
 candidateSlotId:'daily-tick-staging',targetSlotId:'franchise',storageKey:'hlm-save-store',fromDate:'2027-04-17',toDate:'2027-04-18',
 completion,checkpoint,requirements});

const authorization=createDailyTickReplacementCleanupAuthorization({readiness,approved:true});
assert.strictEqual(authorization.kind,'daily-tick-replacement-cleanup-authorization');assert.strictEqual(authorization.version,1);
assert.strictEqual(authorization.approved,true);assert.strictEqual(authorization.cleanupPerformed,false);assert.strictEqual(authorization.days,1);
assert.strictEqual(authorization.readiness,readiness);assert.strictEqual(authorization.completion,completion);assert.strictEqual(authorization.checkpoint,checkpoint);
assert.strictEqual(authorization.candidateSlotId,'daily-tick-staging');assert.strictEqual(authorization.targetSlotId,'franchise');
assert.strictEqual(authorization.storageKey,'hlm-save-store');assert.strictEqual(authorization.fromDate,'2027-04-17');assert.strictEqual(authorization.toDate,'2027-04-18');
assert.strictEqual(Object.isFrozen(authorization),true);assert.strictEqual(assertDailyTickReplacementCleanupAuthorized(readiness,authorization),true);

assert.throws(()=>createDailyTickReplacementCleanupAuthorization({readiness,approved:false}),e=>e.code==='DAILY_TICK_REPLACEMENT_CLEANUP_NOT_APPROVED');
assert.throws(()=>createDailyTickReplacementCleanupAuthorization({readiness:{...readiness,days:2},approved:true}),e=>e.code==='INVALID_DAILY_TICK_REPLACEMENT_CLEANUP_AUTHORIZATION');
assert.throws(()=>assertDailyTickReplacementCleanupAuthorized(readiness,{...authorization,readiness:{...readiness}}),e=>e.code==='DAILY_TICK_REPLACEMENT_CLEANUP_AUTHORIZATION_MISMATCH');
assert.throws(()=>assertDailyTickReplacementCleanupAuthorized(readiness,{...authorization,candidateSlotId:'other'}),e=>e.code==='DAILY_TICK_REPLACEMENT_CLEANUP_AUTHORIZATION_MISMATCH');
console.log('Daily tick replacement cleanup authorization tests passed.');
