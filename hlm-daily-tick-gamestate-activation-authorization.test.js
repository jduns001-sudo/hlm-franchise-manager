'use strict';
const assert=require('assert');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createMasterCalendar}=require('./hlm-master-calendar');
const {createSeasonPhaseTimeline}=require('./hlm-season-phase-timeline');
const {createCalendarEventIndex}=require('./hlm-calendar-event');
const {createDailyTickPlan}=require('./hlm-daily-tick-plan');
const {createDailyTickAuthorization}=require('./hlm-daily-tick-authorization');
const {executeIsolatedDailyTickCalendar}=require('./hlm-daily-tick-calendar-execution');
const {verifyDailyTickCalendarExecution}=require('./hlm-daily-tick-calendar-verification');
const {createDailyTickGameStateCalendarCandidate}=require('./hlm-daily-tick-gamestate-candidate');
const {verifyDailyTickGameStateCalendarCandidate}=require('./hlm-daily-tick-gamestate-candidate-verification');
const {createDailyTickGameStateCalendarActivationAuthorization,assertDailyTickGameStateCalendarActivationAuthorized}=require('./hlm-daily-tick-gamestate-activation-authorization');

const state=createGameStateEnvelope({meta:{currentDate:'2027-04-17',controlledTeamId:'PIT'},players:[{id:'p1',name:'Player One'}]});
const calendar=createMasterCalendar({currentDate:state.meta.currentDate});
const timeline=createSeasonPhaseTimeline({windows:[
 {phaseId:'regular-season',startDate:'2026-10-06',endDate:'2027-04-17'},
 {phaseId:'playoffs',startDate:'2027-04-18',endDate:'2027-06-20'}
]});
const eventIndex=createCalendarEventIndex({events:[{id:'game-1',type:'game',date:'2027-04-18',important:true}]});
const plan=createDailyTickPlan({calendar,timeline,eventIndex});
const tickAuthorization=createDailyTickAuthorization({plan,approved:true});
const result=executeIsolatedDailyTickCalendar({calendar,plan,authorization:tickAuthorization});
const calendarVerification=verifyDailyTickCalendarExecution({sourceCalendar:calendar,plan,authorization:tickAuthorization,result});
const candidate=createDailyTickGameStateCalendarCandidate({state,verification:calendarVerification});
const verification=verifyDailyTickGameStateCalendarCandidate({sourceState:state,candidate});
const authorization=createDailyTickGameStateCalendarActivationAuthorization({verification,approved:true});
assert.strictEqual(authorization.kind,'daily-tick-gamestate-calendar-activation-authorization');assert.strictEqual(authorization.version,1);
assert.strictEqual(authorization.approved,true);assert.strictEqual(authorization.activated,false);
assert.strictEqual(authorization.fromDate,'2027-04-17');assert.strictEqual(authorization.toDate,'2027-04-18');assert.strictEqual(authorization.days,1);
assert.strictEqual(authorization.verification,verification);
assert.strictEqual(assertDailyTickGameStateCalendarActivationAuthorized(verification,authorization),true);
assert.strictEqual(Object.isFrozen(authorization),true);
assert.strictEqual(state.meta.currentDate,'2027-04-17');assert.strictEqual(candidate.state.meta.currentDate,'2027-04-18');
assert.throws(()=>createDailyTickGameStateCalendarActivationAuthorization({verification,approved:false}),e=>e.code==='DAILY_TICK_GAMESTATE_CALENDAR_ACTIVATION_NOT_AUTHORIZED');
assert.throws(()=>assertDailyTickGameStateCalendarActivationAuthorized(verification,{...authorization,verification:{...verification}}),e=>e.code==='DAILY_TICK_GAMESTATE_CALENDAR_ACTIVATION_NOT_AUTHORIZED');
assert.throws(()=>createDailyTickGameStateCalendarActivationAuthorization({verification:{...verification,eventsUnprocessed:false},approved:true}),e=>e.code==='DAILY_TICK_GAMESTATE_CALENDAR_ACTIVATION_NOT_AUTHORIZED');
console.log('Daily tick GameState calendar activation authorization tests passed.');
