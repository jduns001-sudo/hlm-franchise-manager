'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {simulateRosterDayWithGoalStats:simulate}=require('./hlm-phase10-roster-day-with-stats');
const positions=['C','LW','RW','D','D','G'];
const players=[1,2].flatMap(teamId=>positions.map((position,i)=>({id:teamId*100+i,teamId,position,ovr:78})));
const contracts=players.map(p=>({playerId:p.id,teamId:p.teamId,status:'Active'}));
const injuries=players.map(p=>({playerId:p.id,status:'Recovered'}));
const state=createGameStateEnvelope({meta:{currentDate:'2026-10-13'},teams:[{id:1,name:'A'},{id:2,name:'B'}],players,contracts,injuries,games:[
 {id:'G1',date:'2026-10-14',status:'scheduled',homeTeamId:1,awayTeamId:2},
 {id:'G2',date:'2026-10-15',status:'scheduled',homeTeamId:2,awayTeamId:1}
]});
const before=JSON.stringify(state);
const first=simulate(state,4,{experimental:true});
assert(first.advanced);
const goals=first.results.reduce((n,g)=>n+g.homeGoals+g.awayGoals,0);
assert.equal(first.goalEvents.length,goals);
assert.equal(first.goalLeaders.reduce((n,p)=>n+p.goals,0),goals);
const second=simulate(first.nextState,5,{experimental:true});
assert(second.advanced);
assert.equal(second.nextState.extensions.phase10ExperimentalGoalEvents.length,second.goalEvents.length+first.goalEvents.length);
assert.equal(JSON.stringify(state),before);
const blocked=createGameStateEnvelope({meta:{currentDate:'2026-10-13'},teams:[{id:1,name:'A'},{id:2,name:'B'}],players,contracts:[],injuries,games:[{id:'G1',date:'2026-10-14',status:'scheduled',homeTeamId:1,awayTeamId:2}]});
const denied=simulate(blocked,4,{experimental:true});
assert.equal(denied.advanced,false);assert.equal(denied.nextState,null);
console.log('Mission 749 experimental player goal persistence tests passed.');
