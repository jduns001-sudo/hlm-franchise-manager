'use strict';
const assert=require('assert');
const {createMasterCalendar}=require('./hlm-master-calendar');
const {createSeasonPhaseTimeline}=require('./hlm-season-phase-timeline');
const {createCalendarEventIndex}=require('./hlm-calendar-event');
const {createDailyTickPlan}=require('./hlm-daily-tick-plan');
const {createDailyTickAuthorization}=require('./hlm-daily-tick-authorization');
const {executeIsolatedDailyTickCalendar}=require('./hlm-daily-tick-calendar-execution');
const {verifyDailyTickCalendarExecution}=require('./hlm-daily-tick-calendar-verification');

const sourceCalendar=createMasterCalendar({currentDate:'2027-04-17'});
const timeline=createSeasonPhaseTimeline({windows:[
 {phaseId:'regular-season',startDate:'2026-10-06',endDate:'2027-04-17'},
 {phaseId:'playoffs',startDate:'2027-04-18',endDate:'2027-06-20'}
]});
const eventIndex=createCalendarEventIndex({events:[
 {id:'game-1',type:'game',date:'2027-04-18',important:true},
 {id:'playoffs-open',type:'playoffs-open',date:'2027-04-18',important:true}
]});
const plan=createDailyTickPlan({calendar:sourceCalendar,timeline,eventIndex});
const authorization=createDailyTickAuthorization({plan,approved:true});
const result=executeIsolatedDailyTickCalendar({calendar:sourceCalendar,plan,authorization});
const verification=verifyDailyTickCalendarExecution({sourceCalendar,plan,authorization,result});
assert.strictEqual(verification.kind,'daily-tick-calendar-execution-verification');assert.strictEqual(verification.version,1);
assert.strictEqual(verification.verified,true);assert.strictEqual(verification.exactlyOneDayAdvanced,true);
assert.strictEqual(verification.sourceCalendarUnchanged,true);assert.strictEqual(verification.eventsUnprocessed,true);
assert.strictEqual(verification.gameSimulationPerformed,false);assert.strictEqual(verification.universeSystemsProcessed,false);
assert.strictEqual(verification.persistencePerformed,false);assert.strictEqual(verification.lineageIntact,true);
assert.strictEqual(verification.fromDate,'2027-04-17');assert.strictEqual(verification.toDate,'2027-04-18');
assert.strictEqual(verification.calendar.currentDate,'2027-04-18');assert.strictEqual(sourceCalendar.currentDate,'2027-04-17');
assert.strictEqual(verification.plan,plan);assert.strictEqual(verification.authorization,authorization);assert.strictEqual(verification.result,result);
assert.strictEqual(verification.dueEvents,plan.dueEvents);assert.strictEqual(verification.phaseChanges,plan.phaseChanges);
assert.strictEqual(Object.isFrozen(verification),true);
assert.throws(()=>verifyDailyTickCalendarExecution({sourceCalendar,plan,authorization:{...authorization,plan:{...plan}},result}),e=>e.code==='DAILY_TICK_CALENDAR_VERIFICATION_FAILED');
assert.throws(()=>verifyDailyTickCalendarExecution({sourceCalendar:createMasterCalendar({currentDate:'2027-04-18'}),plan,authorization,result}),e=>e.code==='DAILY_TICK_CALENDAR_VERIFICATION_FAILED');
assert.throws(()=>verifyDailyTickCalendarExecution({sourceCalendar,plan,authorization,result:{...result,eventsProcessed:true}}),e=>e.code==='DAILY_TICK_CALENDAR_VERIFICATION_FAILED');
assert.throws(()=>verifyDailyTickCalendarExecution({sourceCalendar,plan,authorization,result:{...result,dueEvents:[...result.dueEvents]}}),e=>e.code==='DAILY_TICK_CALENDAR_VERIFICATION_FAILED');
console.log('Daily tick calendar execution verification tests passed.');
