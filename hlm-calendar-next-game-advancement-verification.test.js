'use strict';
const assert=require('assert');
const {createMasterCalendar}=require('./hlm-master-calendar');
const {createSeasonPhaseTimeline}=require('./hlm-season-phase-timeline');
const {createCalendarEventIndex}=require('./hlm-calendar-event');
const {createNextGameCalendarAdvancementPlan}=require('./hlm-calendar-next-game-advancement-plan');
const {createNextGameCalendarAdvancementAuthorization}=require('./hlm-calendar-next-game-advancement-authorization');
const {executeIsolatedNextGameCalendarAdvancement}=require('./hlm-calendar-next-game-advancement-execution');
const {verifyNextGameCalendarAdvancement}=require('./hlm-calendar-next-game-advancement-verification');
const calendar=createMasterCalendar({currentDate:'2027-03-03'});
const timeline=createSeasonPhaseTimeline({windows:[
 {phaseId:'regular-season',startDate:'2027-03-01',endDate:'2027-03-04'},
 {phaseId:'trade-deadline',startDate:'2027-03-05',endDate:'2027-03-05'}
]});
const eventIndex=createCalendarEventIndex({events:[
 {id:'scout',type:'scouting-update',date:'2027-03-04'},
 {id:'deadline',type:'trade-deadline',date:'2027-03-05',important:true},
 {id:'game',type:'game',date:'2027-03-05'}
]});
const plan=createNextGameCalendarAdvancementPlan({calendar,timeline,eventIndex});
const authorization=createNextGameCalendarAdvancementAuthorization({plan,approved:true});
const result=executeIsolatedNextGameCalendarAdvancement({calendar,plan,authorization});
const verification=verifyNextGameCalendarAdvancement({plan,authorization,result});
assert.strictEqual(verification.kind,'next-game-calendar-advancement-verification');assert.strictEqual(verification.version,1);
assert.strictEqual(verification.verified,true);assert.strictEqual(verification.targetGameReached,true);assert.strictEqual(verification.lineageIntact,true);
assert.strictEqual(verification.targetGame,plan.targetGame);assert.strictEqual(verification.targetGame.type,'game');assert.strictEqual(verification.result,result);
assert.strictEqual(verification.calendar.currentDate,'2027-03-05');assert.strictEqual(verification.advancementVerification.verified,true);
assert.strictEqual(verification.dueEvents,plan.dueEvents);assert.strictEqual(verification.phaseChanges,plan.phaseChanges);assert.strictEqual(Object.isFrozen(verification),true);
assert.throws(()=>verifyNextGameCalendarAdvancement({plan:{...plan},authorization,result}),e=>e.code==='NEXT_GAME_CALENDAR_ADVANCEMENT_VERIFICATION_FAILED');
assert.throws(()=>verifyNextGameCalendarAdvancement({plan,authorization,result:{...result,targetGame:{...result.targetGame}}}),e=>e.code==='NEXT_GAME_CALENDAR_ADVANCEMENT_VERIFICATION_FAILED');
assert.throws(()=>verifyNextGameCalendarAdvancement({plan,authorization,result:{...result,calendar:createMasterCalendar({currentDate:'2027-03-04'})}}),e=>e.code==='NEXT_GAME_CALENDAR_ADVANCEMENT_VERIFICATION_FAILED');
assert.throws(()=>verifyNextGameCalendarAdvancement({plan,authorization,result:{...result,advancementResult:{...result.advancementResult,dueEvents:[]}}}),e=>e.code==='NEXT_GAME_CALENDAR_ADVANCEMENT_VERIFICATION_FAILED');
console.log('Next-game calendar advancement verification tests passed.');
