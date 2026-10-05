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

const sourceState=createGameStateEnvelope({meta:{currentDate:'2027-04-17',controlledTeamId:'PIT'},players:[{id:'p1',name:'Player One'}]});
const calendar=createMasterCalendar({currentDate:sourceState.meta.currentDate});
const timeline=createSeasonPhaseTimeline({windows:[
 {phaseId:'regular-season',startDate:'2026-10-06',endDate:'2027-04-17'},
 {phaseId:'playoffs',startDate:'2027-04-18',endDate:'2027-06-20'}
]});
const eventIndex=createCalendarEventIndex({events:[{id:'game-1',type:'game',date:'2027-04-18',important:true}]});
const plan=createDailyTickPlan({calendar,timeline,eventIndex});
const authorization=createDailyTickAuthorization({plan,approved:true});
const result=executeIsolatedDailyTickCalendar({calendar,plan,authorization});
const calendarVerification=verifyDailyTickCalendarExecution({sourceCalendar:calendar,plan,authorization,result});
const candidate=createDailyTickGameStateCalendarCandidate({state:sourceState,verification:calendarVerification});
const verification=verifyDailyTickGameStateCalendarCandidate({sourceState,candidate});
assert.strictEqual(verification.kind,'daily-tick-gamestate-calendar-candidate-verification');assert.strictEqual(verification.version,1);
assert.strictEqual(verification.verified,true);assert.strictEqual(verification.dateOnlyChangeVerified,true);
assert.strictEqual(verification.exactlyOneDayVerified,true);assert.strictEqual(verification.sourceStatePreserved,true);
assert.strictEqual(verification.eventsUnprocessed,true);assert.strictEqual(verification.gameSimulationPerformed,false);
assert.strictEqual(verification.universeSystemsProcessed,false);assert.strictEqual(verification.persistencePerformed,false);
assert.strictEqual(verification.fromDate,'2027-04-17');assert.strictEqual(verification.toDate,'2027-04-18');assert.strictEqual(verification.days,1);
assert.strictEqual(verification.sourceState,sourceState);assert.strictEqual(verification.candidate,candidate);
assert.strictEqual(verification.state,candidate.state);assert.strictEqual(verification.state.meta.currentDate,'2027-04-18');
assert.strictEqual(sourceState.meta.currentDate,'2027-04-17');
assert.deepStrictEqual(verification.state.universe.players,sourceState.universe.players);
assert.strictEqual(Object.isFrozen(verification),true);
assert.throws(()=>verifyDailyTickGameStateCalendarCandidate({sourceState,candidate:{...candidate,days:2}}),e=>e.code==='DAILY_TICK_GAMESTATE_CALENDAR_CANDIDATE_VERIFICATION_FAILED');
assert.throws(()=>verifyDailyTickGameStateCalendarCandidate({sourceState,candidate:{...candidate,eventsProcessed:true}}),e=>e.code==='DAILY_TICK_GAMESTATE_CALENDAR_CANDIDATE_VERIFICATION_FAILED');
assert.throws(()=>verifyDailyTickGameStateCalendarCandidate({sourceState:createGameStateEnvelope({meta:{currentDate:'2027-04-16'}}),candidate}),e=>e.code==='DAILY_TICK_GAMESTATE_CALENDAR_CANDIDATE_VERIFICATION_FAILED');
assert.throws(()=>verifyDailyTickGameStateCalendarCandidate({sourceState,candidate:{...candidate,state:createGameStateEnvelope({meta:{currentDate:'2027-04-18'}})}}),e=>e.code==='DAILY_TICK_GAMESTATE_CALENDAR_CANDIDATE_VERIFICATION_FAILED');
console.log('Daily tick GameState calendar candidate verification tests passed.');
