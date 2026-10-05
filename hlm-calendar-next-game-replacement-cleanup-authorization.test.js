'use strict';
const assert=require('assert');
const {createNextGameCalendarReplacementCleanupAuthorization,assertNextGameCalendarReplacementCleanupAuthorized}=require('./hlm-calendar-next-game-replacement-cleanup-authorization');
const targetGame=Object.freeze({kind:'calendar-event',version:1,id:'game-1',type:'game',date:'2027-03-05',important:true});
const checkpoint=Object.freeze({marker:'checkpoint'});
const completion=Object.freeze({kind:'next-game-calendar-replacement-transaction-completion',complete:true,candidateSlotId:'next-game-staging',
 targetSlotId:'franchise',storageKey:'hfm_game_state_saves_v1',fromDate:'2027-03-03',toDate:'2027-03-05',targetGame,checkpoint});
const readiness=Object.freeze({kind:'next-game-calendar-replacement-cleanup-readiness',version:1,ready:true,cleanupAuthorized:false,
 cleanupPerformed:false,candidateSlotId:'next-game-staging',targetSlotId:'franchise',storageKey:'hfm_game_state_saves_v1',
 fromDate:'2027-03-03',toDate:'2027-03-05',targetGame,completion,checkpoint,
 requirements:Object.freeze({explicitCleanupAuthorizationRequired:true,targetMustRemainDurable:true})});
const authorization=createNextGameCalendarReplacementCleanupAuthorization({readiness,approved:true});
assert.strictEqual(authorization.kind,'next-game-calendar-replacement-cleanup-authorization');assert.strictEqual(authorization.version,1);
assert.strictEqual(authorization.approved,true);assert.strictEqual(authorization.cleanupPerformed,false);
assert.strictEqual(authorization.targetGame,targetGame);assert.strictEqual(authorization.targetGame.type,'game');
assert.strictEqual(authorization.readiness,readiness);assert.strictEqual(authorization.completion,completion);
assert.strictEqual(authorization.checkpoint,checkpoint);assert.strictEqual(Object.isFrozen(authorization),true);
assert.strictEqual(assertNextGameCalendarReplacementCleanupAuthorized(readiness,authorization),true);
assert.throws(()=>createNextGameCalendarReplacementCleanupAuthorization({readiness,approved:false}),e=>e.code==='NEXT_GAME_CALENDAR_REPLACEMENT_CLEANUP_NOT_APPROVED');
assert.throws(()=>createNextGameCalendarReplacementCleanupAuthorization({readiness:{...readiness,targetGame:{...targetGame}},approved:true}),e=>e.code==='INVALID_NEXT_GAME_CALENDAR_REPLACEMENT_CLEANUP_AUTHORIZATION');
assert.throws(()=>assertNextGameCalendarReplacementCleanupAuthorized(readiness,{...authorization,targetSlotId:'other'}),e=>e.code==='NEXT_GAME_CALENDAR_REPLACEMENT_CLEANUP_AUTHORIZATION_MISMATCH');
assert.throws(()=>assertNextGameCalendarReplacementCleanupAuthorized({...readiness},authorization),e=>e.code==='NEXT_GAME_CALENDAR_REPLACEMENT_CLEANUP_AUTHORIZATION_MISMATCH');
console.log('Next-game calendar replacement cleanup authorization tests passed.');
