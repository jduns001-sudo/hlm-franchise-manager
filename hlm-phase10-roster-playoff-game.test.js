'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createPlayoffBracket}=require('./hlm-phase10-playoff-bracket');
const {simulateExperimentalRosterPlayoffGame:simulate}=require('./hlm-phase10-roster-playoff-game');
const positions=['C','LW','RW','D','D','G'];
const players=[1,2].flatMap(teamId=>positions.map((position,i)=>({id:teamId*100+i,teamId,position,ovr:teamId===1?84:77})));
const contracts=players.map(p=>({playerId:p.id,teamId:p.teamId,status:'Active'}));
const injuries=players.map(p=>({playerId:p.id,status:'Recovered'}));
const bracket=createPlayoffBracket([{seed:1,teamId:1},{seed:2,teamId:2}],7);
const state=createGameStateEnvelope({teams:[{id:1,name:'A'},{id:2,name:'B'}],players,contracts,injuries,extensions:{phase10Playoffs:bracket}});
const before=JSON.stringify(state);
const first=simulate(state,12);
assert(first.advanced);assert.equal(first.result.status,'final');assert.equal(first.official,false);
assert.equal(JSON.stringify(state),before);
assert.deepEqual(first,simulate(state,12));
let current=state,count=0;
while(current.extensions.phase10Playoffs.status==='active'&&count<7){
 const next=simulate(current,count+1);assert(next.advanced);current=next.nextState;count++;
}
assert.equal(current.extensions.phase10Playoffs.status,'complete');
assert([1,2].includes(current.extensions.phase10Playoffs.championTeamId));
assert(count>=4&&count<=7);
const denied=createGameStateEnvelope({teams:[{id:1,name:'A'},{id:2,name:'B'}],players,contracts:[],injuries,extensions:{phase10Playoffs:bracket}});
const blocked=simulate(denied,12);
assert.equal(blocked.advanced,false);assert.equal(blocked.nextState,null);
console.log('Mission 750 roster playoff tests passed.');
