'use strict';
const assert = require('node:assert/strict');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { assessRosterSeasonSimulationIntegration: assess } = require('./hlm-phase10-roster-season-integration-assessment');
const positions=['C','LW','RW','D','D','G'];
const players=[1,2].flatMap(teamId=>positions.map((position,i)=>({
  id:teamId*100+i,teamId,position,ovr:teamId===1?85:75
})));
const contracts=players.map(p=>({playerId:p.id,teamId:p.teamId,status:'Active'}));
const injuries=players.map(p=>({playerId:p.id,status:'Recovered'}));
const state=createGameStateEnvelope({
  teams:[{id:1,name:'Home'},{id:2,name:'Away'}],players,contracts,injuries,
  games:[{id:'G1',status:'scheduled',homeTeamId:1,awayTeamId:2}]
});
const before=JSON.stringify(state);
const a=assess(state,'G1',11);
assert.equal(a.exhibition.playable,true);
assert.equal(a.exhibition.rosterRating.home,85);
assert.equal(a.exhibition.rosterRating.away,75);
assert.equal(a.standingsBefore[0].gp,0);
assert.equal(a.canApplyOfficialResult,false);
assert.equal(a.officialGameResult,null);
assert.deepEqual(a.blockers,['OFFICIAL_AUTHORIZATION_NOT_IMPLEMENTED']);
assert.deepEqual(a,assess(state,'G1',11));
assert.equal(JSON.stringify(state),before);
assert.throws(()=>assess(state,'missing',11),{code:'INVALID_ROSTER_INTEGRATION_GAME'});
const blocked=createGameStateEnvelope({
  teams:[{id:1,name:'Home'},{id:2,name:'Away'}],players,contracts:[],injuries,
  games:[{id:'G1',status:'scheduled',homeTeamId:1,awayTeamId:2}]
});
assert.equal(assess(blocked,'G1',11).exhibition.playable,false);
assert.equal(assess(blocked,'G1',11).officialGameResult,null);
console.log('Mission 741 roster season integration assessment tests passed.');
