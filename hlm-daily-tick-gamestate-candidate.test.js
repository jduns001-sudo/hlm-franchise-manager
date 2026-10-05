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

const sourceState=createGameStateEnvelope({meta:{currentDate:'2027-04-17',controlledTeamId:'PIT'},players:[{id:'p1',name:'Player One'}]});
const calendar=createMasterCalendar({currentDate:'2027-04-17'});
const timeline=createSeasonPhaseTimeline({windows:[
 {phaseId:'regular-season',startDate:'2026-10-06',endDate:'2027-04-17'},
 {phaseId:'playoffs',startDate:'2027-04-18',endDate:'2027-06-20'}
]});
const eventIndex=createCalendarEventIndex({events:[{id:'game-1',type:'game',date:'2027-04-18',important:true}]});
const plan=createDailyTickPlan({calendar,timeline,eventIndex});
const authorization=createDailyTickAuthorization({plan,approved:true});
const result=executeIsolatedDailyTickCalendar({calendar,plan,authorization});
const verification=verifyDailyTickCalendarExecution({sourceCalendar:calendar,plan,authorization,result});
const candidate=createDailyTickGameStateCalendarCandidate({state:sourceState,verification});
assert.strictEqual(candidate.kind,'daily-tick-gamestate-calendar-candidate');assert.strictEqual(candidate.version,1);
assert.strictEqual(candidate.fromDate,'2027-04-17');assert.strictEqual(candidate.toDate,'2027-04-18');assert.strictEqual(candidate.days,1);
assert.strictEqual(candidate.verification,verification);assert.strictEqual(candidate.calendarCandidate.verification,verification.advancementVerification);
assert.strictEqual(candidate.state.meta.currentDate,'2027-04-18');assert.strictEqual(sourceState.meta.currentDate,'2027-04-17');
assert.strictEqual(candidate.state.meta.controlledTeamId,'PIT');assert.deepStrictEqual(candidate.state.universe.players,sourceState.universe.players);
assert.strictEqual(candidate.eventsProcessed,false);assert.strictEqual(candidate.gameSimulationPerformed,false);
assert.strictEqual(candidate.universeSystemsProcessed,false);assert.strictEqual(candidate.persistencePerformed,false);
assert.strictEqual(Object.isFrozen(candidate),true);
assert.throws(()=>createDailyTickGameStateCalendarCandidate({state:sourceState,verification:{...verification,verified:false}}),e=>e.code==='INVALID_DAILY_TICK_GAMESTATE_CALENDAR_CANDIDATE');
assert.throws(()=>createDailyTickGameStateCalendarCandidate({state:createGameStateEnvelope({meta:{currentDate:'2027-04-16'}}),verification}),e=>e.code==='INVALID_DAILY_TICK_GAMESTATE_CALENDAR_CANDIDATE');
assert.throws(()=>createDailyTickGameStateCalendarCandidate({state:sourceState,verification:{...verification,eventsUnprocessed:false}}),e=>e.code==='INVALID_DAILY_TICK_GAMESTATE_CALENDAR_CANDIDATE');
console.log('Daily tick GameState calendar candidate tests passed.');
