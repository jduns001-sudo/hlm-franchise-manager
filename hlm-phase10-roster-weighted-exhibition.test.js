'use strict';
const assert = require('node:assert/strict');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { simulateRosterWeightedExhibition: simulate } = require('./hlm-phase10-roster-weighted-exhibition');
const positions = ['C','LW','RW','D','D','G'];
const players = [1,2].flatMap(teamId => positions.map((position, i) => ({
  id: teamId * 100 + i, teamId, position, ovr: teamId === 1 ? 88 : 72
})));
const contracts = players.map(p => ({ playerId:p.id, teamId:p.teamId, status:'Active' }));
const injuries = players.map(p => ({ playerId:p.id, status:'Recovered' }));
const state = createGameStateEnvelope({
  teams:[{id:1,name:'Wolves'},{id:2,name:'Bears'}],players,contracts,injuries
});
const before = JSON.stringify(state);
const a = simulate(state,1,2,42);
assert.equal(a.playable,true);
assert.equal(a.official,false);
assert.equal(a.simulationAuthorized,false);
assert.equal(a.persistencePerformed,false);
assert.equal(a.sourceStateMutated,false);
assert.equal(a.rosterRating.home,88);
assert.equal(a.rosterRating.away,72);
assert.notEqual(a.score.homeGoals,a.score.awayGoals);
assert.deepEqual(a,simulate(state,1,2,42));
assert.equal(JSON.stringify(state),before);
const noContract = createGameStateEnvelope({
  teams:[{id:1,name:'Wolves'},{id:2,name:'Bears'}],players,contracts:[],injuries
});
const blocked = simulate(noContract,1,2,42);
assert.equal(blocked.playable,false);
assert.equal(blocked.score,null);
assert(blocked.blockers.length>0);
assert.throws(()=>simulate(state,1,2,-1),{code:'INVALID_ROSTER_EXHIBITION_SEED'});
assert.throws(()=>simulate(state,1,1,1),{code:'INVALID_PHASE10_MATCHUP_TEAM_IDS'});
console.log('Mission 739 roster-weighted exhibition tests passed.');
