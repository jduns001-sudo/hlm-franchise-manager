'use strict';
const assert=require('assert');
const {createMasterCalendar}=require('./hlm-master-calendar');
const {createSeasonPhaseTimeline}=require('./hlm-season-phase-timeline');
const {createCalendarEventIndex}=require('./hlm-calendar-event');
const {createDailyTickPlan}=require('./hlm-daily-tick-plan');
const {createDailyTickAuthorization}=require('./hlm-daily-tick-authorization');
const {executeIsolatedDailyTickCalendar}=require('./hlm-daily-tick-calendar-execution');

const calendar=createMasterCalendar({currentDate:'2027-04-17'});
const timeline=createSeasonPhaseTimeline({windows:[
 {phaseId:'regular-season',startDate:'2026-10-06',endDate:'2027-04-17'},
 {phaseId:'playoffs',startDate:'2027-04-18',endDate:'2027-06-20'}
]});
const eventIndex=createCalendarEventIndex({events:[
 {id:'game-1',type:'game',date:'2027-04-18',important:true},
 {id:'playoffs-open',type:'playoffs-open',date:'2027-04-18',important:true}
]});
const plan=createDailyTickPlan({calendar,timeline,eventIndex});
const authorization=createDailyTickAuthorization({plan,approved:true});
const result=executeIsolatedDailyTickCalendar({calendar,plan,authorization});
assert.strictEqual(result.kind,'isolated-daily-tick-calendar-execution');assert.strictEqual(result.version,1);
assert.strictEqual(result.executed,true);assert.strictEqual(result.calendarAdvanced,true);assert.strictEqual(result.eventsProcessed,false);
assert.strictEqual(result.gameSimulationPerformed,false);assert.strictEqual(result.universeSystemsProcessed,false);assert.strictEqual(result.persistencePerformed,false);
assert.strictEqual(result.fromDate,'2027-04-17');assert.strictEqual(result.toDate,'2027-04-18');assert.strictEqual(result.days,1);
assert.strictEqual(result.calendar.currentDate,'2027-04-18');assert.strictEqual(calendar.currentDate,'2027-04-17');
assert.strictEqual(result.dueEvents,plan.dueEvents);assert.strictEqual(result.phaseChanges,plan.phaseChanges);
assert.strictEqual(result.plan,plan);assert.strictEqual(result.authorization,authorization);
assert.strictEqual(result.advancementResult.dueEvents,plan.dueEvents);assert.strictEqual(Object.isFrozen(result),true);
assert.throws(()=>executeIsolatedDailyTickCalendar({calendar,plan,authorization:{...authorization}}),e=>e.code==='DAILY_TICK_CALENDAR_EXECUTION_FAILED');
assert.throws(()=>executeIsolatedDailyTickCalendar({calendar:createMasterCalendar({currentDate:'2027-04-16'}),plan,authorization}),e=>e.code==='DAILY_TICK_CALENDAR_EXECUTION_FAILED');
console.log('Daily tick calendar execution tests passed.');
