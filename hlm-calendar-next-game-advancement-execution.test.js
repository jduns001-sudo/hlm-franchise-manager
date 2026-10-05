'use strict';
const assert=require('assert');
const {createMasterCalendar}=require('./hlm-master-calendar');
const {createSeasonPhaseTimeline}=require('./hlm-season-phase-timeline');
const {createCalendarEventIndex}=require('./hlm-calendar-event');
const {createNextGameCalendarAdvancementPlan}=require('./hlm-calendar-next-game-advancement-plan');
const {createNextGameCalendarAdvancementAuthorization}=require('./hlm-calendar-next-game-advancement-authorization');
const {executeIsolatedNextGameCalendarAdvancement}=require('./hlm-calendar-next-game-advancement-execution');
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
assert.strictEqual(result.kind,'isolated-next-game-calendar-advancement-result');assert.strictEqual(result.version,1);
assert.strictEqual(result.executed,true);assert.strictEqual(result.fromDate,'2027-03-03');assert.strictEqual(result.toDate,'2027-03-05');
assert.strictEqual(result.days,2);assert.strictEqual(result.targetGame,plan.targetGame);assert.strictEqual(result.targetGame.type,'game');
assert.strictEqual(result.calendar.currentDate,'2027-03-05');assert.strictEqual(result.dueEvents,plan.dueEvents);
assert.strictEqual(result.phaseChanges,plan.phaseChanges);assert.strictEqual(result.plan,plan);assert.strictEqual(result.authorization,authorization);
assert.strictEqual(result.advancementResult.kind,'isolated-calendar-advancement-result');assert.strictEqual(Object.isFrozen(result),true);
assert.strictEqual(calendar.currentDate,'2027-03-03');
assert.throws(()=>executeIsolatedNextGameCalendarAdvancement({calendar,plan:{...plan},authorization}),e=>e.code==='NEXT_GAME_CALENDAR_ADVANCEMENT_EXECUTION_FAILED');
assert.throws(()=>executeIsolatedNextGameCalendarAdvancement({calendar:createMasterCalendar({currentDate:'2027-03-04'}),plan,authorization}),e=>e.code==='NEXT_GAME_CALENDAR_ADVANCEMENT_EXECUTION_FAILED');
assert.throws(()=>executeIsolatedNextGameCalendarAdvancement({calendar,plan,authorization:{...authorization,targetGame:{...authorization.targetGame}}}),e=>e.code==='NEXT_GAME_CALENDAR_ADVANCEMENT_EXECUTION_FAILED');
console.log('Isolated next-game calendar advancement execution tests passed.');
