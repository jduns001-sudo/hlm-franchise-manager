'use strict';
const assert=require('assert');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {completeNextGameCalendarReplacementCleanupTransaction}=require('./hlm-calendar-next-game-replacement-cleanup-transaction-completion');
const state=createGameStateEnvelope({meta:{currentDate:'2027-03-05',controlledTeamId:'PIT'}});
const targetGame=Object.freeze({kind:'calendar-event',version:1,id:'game-1',type:'game',date:'2027-03-05',important:true});
const checkpoint=Object.freeze({marker:'checkpoint'});
const replacementCompletion=Object.freeze({kind:'next-game-calendar-replacement-transaction-completion',complete:true,targetGame});
const readiness=Object.freeze({kind:'next-game-calendar-replacement-cleanup-readiness',version:1,ready:true,targetGame,completion:replacementCompletion,checkpoint});
const authorization=Object.freeze({kind:'next-game-calendar-replacement-cleanup-authorization',version:1,approved:true,targetGame,readiness,completion:replacementCompletion,checkpoint});
const execution=Object.freeze({kind:'next-game-calendar-replacement-cleanup-execution',version:1,executed:true,verified:true,
 stagingSlotRemoved:true,checkpointPreserved:true,candidateSlotId:'next-game-staging',targetSlotId:'franchise',
 storageKey:'hfm_game_state_saves_v1',fromDate:'2027-03-03',toDate:'2027-03-05',targetGame,readiness,authorization,completion:replacementCompletion,checkpoint});
const verification=Object.freeze({kind:'next-game-calendar-replacement-cleanup-verification',version:1,verified:true,
 stagingSlotAbsent:true,targetMatchesAuthorizedCandidate:true,checkpointPreserved:true,lineageIntact:true,
 candidateSlotId:'next-game-staging',targetSlotId:'franchise',storageKey:'hfm_game_state_saves_v1',
 fromDate:'2027-03-03',toDate:'2027-03-05',targetGame,execution,readiness,authorization,completion:replacementCompletion,checkpoint,state});
const r=completeNextGameCalendarReplacementCleanupTransaction({verification});
assert.strictEqual(r.kind,'next-game-calendar-replacement-cleanup-transaction-completion');assert.strictEqual(r.complete,true);
assert.strictEqual(r.cleanupPerformed,true);assert.strictEqual(r.cleanupVerified,true);assert.strictEqual(r.stagingSlotRemoved,true);
assert.strictEqual(r.targetPreserved,true);assert.strictEqual(r.checkpointPreserved,true);assert.strictEqual(r.lineageIntact,true);
assert.strictEqual(r.targetGame,targetGame);assert.strictEqual(r.targetGame.type,'game');assert.strictEqual(r.verification,verification);
assert.strictEqual(r.execution,execution);assert.strictEqual(r.readiness,readiness);assert.strictEqual(r.authorization,authorization);
assert.strictEqual(r.replacementCompletion,replacementCompletion);assert.strictEqual(r.checkpoint,checkpoint);
assert.strictEqual(r.state,state);assert.strictEqual(Object.isFrozen(r),true);
assert.throws(()=>completeNextGameCalendarReplacementCleanupTransaction({verification:{...verification,verified:false}}),e=>e.code==='NEXT_GAME_CALENDAR_REPLACEMENT_CLEANUP_TRANSACTION_NOT_COMPLETE');
assert.throws(()=>completeNextGameCalendarReplacementCleanupTransaction({verification:{...verification,targetGame:{...targetGame}}}),e=>e.code==='NEXT_GAME_CALENDAR_REPLACEMENT_CLEANUP_TRANSACTION_NOT_COMPLETE');
assert.throws(()=>completeNextGameCalendarReplacementCleanupTransaction({verification:{...verification,authorization:{...authorization}}}),e=>e.code==='NEXT_GAME_CALENDAR_REPLACEMENT_CLEANUP_TRANSACTION_NOT_COMPLETE');
assert.throws(()=>completeNextGameCalendarReplacementCleanupTransaction({verification:{...verification,targetSlotId:'other'}}),e=>e.code==='NEXT_GAME_CALENDAR_REPLACEMENT_CLEANUP_TRANSACTION_NOT_COMPLETE');
console.log('Next-game calendar replacement cleanup transaction completion tests passed.');
