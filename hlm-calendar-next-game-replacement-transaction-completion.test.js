'use strict';
const assert=require('assert');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {completeNextGameCalendarReplacementTransaction}=require('./hlm-calendar-next-game-replacement-transaction-completion');
const state=createGameStateEnvelope({meta:{currentDate:'2027-03-05',controlledTeamId:'PIT'}});
const targetGame=Object.freeze({kind:'calendar-event',version:1,id:'game-1',type:'game',date:'2027-03-05',important:true});
const checkpoint=Object.freeze({marker:'checkpoint'});
const authorization=Object.freeze({approved:true,targetGame,candidateState:state});
const execution=Object.freeze({kind:'existing-slot-next-game-calendar-replacement-execution',version:1,executed:true,verified:true,
 rolledBack:false,candidateSlotId:'next-game-staging',targetSlotId:'franchise',storageKey:'hfm_game_state_saves_v1',
 fromDate:'2027-03-03',toDate:'2027-03-05',targetGame,authorization,checkpoint,candidateState:state});
const verification=Object.freeze({kind:'existing-slot-next-game-calendar-replacement-verification',version:1,verified:true,
 candidateSlotId:'next-game-staging',targetSlotId:'franchise',storageKey:'hfm_game_state_saves_v1',
 fromDate:'2027-03-03',toDate:'2027-03-05',targetGame,execution,authorization,checkpoint,state});
const c=completeNextGameCalendarReplacementTransaction({verification});
assert.strictEqual(c.kind,'next-game-calendar-replacement-transaction-completion');assert.strictEqual(c.version,1);
assert.strictEqual(c.complete,true);assert.strictEqual(c.durableVerificationComplete,true);assert.strictEqual(c.cleanupPerformed,false);
assert.strictEqual(c.checkpointPreserved,true);assert.strictEqual(c.stagingSlotPreserved,true);assert.strictEqual(c.targetGame,targetGame);
assert.strictEqual(c.targetGame.type,'game');assert.strictEqual(c.verification,verification);assert.strictEqual(c.execution,execution);
assert.strictEqual(c.authorization,authorization);assert.strictEqual(c.checkpoint,checkpoint);assert.strictEqual(c.state,state);
assert.strictEqual(Object.isFrozen(c),true);
assert.throws(()=>completeNextGameCalendarReplacementTransaction({verification:{...verification,verified:false}}),e=>e.code==='NEXT_GAME_CALENDAR_REPLACEMENT_TRANSACTION_NOT_COMPLETE');
assert.throws(()=>completeNextGameCalendarReplacementTransaction({verification:{...verification,targetGame:{...targetGame}}}),e=>e.code==='NEXT_GAME_CALENDAR_REPLACEMENT_TRANSACTION_NOT_COMPLETE');
assert.throws(()=>completeNextGameCalendarReplacementTransaction({verification:{...verification,authorization:{...authorization}}}),e=>e.code==='NEXT_GAME_CALENDAR_REPLACEMENT_TRANSACTION_NOT_COMPLETE');
assert.throws(()=>completeNextGameCalendarReplacementTransaction({verification:{...verification,toDate:'2027-03-06'}}),e=>e.code==='NEXT_GAME_CALENDAR_REPLACEMENT_TRANSACTION_NOT_COMPLETE');
console.log('Next-game calendar replacement transaction completion tests passed.');
