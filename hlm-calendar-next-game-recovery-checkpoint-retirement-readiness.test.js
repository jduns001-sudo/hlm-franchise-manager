'use strict';
const assert=require('assert');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {evaluateNextGameCalendarRecoveryCheckpointRetirementReadiness}=require('./hlm-calendar-next-game-recovery-checkpoint-retirement-readiness');
const state=createGameStateEnvelope({meta:{currentDate:'2027-03-05'}});
const targetGame=Object.freeze({kind:'calendar-event',version:1,id:'game-1',type:'game',date:'2027-03-05',important:true});
const checkpoint=Object.freeze({marker:'checkpoint'}),execution=Object.freeze({marker:'cleanup-execution'});
const readiness=Object.freeze({marker:'cleanup-readiness'}),authorization=Object.freeze({marker:'cleanup-authorization'});
const replacementCompletion=Object.freeze({marker:'replacement-completion'});
const verification=Object.freeze({kind:'next-game-calendar-replacement-cleanup-verification',version:1,verified:true,
 stagingSlotAbsent:true,targetMatchesAuthorizedCandidate:true,checkpointPreserved:true,lineageIntact:true,
 candidateSlotId:'next-game-staging',targetSlotId:'franchise',storageKey:'hfm_game_state_saves_v1',
 fromDate:'2027-03-03',toDate:'2027-03-05',targetGame,execution,readiness,authorization,completion:replacementCompletion,checkpoint,state});
const completion=Object.freeze({kind:'next-game-calendar-replacement-cleanup-transaction-completion',version:1,complete:true,
 cleanupPerformed:true,cleanupVerified:true,stagingSlotRemoved:true,targetPreserved:true,checkpointPreserved:true,lineageIntact:true,
 candidateSlotId:'next-game-staging',targetSlotId:'franchise',storageKey:'hfm_game_state_saves_v1',
 fromDate:'2027-03-03',toDate:'2027-03-05',targetGame,verification,execution,readiness,authorization,replacementCompletion,checkpoint,state});
const r=evaluateNextGameCalendarRecoveryCheckpointRetirementReadiness({completion});
assert.strictEqual(r.kind,'next-game-calendar-recovery-checkpoint-retirement-readiness');assert.strictEqual(r.ready,true);
assert.strictEqual(r.retirementAuthorized,false);assert.strictEqual(r.retirementPerformed,false);assert.strictEqual(r.checkpointStillPreserved,true);
assert.strictEqual(r.targetGame,targetGame);assert.strictEqual(r.targetGame.type,'game');assert.strictEqual(r.completion,completion);
assert.strictEqual(r.verification,verification);assert.strictEqual(r.checkpoint,checkpoint);assert.strictEqual(r.state,state);
assert.strictEqual(r.requirements.explicitRetirementAuthorizationRequired,true);assert.strictEqual(r.requirements.durableTargetMustRemainVerified,true);
assert.strictEqual(Object.isFrozen(r),true);assert.strictEqual(Object.isFrozen(r.requirements),true);
assert.throws(()=>evaluateNextGameCalendarRecoveryCheckpointRetirementReadiness({completion:{...completion,complete:false}}),e=>e.code==='NEXT_GAME_CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_NOT_READY');
assert.throws(()=>evaluateNextGameCalendarRecoveryCheckpointRetirementReadiness({completion:{...completion,checkpointPreserved:false}}),e=>e.code==='NEXT_GAME_CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_NOT_READY');
assert.throws(()=>evaluateNextGameCalendarRecoveryCheckpointRetirementReadiness({completion:{...completion,targetGame:{...targetGame}}}),e=>e.code==='NEXT_GAME_CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_NOT_READY');
assert.throws(()=>evaluateNextGameCalendarRecoveryCheckpointRetirementReadiness({completion:{...completion,toDate:'2027-03-06'}}),e=>e.code==='NEXT_GAME_CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_NOT_READY');
console.log('Next-game calendar recovery checkpoint retirement readiness tests passed.');
