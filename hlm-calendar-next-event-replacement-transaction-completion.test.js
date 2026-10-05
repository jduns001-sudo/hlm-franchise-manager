'use strict';
const assert = require('assert');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { completeNextEventCalendarReplacementTransaction } = require('./hlm-calendar-next-event-replacement-transaction-completion');

const state=createGameStateEnvelope({meta:{currentDate:'2027-03-05',controlledTeamId:'PIT'}});
const targetEvent=Object.freeze({id:'game-1',type:'game',date:'2027-03-05',important:true});
const checkpoint=Object.freeze({marker:'checkpoint'});
const authorization=Object.freeze({approved:true,targetEvent,candidateState:state});
const execution=Object.freeze({
 kind:'existing-slot-next-event-calendar-replacement-execution',version:1,executed:true,verified:true,rolledBack:false,
 candidateSlotId:'next-event-staging',targetSlotId:'franchise',storageKey:'hfm_game_state_saves_v1',
 fromDate:'2027-03-03',toDate:'2027-03-05',targetEvent,authorization,checkpoint,candidateState:state
});
const verification=Object.freeze({
 kind:'existing-slot-next-event-calendar-replacement-verification',version:1,verified:true,
 candidateSlotId:'next-event-staging',targetSlotId:'franchise',storageKey:'hfm_game_state_saves_v1',
 fromDate:'2027-03-03',toDate:'2027-03-05',targetEvent,execution,authorization,checkpoint,state
});

const c=completeNextEventCalendarReplacementTransaction({verification});
assert.strictEqual(c.kind,'next-event-calendar-replacement-transaction-completion');
assert.strictEqual(c.complete,true);
assert.strictEqual(c.durableVerificationComplete,true);
assert.strictEqual(c.cleanupPerformed,false);
assert.strictEqual(c.checkpointPreserved,true);
assert.strictEqual(c.stagingSlotPreserved,true);
assert.strictEqual(c.targetEvent,targetEvent);
assert.strictEqual(c.verification,verification);
assert.strictEqual(c.execution,execution);
assert.strictEqual(c.authorization,authorization);
assert.strictEqual(c.checkpoint,checkpoint);
assert.strictEqual(c.state,state);
assert.strictEqual(Object.isFrozen(c),true);

assert.throws(()=>completeNextEventCalendarReplacementTransaction({verification:{...verification,verified:false}}),
 e=>e.code==='NEXT_EVENT_CALENDAR_REPLACEMENT_TRANSACTION_NOT_COMPLETE');
assert.throws(()=>completeNextEventCalendarReplacementTransaction({verification:{...verification,targetEvent:{...targetEvent}}}),
 e=>e.code==='NEXT_EVENT_CALENDAR_REPLACEMENT_TRANSACTION_NOT_COMPLETE');
assert.throws(()=>completeNextEventCalendarReplacementTransaction({verification:{...verification,authorization:{...authorization}}}),
 e=>e.code==='NEXT_EVENT_CALENDAR_REPLACEMENT_TRANSACTION_NOT_COMPLETE');
assert.throws(()=>completeNextEventCalendarReplacementTransaction({verification:{...verification,toDate:'2027-03-06'}}),
 e=>e.code==='NEXT_EVENT_CALENDAR_REPLACEMENT_TRANSACTION_NOT_COMPLETE');

console.log('Next-event calendar replacement transaction completion tests passed.');
