'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {serializeGameState}=require('./hlm-game-state-serialization');
const {createCPUSeasonTransitionCandidate}=require('./hlm-phase9-cpu-season-transition-candidate');
const source=createGameStateEnvelope({meta:{controlledTeamId:'PIT',currentDate:'2030-06-30'},teams:[{id:'PIT'},{id:'NYR'}]});
source.history.seasons.push({id:'2029-30',status:'completed',champion:'NYR',completedAt:'2030-06-29'});
const args={fromSeasonId:'2029-30',toSeasonId:'2030-31',nextDate:'2030-07-01'};
const before=serializeGameState(source);
assert.equal(createCPUSeasonTransitionCandidate(source,args).candidateState.history.seasons[1].status,'active');
for(const bad of ['2030-07-01','2030-07-02','2030-02-30','invalid']){
 const state=JSON.parse(JSON.stringify(source));
 state.history.seasons[0].completedAt=bad;
 assert.throws(()=>createCPUSeasonTransitionCandidate(state,args),e=>e.code==='CPU_SEASON_TRANSITION_COMPLETION_CHRONOLOGY');
}
assert.equal(serializeGameState(source),before);
console.log('Phase 9 CPU transition history chronology tests passed');
