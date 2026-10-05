'use strict';
const assert=require('assert');
const {createMasterCalendar}=require('./hlm-master-calendar');
const {createSeasonPhaseTimeline}=require('./hlm-season-phase-timeline');
const {createCalendarEventIndex}=require('./hlm-calendar-event');
const {createDailyTickPlan}=require('./hlm-daily-tick-plan');
const {createDailyTickAuthorization,assertDailyTickAuthorized}=require('./hlm-daily-tick-authorization');

const calendar=createMasterCalendar({currentDate:'2027-04-17'});
const timeline=createSeasonPhaseTimeline({windows:[
 {phaseId:'regular-season',startDate:'2026-10-06',endDate:'2027-04-17'},
 {phaseId:'playoffs',startDate:'2027-04-18',endDate:'2027-06-20'}
]});
const eventIndex=createCalendarEventIndex({events:[{id:'game-1',type:'game',date:'2027-04-18',important:true}]});
const plan=createDailyTickPlan({calendar,timeline,eventIndex});
const authorization=createDailyTickAuthorization({plan,approved:true});
assert.strictEqual(authorization.kind,'daily-tick-authorization');assert.strictEqual(authorization.version,1);
assert.strictEqual(authorization.approved,true);assert.strictEqual(authorization.executed,false);
assert.strictEqual(authorization.fromDate,plan.fromDate);assert.strictEqual(authorization.toDate,plan.toDate);
assert.strictEqual(authorization.days,1);assert.strictEqual(authorization.plan,plan);
assert.strictEqual(authorization.calendarAuthorization.plan,plan.calendarPlan);
assert.strictEqual(assertDailyTickAuthorized(plan,authorization),true);
assert.strictEqual(Object.isFrozen(authorization),true);
assert.throws(()=>createDailyTickAuthorization({plan,approved:false}),e=>e.code==='DAILY_TICK_NOT_AUTHORIZED');
assert.throws(()=>assertDailyTickAuthorized({...plan},authorization),e=>e.code==='DAILY_TICK_NOT_AUTHORIZED');
assert.throws(()=>assertDailyTickAuthorized(plan,{...authorization,plan:{...plan}}),e=>e.code==='DAILY_TICK_NOT_AUTHORIZED');
assert.throws(()=>assertDailyTickAuthorized(plan,{...authorization,calendarAuthorization:{...authorization.calendarAuthorization,plan:{...plan.calendarPlan}}}),e=>e.code==='DAILY_TICK_NOT_AUTHORIZED');
assert.strictEqual(calendar.currentDate,'2027-04-17');
console.log('Daily tick authorization tests passed.');
