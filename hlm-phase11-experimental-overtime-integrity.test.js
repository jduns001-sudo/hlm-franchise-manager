'use strict';
const assert=require('node:assert/strict');
const {simulateGameScore}=require('./hlm-phase10-game-simulator');
const {calculateStandings}=require('./hlm-phase10-standings');
const {applyScheduledGame}=require('./hlm-phase10-apply-game');
const {createGameStateEnvelope}=require('./hlm-game-state');
const matchup={gameId:'g1',homeTeamId:1,awayTeamId:2};
const scenarios=[
 {seed:0,side:'home',rating:92,winner:1,loser:2},
 {seed:3,side:'home',rating:60,winner:2,loser:1},
 {seed:3,side:'away',rating:92,winner:2,loser:1},
 {seed:0,side:'away',rating:60,winner:1,loser:2}
];
for(const {seed,side,rating,winner,loser} of scenarios){
 const input={...matchup,seed,experimentalApprovedGoalieSide:side,experimentalApprovedGoalieOverall:rating};
 const legacy=simulateGameScore({...matchup,seed});
 assert.equal(legacy.overtime,false,'baseline is a regulation decision');
 const result=simulateGameScore(input);
 assert.equal(result.overtime,true,'a goalie-rating-created tie must be decided in overtime');
 assert.equal(result.winnerTeamId,winner);
 assert.equal(result.experimentalRosterAware,true);assert.equal(result.official,false);
 assert.equal(Math.abs(result.homeGoals-result.awayGoals),1);
 assert.deepEqual(simulateGameScore(input),result,'same input must replay exactly');
 assert.deepEqual(simulateGameScore({...matchup,seed}),legacy,'opt-in must not alter legacy replay');
 const table=calculateStandings([{id:1},{id:2}],[result]);
 assert.equal(table.find(t=>t.teamId===winner).points,2);
 assert.equal(table.find(t=>t.teamId===loser).otl,1);
 assert.equal(table.find(t=>t.teamId===loser).points,1);
 const players=[{id:11,teamId:1,position:'G',overall:side==='home'?rating:80},{id:21,teamId:2,position:'G',overall:side==='away'?rating:80}];
 const state=createGameStateEnvelope({meta:{controlledTeamId:side==='home'?1:2,currentDate:'2026-10-18'},teams:[{id:1},{id:2}],games:[{id:'g1',homeTeamId:1,awayTeamId:2,date:'2026-10-19',status:'scheduled'}],players});
 state.extensions.phase11GmGoaliePlan={teamId:side==='home'?1:2,playerId:side==='home'?11:21};
 const original=JSON.stringify(state);
 const applied=applyScheduledGame(state,'g1',seed,{experimentalRosterAware:true});
 assert.deepEqual(applied.result,result);
 assert.equal(JSON.stringify(state),original,'pure game application must not write caller state');
 assert.equal(applied.nextState.activity.games[0].overtime,true);
}
for(let seed=0;seed<200;seed++){
 const legacy=simulateGameScore({...matchup,seed});
 const result=simulateGameScore({...matchup,seed,experimentalApprovedGoalieSide:'home',experimentalApprovedGoalieOverall:92});
 assert.notEqual(result.homeGoals,result.awayGoals);
 assert.equal(result.winnerTeamId,result.homeGoals>result.awayGoals?1:2);
 assert.ok(result.homeGoals>=0&&result.awayGoals>=0);
 assert.equal(result.experimentalRosterAware,true);
 assert.deepEqual(simulateGameScore({...matchup,seed}),legacy);
}
console.log('Mission 1371: regulation-to-OT rating adjustments, standings OTL, home/away, replay and pure game application pass');
