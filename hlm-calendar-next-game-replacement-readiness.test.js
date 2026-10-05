'use strict';
const assert=require('assert');
const {evaluateExistingSlotNextGameCalendarReplacementReadiness}=require('./hlm-calendar-next-game-replacement-readiness');
const targetGame=Object.freeze({kind:'calendar-event',version:1,id:'game-1',type:'game',date:'2027-03-05',important:true});
const state=Object.freeze({meta:Object.freeze({currentDate:'2027-03-05'})});
const executionVerification=Object.freeze({targetGame});
const reload=Object.freeze({kind:'persisted-next-game-calendar-gamestate-reload-verification',version:1,verified:true,
 slotId:'staging-next-game',fromDate:'2027-03-03',toDate:'2027-03-05',targetGame,verification:executionVerification,state});
const checkpoint=Object.freeze({kind:'next-game-calendar-persistence-recovery-checkpoint',version:1,verified:true,
 storageKey:'hlm-saves',slotId:'active',saveStoreValue:'{"active":{"date":"2027-03-03"}}'});
const repository={has:id=>id==='active'||id==='staging-next-game'};
const readiness=evaluateExistingSlotNextGameCalendarReplacementReadiness({reloadVerification:reload,checkpoint,repository,targetSlotId:'active',storageKey:'hlm-saves'});
assert.strictEqual(readiness.kind,'existing-slot-next-game-calendar-replacement-readiness');assert.strictEqual(readiness.version,1);
assert.strictEqual(readiness.ready,true);assert.strictEqual(readiness.replacementAuthorized,false);assert.strictEqual(readiness.replacementPerformed,false);
assert.strictEqual(readiness.candidateSlotId,'staging-next-game');assert.strictEqual(readiness.targetSlotId,'active');
assert.strictEqual(readiness.targetGame,targetGame);assert.strictEqual(readiness.targetGame.type,'game');
assert.strictEqual(readiness.reloadVerification,reload);assert.strictEqual(readiness.checkpoint,checkpoint);
assert.strictEqual(readiness.requirements.explicitReplacementAuthorizationRequired,true);
assert.strictEqual(readiness.requirements.verifyAfterReplacementRequired,true);
assert.strictEqual(readiness.requirements.restoreCheckpointOnFailureRequired,true);
assert.strictEqual(Object.isFrozen(readiness),true);assert.strictEqual(Object.isFrozen(readiness.requirements),true);
assert.throws(()=>evaluateExistingSlotNextGameCalendarReplacementReadiness({reloadVerification:reload,checkpoint,repository,targetSlotId:'staging-next-game',storageKey:'hlm-saves'}),e=>e.code==='NEXT_GAME_CALENDAR_REPLACEMENT_NOT_READY');
assert.throws(()=>evaluateExistingSlotNextGameCalendarReplacementReadiness({reloadVerification:reload,checkpoint,repository:{has:()=>false},targetSlotId:'active',storageKey:'hlm-saves'}),e=>e.code==='NEXT_GAME_CALENDAR_REPLACEMENT_NOT_READY');
assert.throws(()=>evaluateExistingSlotNextGameCalendarReplacementReadiness({reloadVerification:reload,checkpoint:{...checkpoint,saveStoreValue:null},repository,targetSlotId:'active',storageKey:'hlm-saves'}),e=>e.code==='NEXT_GAME_CALENDAR_REPLACEMENT_NOT_READY');
assert.throws(()=>evaluateExistingSlotNextGameCalendarReplacementReadiness({reloadVerification:{...reload,targetGame:{...targetGame}},checkpoint,repository,targetSlotId:'active',storageKey:'hlm-saves'}),e=>e.code==='NEXT_GAME_CALENDAR_REPLACEMENT_NOT_READY');
console.log('Next-game existing-slot calendar replacement readiness tests passed.');
