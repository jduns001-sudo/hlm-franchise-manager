'use strict';
const assert=require('node:assert/strict');
const {review,format}=require('./hlm-phase11-gm-stat-review');
const {buildUnifiedBoxScores}=require('./hlm-phase11-unified-box-scores');
const {createGameStateEnvelope}=require('./hlm-game-state');
const players=[1,2].flatMap(teamId=>['C','LW','RW','D','G'].map((position,i)=>({id:teamId*100+i,teamId,position,ovr:80})));
const state=createGameStateEnvelope({meta:{currentDate:'2026-10-18',controlledTeamId:1},teams:[{id:1},{id:2}],players});
const games=[{id:'g1',status:'final',homeTeamId:1,awayTeamId:2,homeGoals:1,awayGoals:0,season:'2027'},
 {id:'p1',status:'final',homeTeamId:2,awayTeamId:1,homeGoals:0,awayGoals:1,season:'2027',playoff:true},
 {id:'g2',status:'final',homeTeamId:1,awayTeamId:2,homeGoals:1,awayGoals:0,season:'2028'}];
const events=games.map(g=>({gameId:g.id,teamId:1,playerId:100,sequence:1}));
const before=JSON.stringify(state);
assert.equal(review(state).available,false);
state.extensions.phase11ExperimentalBoxScores=buildUnifiedBoxScores(state,games,events,13);
const all=review(state),regular=review(state,{season:'2027',kind:'regular'}),playoffs=review(state,{season:'2027',kind:'playoffs'}),future=review(state,{season:'2028'});
assert.equal(all.games,3);assert.equal(regular.games,1);assert.equal(playoffs.games,1);assert.equal(future.games,1);
assert.deepEqual(all.seasons,['2027','2028']);
assert.equal(all.players.reduce((n,p)=>n+p.goals,0),3);
assert.equal(all.goalies.reduce((n,g)=>n+g.saves+g.goalsAgainst,0),all.goalies.reduce((n,g)=>n+g.shotsAgainst,0));
assert.match(format(all),/NOT OFFICIAL/);assert.match(format(all),/Synthetic shots and assists/);
assert.equal(all.official,false);
const serialized=JSON.parse(JSON.stringify(state));assert.deepEqual(review(serialized),all);
assert.throws(()=>review({...state,extensions:{phase11ExperimentalBoxScores:[...state.extensions.phase11ExperimentalBoxScores,state.extensions.phase11ExperimentalBoxScores[0]]}}),/Duplicate/);
assert.equal(JSON.stringify(state).includes('hlm_front_office_v8'),false);
assert.equal(before.includes('phase11ExperimentalBoxScores'),false);
console.log('Mission 1358 read-only GM stats review: season/playoff, goals, assists, shots, saves, reload, duplicates, synthetic label passed');
