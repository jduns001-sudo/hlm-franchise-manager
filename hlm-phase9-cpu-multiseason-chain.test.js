'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {serializeGameState}=require('./hlm-game-state-serialization');
const {createSequentialCPUSeasonTransitionCandidates}=require('./hlm-phase9-cpu-multiseason-chain');
const state=createGameStateEnvelope({meta:{controlledTeamId:'PIT',currentDate:'2030-06-30'},teams:[{id:'PIT'},{id:'BUF'},{id:'NYR'}],players:[{id:'p1',teamId:'BUF'}]});
state.history.seasons.push({id:'2029-30',status:'completed',champion:'PIT'});
const fingerprint=serializeGameState(state);
const transitions=[
 {fromSeasonId:'2029-30',toSeasonId:'2030-31',nextDate:'2030-07-01'},
 {fromSeasonId:'2030-31',toSeasonId:'2031-32',nextDate:'2031-07-01',completedSeason:{seasonId:'2030-31',championTeamId:'NYR'}}
];
const result=createSequentialCPUSeasonTransitionCandidates(state,transitions);
assert.equal(result.candidateState.history.seasons.length,3);
assert.equal(result.candidateState.history.seasons[1].status,'completed');
assert.equal(result.candidateState.history.seasons[1].champion,'NYR');
assert.equal(result.candidateState.history.seasons[2].status,'active');
assert.equal(result.candidateState.meta.currentDate,'2031-07-01');
assert.equal(result.candidateState.meta.controlledTeamId,'PIT');
assert.equal(result.transitions.length,2);
assert.equal(result.persistencePerformed,false);
assert.equal(result.productionCPUExecutionEnabled,false);
assert.equal(serializeGameState(state),fingerprint);
assert.throws(()=>createSequentialCPUSeasonTransitionCandidates(state,[transitions[0],{...transitions[1],completedSeason:undefined}]),e=>e.code==='CPU_MULTI_SEASON_COMPLETION_REQUIRED');
assert.throws(()=>createSequentialCPUSeasonTransitionCandidates(state,[transitions[0],{...transitions[1],completedSeason:{seasonId:'2030-31',championTeamId:'MISSING'}}]),e=>e.code==='CPU_MULTI_SEASON_CHAMPION_UNKNOWN');
assert.throws(()=>createSequentialCPUSeasonTransitionCandidates(state,[transitions[0],{...transitions[1],nextDate:'2030-06-01'}]),e=>e.code==='CPU_SEASON_TRANSITION_DATE_ORDER');
assert.equal(serializeGameState(state),fingerprint);
console.log('Phase 9 sequential CPU multi-season candidate tests passed');
