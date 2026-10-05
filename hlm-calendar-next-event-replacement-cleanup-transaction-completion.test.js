'use strict';
const assert=require('assert');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {completeNextEventCalendarReplacementCleanupTransaction}=require('./hlm-calendar-next-event-replacement-cleanup-transaction-completion');
const state=createGameStateEnvelope({meta:{currentDate:'2027-03-05',controlledTeamId:'PIT'}});
const targetEvent=Object.freeze({id:'game-1',type:'game',date:'2027-03-05',important:true});
const checkpoint=Object.freeze({marker:'checkpoint'});
const replacementCompletion=Object.freeze({kind:'next-event-calendar-replacement-transaction-completion',complete:true,targetEvent});
const readiness=Object.freeze({kind:'next-event-calendar-replacement-cleanup-readiness',version:1,ready:true,targetEvent,completion:replacementCompletion,checkpoint});
const authorization=Object.freeze({kind:'next-event-calendar-replacement-cleanup-authorization',version:1,approved:true,targetEvent,readiness,completion:replacementCompletion,checkpoint});
const execution=Object.freeze({kind:'next-event-calendar-replacement-cleanup-execution',version:1,executed:true,verified:true,
 stagingSlotRemoved:true,checkpointPreserved:true,candidateSlotId:'next-event-staging',targetSlotId:'franchise',
 storageKey:'hfm_game_state_saves_v1',fromDate:'2027-03-03',toDate:'2027-03-05',targetEvent,readiness,authorization,completion:replacementCompletion,checkpoint});
const verification=Object.freeze({kind:'next-event-calendar-replacement-cleanup-verification',version:1,verified:true,
 stagingSlotAbsent:true,targetMatchesAuthorizedCandidate:true,checkpointPreserved:true,lineageIntact:true,
 candidateSlotId:'next-event-staging',targetSlotId:'franchise',storageKey:'hfm_game_state_saves_v1',
 fromDate:'2027-03-03',toDate:'2027-03-05',targetEvent,execution,readiness,authorization,completion:replacementCompletion,checkpoint,state});
const r=completeNextEventCalendarReplacementCleanupTransaction({verification});
assert.strictEqual(r.kind,'next-event-calendar-replacement-cleanup-transaction-completion');assert.strictEqual(r.complete,true);
assert.strictEqual(r.cleanupPerformed,true);assert.strictEqual(r.cleanupVerified,true);assert.strictEqual(r.stagingSlotRemoved,true);
assert.strictEqual(r.targetPreserved,true);assert.strictEqual(r.checkpointPreserved,true);assert.strictEqual(r.lineageIntact,true);
assert.strictEqual(r.targetEvent,targetEvent);assert.strictEqual(r.verification,verification);assert.strictEqual(r.execution,execution);
assert.strictEqual(r.readiness,readiness);assert.strictEqual(r.authorization,authorization);assert.strictEqual(r.replacementCompletion,replacementCompletion);
assert.strictEqual(r.checkpoint,checkpoint);assert.strictEqual(r.state,state);assert.strictEqual(Object.isFrozen(r),true);
assert.throws(()=>completeNextEventCalendarReplacementCleanupTransaction({verification:{...verification,verified:false}}),
 e=>e.code==='NEXT_EVENT_CALENDAR_REPLACEMENT_CLEANUP_TRANSACTION_NOT_COMPLETE');
assert.throws(()=>completeNextEventCalendarReplacementCleanupTransaction({verification:{...verification,targetEvent:{...targetEvent}}}),
 e=>e.code==='NEXT_EVENT_CALENDAR_REPLACEMENT_CLEANUP_TRANSACTION_NOT_COMPLETE');
assert.throws(()=>completeNextEventCalendarReplacementCleanupTransaction({verification:{...verification,authorization:{...authorization}}}),
 e=>e.code==='NEXT_EVENT_CALENDAR_REPLACEMENT_CLEANUP_TRANSACTION_NOT_COMPLETE');
assert.throws(()=>completeNextEventCalendarReplacementCleanupTransaction({verification:{...verification,targetSlotId:'other'}}),
 e=>e.code==='NEXT_EVENT_CALENDAR_REPLACEMENT_CLEANUP_TRANSACTION_NOT_COMPLETE');
console.log('Next-event calendar replacement cleanup transaction completion tests passed.');
