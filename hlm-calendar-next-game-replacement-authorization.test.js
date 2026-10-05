'use strict';
const assert=require('assert');
const {createExistingSlotNextGameCalendarReplacementAuthorization,assertExistingSlotNextGameCalendarReplacementAuthorized}=require('./hlm-calendar-next-game-replacement-authorization');
const targetGame=Object.freeze({kind:'calendar-event',version:1,id:'game-1',type:'game',date:'2027-03-05'});
const candidateState=Object.freeze({marker:'candidate'});
const reloadVerification=Object.freeze({slotId:'next-game-staging',fromDate:'2027-03-03',toDate:'2027-03-05',targetGame,state:candidateState});
const checkpoint=Object.freeze({slotId:'franchise',storageKey:'hfm_game_state_saves_v1'});
const requirements=Object.freeze({explicitReplacementAuthorizationRequired:true,verifyAfterReplacementRequired:true,restoreCheckpointOnFailureRequired:true});
const readiness=Object.freeze({kind:'existing-slot-next-game-calendar-replacement-readiness',version:1,ready:true,
 replacementAuthorized:false,replacementPerformed:false,candidateSlotId:'next-game-staging',targetSlotId:'franchise',
 storageKey:'hfm_game_state_saves_v1',fromDate:'2027-03-03',toDate:'2027-03-05',targetGame,reloadVerification,checkpoint,requirements});
const authorization=createExistingSlotNextGameCalendarReplacementAuthorization({readiness,approved:true});
assert.strictEqual(authorization.kind,'existing-slot-next-game-calendar-replacement-authorization');assert.strictEqual(authorization.version,1);
assert.strictEqual(authorization.approved,true);assert.strictEqual(authorization.targetGame,targetGame);assert.strictEqual(authorization.targetGame.type,'game');
assert.strictEqual(authorization.readiness,readiness);assert.strictEqual(authorization.reloadVerification,reloadVerification);
assert.strictEqual(authorization.checkpoint,checkpoint);assert.strictEqual(authorization.candidateState,candidateState);
assert.strictEqual(Object.isFrozen(authorization),true);
assert.strictEqual(assertExistingSlotNextGameCalendarReplacementAuthorized(readiness,authorization),true);
assert.throws(()=>createExistingSlotNextGameCalendarReplacementAuthorization({readiness,approved:false}),e=>e.code==='NEXT_GAME_CALENDAR_REPLACEMENT_NOT_APPROVED');
assert.throws(()=>createExistingSlotNextGameCalendarReplacementAuthorization({readiness:{...readiness,targetGame:{...targetGame}},approved:true}),e=>e.code==='INVALID_NEXT_GAME_CALENDAR_REPLACEMENT_AUTHORIZATION');
assert.throws(()=>assertExistingSlotNextGameCalendarReplacementAuthorized(readiness,{...authorization,readiness:{...readiness}}),e=>e.code==='NEXT_GAME_CALENDAR_REPLACEMENT_AUTHORIZATION_MISMATCH');
assert.throws(()=>assertExistingSlotNextGameCalendarReplacementAuthorized(readiness,{...authorization,targetSlotId:'other'}),e=>e.code==='NEXT_GAME_CALENDAR_REPLACEMENT_AUTHORIZATION_MISMATCH');
console.log('Existing-slot next-game calendar replacement authorization tests passed.');
