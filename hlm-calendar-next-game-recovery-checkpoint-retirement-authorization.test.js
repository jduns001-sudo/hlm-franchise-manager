'use strict';
const assert=require('assert');
const {createNextGameCalendarRecoveryCheckpointRetirementAuthorization,assertNextGameCalendarRecoveryCheckpointRetirementAuthorized}=require('./hlm-calendar-next-game-recovery-checkpoint-retirement-authorization');
const state=Object.freeze({meta:Object.freeze({currentDate:'2027-03-05'})});
const targetGame=Object.freeze({kind:'calendar-event',version:1,id:'game-1',type:'game',date:'2027-03-05',important:true});
const checkpoint=Object.freeze({marker:'checkpoint'}),verification=Object.freeze({marker:'verification'});
const completion=Object.freeze({candidateSlotId:'next-game-staging',targetSlotId:'franchise',storageKey:'hfm_game_state_saves_v1',
 fromDate:'2027-03-03',toDate:'2027-03-05',targetGame,verification,checkpoint,state});
const readiness=Object.freeze({kind:'next-game-calendar-recovery-checkpoint-retirement-readiness',version:1,ready:true,
 retirementAuthorized:false,retirementPerformed:false,checkpointStillPreserved:true,candidateSlotId:'next-game-staging',
 targetSlotId:'franchise',storageKey:'hfm_game_state_saves_v1',fromDate:'2027-03-03',toDate:'2027-03-05',targetGame,
 completion,verification,checkpoint,state,requirements:Object.freeze({explicitRetirementAuthorizationRequired:true,durableTargetMustRemainVerified:true})});
const authorization=createNextGameCalendarRecoveryCheckpointRetirementAuthorization({readiness,approved:true});
assert.strictEqual(authorization.kind,'next-game-calendar-recovery-checkpoint-retirement-authorization');
assert.strictEqual(authorization.approved,true);assert.strictEqual(authorization.executed,false);
assert.strictEqual(authorization.checkpointMustRemainPreservedUntilExecution,true);assert.strictEqual(authorization.durableTargetMustRemainVerified,true);
assert.strictEqual(authorization.targetGame,targetGame);assert.strictEqual(authorization.targetGame.type,'game');
assert.strictEqual(authorization.readiness,readiness);assert.strictEqual(authorization.checkpoint,checkpoint);
assert.strictEqual(authorization.state,state);assert.strictEqual(Object.isFrozen(authorization),true);
assert.strictEqual(assertNextGameCalendarRecoveryCheckpointRetirementAuthorized(readiness,authorization),true);
assert.throws(()=>createNextGameCalendarRecoveryCheckpointRetirementAuthorization({readiness,approved:false}),e=>e.code==='NEXT_GAME_CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_NOT_AUTHORIZED');
assert.throws(()=>createNextGameCalendarRecoveryCheckpointRetirementAuthorization({readiness:{...readiness,checkpointStillPreserved:false},approved:true}),e=>e.code==='NEXT_GAME_CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_NOT_AUTHORIZED');
assert.throws(()=>assertNextGameCalendarRecoveryCheckpointRetirementAuthorized({...readiness},authorization),e=>e.code==='NEXT_GAME_CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_NOT_AUTHORIZED');
assert.throws(()=>assertNextGameCalendarRecoveryCheckpointRetirementAuthorized(readiness,{...authorization,targetGame:{...targetGame}}),e=>e.code==='NEXT_GAME_CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_NOT_AUTHORIZED');
console.log('Next-game calendar recovery checkpoint retirement authorization tests passed.');
