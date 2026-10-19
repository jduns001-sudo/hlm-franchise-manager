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
assert.equal(first.boxScores.length,1);
for(const box of first.boxScores){for(const side of ['home','away']){const team=box[side];assert.equal(team.players.reduce((n,p)=>n+p.goals,0),team.goals);assert.equal(team.players.reduce((n,p)=>n+p.shots,0),team.shots);assert(team.players.every(p=>p.points===p.goals+p.assists&&p.shots>=p.goals));assert.equal(team.goalie.saves+team.goalie.goalsAgainst,team.goalie.shotsAgainst);}}
assert.equal(first.boxScores[0].official,false);
const goals=first.results.reduce((n,g)=>n+g.homeGoals+g.awayGoals,0);
assert.equal(first.goalEvents.length,goals);
assert.equal(first.goalLeaders.reduce((n,p)=>n+p.goals,0),goals);
const second=simulate(first.nextState,5,{experimental:true});
assert(second.advanced);
assert.equal(second.nextState.extensions.phase11ExperimentalBoxScores.length,2);
assert.deepEqual(JSON.parse(JSON.stringify(second.nextState)).extensions.phase11ExperimentalBoxScores,second.nextState.extensions.phase11ExperimentalBoxScores);
assert.equal(second.nextState.extensions.phase10ExperimentalGoalEvents.length,second.goalEvents.length+first.goalEvents.length);
assert.equal(JSON.stringify(state),before);
const blocked=createGameStateEnvelope({meta:{currentDate:'2026-10-13'},teams:[{id:1,name:'A'},{id:2,name:'B'}],players,contracts:[],injuries,games:[{id:'G1',date:'2026-10-14',status:'scheduled',homeTeamId:1,awayTeamId:2}]});
const denied=simulate(blocked,4,{experimental:true});
assert.equal(denied.advanced,false);assert.equal(denied.nextState,null);
console.log('Mission 749 experimental player goal persistence tests passed.');
