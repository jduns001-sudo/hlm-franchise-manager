'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {executeControlledRosterGame:execute}=require('./hlm-phase10-controlled-roster-game');
const positions=['C','LW','RW','D','D','G'];
const players=[1,2].flatMap(teamId=>positions.map((position,i)=>({
 id:teamId*100+i,teamId,position,ovr:teamId===1?88:72
})));
const contracts=players.map(p=>({playerId:p.id,teamId:p.teamId,status:'Active'}));
const injuries=players.map(p=>({playerId:p.id,status:'Recovered'}));
const game={id:'G1',status:'scheduled',homeTeamId:1,awayTeamId:2};
const state=createGameStateEnvelope({
 teams:[{id:1,name:'Home'},{id:2,name:'Away'}],players,contracts,injuries,games:[game]
});
const before=JSON.stringify(state);
assert.throws(()=>execute(state,'G1',12),{code:'CONTROLLED_ROSTER_GAME_NOT_ENABLED'});
assert.throws(()=>execute(state,'G1',12,{experimental:true,persist:true}),{code:'CONTROLLED_ROSTER_GAME_NOT_ENABLED'});
const first=execute(state,'G1',12,{experimental:true});
assert.equal(first.applied,true);
assert.equal(first.official,false);
assert.equal(first.persistencePerformed,false);
assert.equal(first.nextState.activity.games[0].status,'final');
assert.equal(first.nextState.activity.games[0].official,false);
assert.equal(first.standings.reduce((n,t)=>n+t.gp,0),2);
assert.equal(JSON.stringify(state),before);
assert.deepEqual(first,execute(state,'G1',12,{experimental:true}));
assert.throws(()=>execute(first.nextState,'G1',12,{experimental:true}),{code:'INVALID_CONTROLLED_ROSTER_GAME'});
const blocked=createGameStateEnvelope({
 teams:[{id:1,name:'Home'},{id:2,name:'Away'}],players,contracts:[],injuries,games:[game]
});
const denied=execute(blocked,'G1',12,{experimental:true});
assert.equal(denied.applied,false);
assert.equal(denied.nextState,null);
assert(denied.blockers.length>0);
console.log('Mission 742 controlled roster game tests passed.');
