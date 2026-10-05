'use strict';
const assert=require('assert');
const {createMasterCalendar}=require('./hlm-master-calendar');
const {createSeasonPhaseTimeline}=require('./hlm-season-phase-timeline');
const {createCalendarEventIndex}=require('./hlm-calendar-event');
const {createDailyTickPlan}=require('./hlm-daily-tick-plan');

const calendar=createMasterCalendar({currentDate:'2027-04-17'});
const timeline=createSeasonPhaseTimeline({windows:[
 {phaseId:'regular-season',startDate:'2026-10-06',endDate:'2027-04-17'},
 {phaseId:'playoffs',startDate:'2027-04-18',endDate:'2027-06-20'}
]});
const eventIndex=createCalendarEventIndex({events:[
 {id:'game-1',type:'game',date:'2027-04-18',important:true},
 {id:'playoffs-open',type:'playoffs-open',date:'2027-04-18',important:true},
 {id:'later',type:'game',date:'2027-04-19',important:true}
]});
const plan=createDailyTickPlan({calendar,timeline,eventIndex});
assert.strictEqual(plan.kind,'daily-tick-plan');assert.strictEqual(plan.version,1);assert.strictEqual(plan.days,1);
assert.strictEqual(plan.fromDate,'2027-04-17');assert.strictEqual(plan.toDate,'2027-04-18');
assert.strictEqual(plan.fromPhase.id,'regular-season');assert.strictEqual(plan.toPhase.id,'playoffs');
assert.strictEqual(plan.phaseChanges.length,1);assert.strictEqual(plan.phaseChanges[0].date,'2027-04-18');
assert.deepStrictEqual(plan.dueEvents.map(e=>e.id),['game-1','playoffs-open']);
assert.strictEqual(plan.calendarPlan.kind,'calendar-advancement-plan');assert.strictEqual(plan.calendarPlan.days,1);
assert.strictEqual(plan.processing.calendarAdvancementRequired,true);
assert.strictEqual(plan.processing.dueEventProcessingRequired,true);
assert.strictEqual(plan.processing.gameSimulationPerformed,false);
assert.strictEqual(plan.processing.universeSystemsProcessed,false);
assert.strictEqual(plan.processing.persistencePerformed,false);
assert.strictEqual(calendar.currentDate,'2027-04-17');
assert.strictEqual(Object.isFrozen(plan),true);assert.strictEqual(Object.isFrozen(plan.processing),true);

const quiet=createDailyTickPlan({
 calendar:createMasterCalendar({currentDate:'2027-04-19'}),timeline,eventIndex:createCalendarEventIndex({events:[]})
});
assert.strictEqual(quiet.toDate,'2027-04-20');assert.strictEqual(quiet.dueEvents.length,0);
assert.strictEqual(quiet.processing.dueEventProcessingRequired,false);
assert.throws(()=>createDailyTickPlan({timeline,eventIndex}),e=>e.code==='INVALID_DAILY_TICK_PLAN');
assert.throws(()=>createDailyTickPlan({calendar,eventIndex}),e=>e.code==='INVALID_DAILY_TICK_PLAN');
assert.throws(()=>createDailyTickPlan({calendar,timeline}),e=>e.code==='INVALID_DAILY_TICK_PLAN');
console.log('Daily tick plan tests passed.');
