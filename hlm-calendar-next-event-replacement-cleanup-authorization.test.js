'use strict';
const assert=require('assert');
const {createNextEventCalendarReplacementCleanupAuthorization,assertNextEventCalendarReplacementCleanupAuthorized}=require('./hlm-calendar-next-event-replacement-cleanup-authorization');
const targetEvent=Object.freeze({id:'game-1',type:'game',date:'2027-03-05',important:true});
const checkpoint=Object.freeze({marker:'checkpoint'});
const completion=Object.freeze({
 kind:'next-event-calendar-replacement-transaction-completion',complete:true,candidateSlotId:'next-event-staging',
 targetSlotId:'franchise',storageKey:'hfm_game_state_saves_v1',fromDate:'2027-03-03',toDate:'2027-03-05',targetEvent,checkpoint
});
const readiness=Object.freeze({
 kind:'next-event-calendar-replacement-cleanup-readiness',version:1,ready:true,cleanupAuthorized:false,cleanupPerformed:false,
 candidateSlotId:'next-event-staging',targetSlotId:'franchise',storageKey:'hfm_game_state_saves_v1',
 fromDate:'2027-03-03',toDate:'2027-03-05',targetEvent,completion,checkpoint,
 requirements:Object.freeze({explicitCleanupAuthorizationRequired:true,targetMustRemainDurable:true})
});
const authorization=createNextEventCalendarReplacementCleanupAuthorization({readiness,approved:true});
assert.strictEqual(authorization.kind,'next-event-calendar-replacement-cleanup-authorization');
assert.strictEqual(authorization.approved,true);assert.strictEqual(authorization.cleanupPerformed,false);
assert.strictEqual(authorization.targetEvent,targetEvent);assert.strictEqual(authorization.readiness,readiness);
assert.strictEqual(authorization.completion,completion);assert.strictEqual(authorization.checkpoint,checkpoint);
assert.strictEqual(Object.isFrozen(authorization),true);
assert.strictEqual(assertNextEventCalendarReplacementCleanupAuthorized(readiness,authorization),true);
assert.throws(()=>createNextEventCalendarReplacementCleanupAuthorization({readiness,approved:false}),
 e=>e.code==='NEXT_EVENT_CALENDAR_REPLACEMENT_CLEANUP_NOT_APPROVED');
assert.throws(()=>createNextEventCalendarReplacementCleanupAuthorization({readiness:{...readiness,targetEvent:{...targetEvent}},approved:true}),
 e=>e.code==='INVALID_NEXT_EVENT_CALENDAR_REPLACEMENT_CLEANUP_AUTHORIZATION');
assert.throws(()=>assertNextEventCalendarReplacementCleanupAuthorized(readiness,{...authorization,targetSlotId:'other'}),
 e=>e.code==='NEXT_EVENT_CALENDAR_REPLACEMENT_CLEANUP_AUTHORIZATION_MISMATCH');
assert.throws(()=>assertNextEventCalendarReplacementCleanupAuthorized({...readiness},authorization),
 e=>e.code==='NEXT_EVENT_CALENDAR_REPLACEMENT_CLEANUP_AUTHORIZATION_MISMATCH');
console.log('Next-event calendar replacement cleanup authorization tests passed.');
