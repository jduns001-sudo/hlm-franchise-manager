'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {serializeGameState}=require('./hlm-game-state-serialization');
const {createSequentialCPUSeasonTransitionCandidates}=require('./hlm-phase9-cpu-multiseason-chain');
const state=createGameStateEnvelope({meta:{controlledTeamId:'PIT',currentDate:'2030-06-30'},teams:[{id:'PIT'},{id:'NYR'}]});
state.history.seasons.push({id:'2029-30',status:'completed',champion:'PIT'});
const steps=[{fromSeasonId:'2029-30',toSeasonId:'2030-31',nextDate:'2030-07-01'},
 {fromSeasonId:'2030-31',toSeasonId:'2031-32',nextDate:'2031-07-01',completedSeason:{seasonId:'2030-31',championTeamId:'NYR',completedAt:'2031-06-30'}}];
const original=serializeGameState(state);
const candidate=createSequentialCPUSeasonTransitionCandidates(state,steps).candidateState;
assert.equal(candidate.history.seasons[1].completedAt,'2031-06-30');
assert.equal(candidate.history.seasons[1].champion,'NYR');
assert.equal(candidate.history.seasons[2].status,'active');
assert.equal(serializeGameState(state),original);
for(const bad of ['2031-07-01','2030-06-30','2031-02-30','not-a-date']){
 const altered=[steps[0],{...steps[1],completedSeason:{...steps[1].completedSeason,completedAt:bad}}];
 assert.throws(()=>createSequentialCPUSeasonTransitionCandidates(state,altered),e=>e.code==='CPU_MULTI_SEASON_COMPLETION_DATE');
}
assert.equal(serializeGameState(state),original);
console.log('Phase 9 CPU season completion date evidence tests passed');
