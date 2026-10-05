'use strict';
const assert=require('assert');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createMasterCalendar}=require('./hlm-master-calendar');
const {createSeasonPhaseTimeline}=require('./hlm-season-phase-timeline');
const {createCalendarEventIndex}=require('./hlm-calendar-event');
const {createNextGameCalendarAdvancementPlan}=require('./hlm-calendar-next-game-advancement-plan');
const {createNextGameCalendarAdvancementAuthorization}=require('./hlm-calendar-next-game-advancement-authorization');
const {executeIsolatedNextGameCalendarAdvancement}=require('./hlm-calendar-next-game-advancement-execution');
const {verifyNextGameCalendarAdvancement}=require('./hlm-calendar-next-game-advancement-verification');
const {createNextGameGameStateCalendarCandidate}=require('./hlm-calendar-next-game-gamestate-candidate');
const state=createGameStateEnvelope({meta:{currentDate:'2027-03-03',controlledTeamId:'PIT'},players:[{id:'p1',name:'Player One'}]});
const calendar=createMasterCalendar({currentDate:state.meta.currentDate});
const timeline=createSeasonPhaseTimeline({windows:[{phaseId:'regular-season',startDate:'2027-03-01',endDate:'2027-03-10'}]});
const eventIndex=createCalendarEventIndex({events:[
 {id:'scout',type:'scouting-update',date:'2027-03-04'},
 {id:'game-1',type:'game',date:'2027-03-05',important:true}
]});
const plan=createNextGameCalendarAdvancementPlan({calendar,timeline,eventIndex});
const authorization=createNextGameCalendarAdvancementAuthorization({plan,approved:true});
const result=executeIsolatedNextGameCalendarAdvancement({calendar,plan,authorization});
const verification=verifyNextGameCalendarAdvancement({plan,authorization,result});
const candidate=createNextGameGameStateCalendarCandidate({state,verification});
assert.strictEqual(candidate.kind,'next-game-gamestate-calendar-candidate');assert.strictEqual(candidate.version,1);
assert.strictEqual(candidate.fromDate,'2027-03-03');assert.strictEqual(candidate.toDate,'2027-03-05');
assert.strictEqual(candidate.targetGame,verification.targetGame);assert.strictEqual(candidate.targetGame.type,'game');
assert.strictEqual(candidate.verification,verification);assert.strictEqual(candidate.state,candidate.calendarCandidate.state);
assert.strictEqual(candidate.state.meta.currentDate,'2027-03-05');assert.strictEqual(candidate.state.meta.controlledTeamId,'PIT');
assert.deepStrictEqual(candidate.state.universe.players,state.universe.players);assert.strictEqual(state.meta.currentDate,'2027-03-03');
assert.strictEqual(Object.isFrozen(candidate),true);
assert.throws(()=>createNextGameGameStateCalendarCandidate({state,verification:{...verification,verified:false}}),e=>e.code==='INVALID_NEXT_GAME_GAMESTATE_CALENDAR_CANDIDATE');
assert.throws(()=>createNextGameGameStateCalendarCandidate({state:createGameStateEnvelope({meta:{currentDate:'2027-03-04'}}),verification}),e=>e.code==='INVALID_NEXT_GAME_GAMESTATE_CALENDAR_CANDIDATE');
assert.throws(()=>createNextGameGameStateCalendarCandidate({state,verification:{...verification,targetGame:{...verification.targetGame,date:'2027-03-06'}}}),e=>e.code==='INVALID_NEXT_GAME_GAMESTATE_CALENDAR_CANDIDATE');
assert.throws(()=>createNextGameGameStateCalendarCandidate({state,verification:{...verification,targetGame:{...verification.targetGame,type:'news'}}}),e=>e.code==='INVALID_NEXT_GAME_GAMESTATE_CALENDAR_CANDIDATE');
console.log('Next-game GameState calendar candidate tests passed.');
