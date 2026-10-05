'use strict';
const assert=require('assert');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createBrowserSaveAdapter}=require('./hlm-browser-save-adapter');
const {executeNextGameCalendarRecoveryCheckpointRetirement}=require('./hlm-calendar-next-game-recovery-checkpoint-retirement-execution');
function storage(){const v=new Map();return{getItem:k=>v.has(k)?v.get(k):null,setItem:(k,x)=>v.set(k,String(x)),removeItem:k=>v.delete(k)}}
const state=createGameStateEnvelope({meta:{currentDate:'2027-03-05',controlledTeamId:'PIT'}});
const targetGame=Object.freeze({kind:'calendar-event',version:1,id:'game-1',type:'game',date:'2027-03-05',important:true});
const checkpoint=Object.freeze({marker:'checkpoint'}),verification=Object.freeze({marker:'verification'});
const completion=Object.freeze({candidateSlotId:'next-game-staging',targetSlotId:'franchise',storageKey:'hfm_game_state_saves_v1',fromDate:'2027-03-03',toDate:'2027-03-05',targetGame,verification,checkpoint,state});
const readiness=Object.freeze({kind:'next-game-calendar-recovery-checkpoint-retirement-readiness',version:1,ready:true,retirementAuthorized:false,retirementPerformed:false,checkpointStillPreserved:true,
 candidateSlotId:'next-game-staging',targetSlotId:'franchise',storageKey:'hfm_game_state_saves_v1',fromDate:'2027-03-03',toDate:'2027-03-05',targetGame,completion,verification,checkpoint,state,
 requirements:Object.freeze({explicitRetirementAuthorizationRequired:true,durableTargetMustRemainVerified:true})});
const authorization=Object.freeze({kind:'next-game-calendar-recovery-checkpoint-retirement-authorization',version:1,approved:true,executed:false,
 checkpointMustRemainPreservedUntilExecution:true,durableTargetMustRemainVerified:true,candidateSlotId:readiness.candidateSlotId,targetSlotId:readiness.targetSlotId,
 storageKey:readiness.storageKey,fromDate:readiness.fromDate,toDate:readiness.toDate,targetGame,readiness,completion,verification,checkpoint,state});
const store=storage(),repository=createBrowserSaveAdapter(store);repository.save('franchise',state,{saveId:'franchise'});
const before=store.getItem(repository.storageKey),r=executeNextGameCalendarRecoveryCheckpointRetirement({readiness,authorization,repository});
assert.strictEqual(r.kind,'next-game-calendar-recovery-checkpoint-retirement-execution');assert.strictEqual(r.executed,true);assert.strictEqual(r.verified,true);
assert.strictEqual(r.checkpointRetired,true);assert.strictEqual(r.rollbackAuthorityRetired,true);assert.strictEqual(r.storageDeleted,false);
assert.strictEqual(r.durableTargetPreserved,true);assert.strictEqual(r.stagingSlotAbsent,true);assert.strictEqual(r.targetGame,targetGame);
assert.strictEqual(r.targetGame.type,'game');assert.strictEqual(r.retiredCheckpoint,checkpoint);assert.strictEqual(Object.isFrozen(r),true);
assert.strictEqual(store.getItem(repository.storageKey),before);assert.strictEqual(repository.has('franchise'),true);
assert.throws(()=>executeNextGameCalendarRecoveryCheckpointRetirement({readiness:{...readiness},authorization,repository}),e=>e.code==='NEXT_GAME_CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_EXECUTION_FAILED');
repository.save('next-game-staging',state,{saveId:'next-game-staging'});
assert.throws(()=>executeNextGameCalendarRecoveryCheckpointRetirement({readiness,authorization,repository}),e=>e.code==='NEXT_GAME_CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_EXECUTION_FAILED');
repository.remove('next-game-staging');
repository.save('franchise',createGameStateEnvelope({meta:{currentDate:'2027-03-05',controlledTeamId:'BOS'}}),{saveId:'franchise'},{replace:true});
assert.throws(()=>executeNextGameCalendarRecoveryCheckpointRetirement({readiness,authorization,repository}),e=>e.code==='NEXT_GAME_CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_EXECUTION_FAILED');
console.log('Next-game calendar recovery checkpoint retirement execution tests passed.');
