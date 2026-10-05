'use strict';
const assert=require('assert');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createBrowserSaveAdapter}=require('./hlm-browser-save-adapter');
const {verifyNextGameCalendarRecoveryCheckpointRetirement}=require('./hlm-calendar-next-game-recovery-checkpoint-retirement-verification');
function storage(){const v=new Map();return{getItem:k=>v.has(k)?v.get(k):null,setItem:(k,x)=>v.set(k,String(x)),removeItem:k=>v.delete(k)}}
const state=createGameStateEnvelope({meta:{currentDate:'2027-03-05',controlledTeamId:'PIT'}});
const targetGame=Object.freeze({kind:'calendar-event',version:1,id:'game-1',type:'game',date:'2027-03-05',important:true});
const checkpoint=Object.freeze({marker:'checkpoint'}),cleanupVerification=Object.freeze({marker:'cleanup-verification'}),completion=Object.freeze({marker:'completion'});
const readiness=Object.freeze({kind:'next-game-calendar-recovery-checkpoint-retirement-readiness',version:1,ready:true,checkpointStillPreserved:true,targetGame,completion,verification:cleanupVerification,checkpoint,state});
const authorization=Object.freeze({kind:'next-game-calendar-recovery-checkpoint-retirement-authorization',version:1,approved:true,executed:false,
 targetGame,readiness,completion,verification:cleanupVerification,checkpoint,state,candidateSlotId:'next-game-staging',targetSlotId:'franchise',
 storageKey:'hfm_game_state_saves_v1',fromDate:'2027-03-03',toDate:'2027-03-05'});
const execution=Object.freeze({kind:'next-game-calendar-recovery-checkpoint-retirement-execution',version:1,executed:true,verified:true,
 checkpointRetired:true,rollbackAuthorityRetired:true,storageDeleted:false,durableTargetPreserved:true,stagingSlotAbsent:true,
 candidateSlotId:authorization.candidateSlotId,targetSlotId:authorization.targetSlotId,storageKey:authorization.storageKey,
 fromDate:authorization.fromDate,toDate:authorization.toDate,targetGame,readiness,authorization,completion,
 verification:cleanupVerification,retiredCheckpoint:checkpoint,state});
const store=storage(),repository=createBrowserSaveAdapter(store);repository.save('franchise',state,{saveId:'franchise'});const before=store.getItem(repository.storageKey);
const r=verifyNextGameCalendarRecoveryCheckpointRetirement({execution,repository});
assert.strictEqual(r.kind,'next-game-calendar-recovery-checkpoint-retirement-verification');assert.strictEqual(r.verified,true);
assert.strictEqual(r.checkpointRetirementVerified,true);assert.strictEqual(r.rollbackAuthorityRetired,true);assert.strictEqual(r.storagePreserved,true);
assert.strictEqual(r.durableTargetPreserved,true);assert.strictEqual(r.stagingSlotAbsent,true);assert.strictEqual(r.lineageIntact,true);
assert.strictEqual(r.targetGame,targetGame);assert.strictEqual(r.targetGame.type,'game');assert.strictEqual(r.execution,execution);
assert.strictEqual(r.retiredCheckpoint,checkpoint);assert.strictEqual(Object.isFrozen(r),true);assert.strictEqual(store.getItem(repository.storageKey),before);
assert.throws(()=>verifyNextGameCalendarRecoveryCheckpointRetirement({execution:{...execution,targetGame:{...targetGame}},repository}),e=>e.code==='NEXT_GAME_CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_VERIFICATION_FAILED');
repository.save('next-game-staging',state,{saveId:'next-game-staging'});
assert.throws(()=>verifyNextGameCalendarRecoveryCheckpointRetirement({execution,repository}),e=>e.code==='NEXT_GAME_CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_VERIFICATION_FAILED');
repository.remove('next-game-staging');repository.remove('franchise');
assert.throws(()=>verifyNextGameCalendarRecoveryCheckpointRetirement({execution,repository}),e=>e.code==='NEXT_GAME_CALENDAR_RECOVERY_CHECKPOINT_RETIREMENT_VERIFICATION_FAILED');
console.log('Next-game calendar recovery checkpoint retirement verification tests passed.');
