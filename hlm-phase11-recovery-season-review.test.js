'use strict';const assert=require('node:assert/strict');const {review}=require('./hlm-phase11-recovery-season-review');const {exportCheckpoint,previewRestore}=require('./hlm-phase11-isolated-recovery');const {simulateGameScore}=require('./hlm-phase10-game-simulator');
const game={id:'g1',date:'2026-10-18',homeTeamId:1,awayTeamId:2,status:'scheduled'};
const state={meta:{controlledTeamId:1,currentDate:'2026-10-18'},universe:{teams:[{id:1,name:'Portland'},{id:2,name:'Seattle'}],players:[{id:7,teamId:1,name:'Skater'}]},activity:{games:[game]},privateNotes:'SECRET'};
const before=review(state,[7]);assert.equal(before.pending,1);assert.equal(before.completed,0);assert.equal(before.selectedLineupCount,1);assert.equal(before.automaticSimulation,false);
const score=simulateGameScore({gameId:'g1',homeTeamId:1,awayTeamId:2,seed:1314});
const progressed={...state,activity:{games:[{...game,status:'final',homeGoals:score.homeGoals,awayGoals:score.awayGoals}]}};
const after=review(previewRestore(exportCheckpoint(progressed)).state,[7]);assert.equal(after.completed,1);assert.equal(after.pending,0);assert.equal(after.standings.reduce((n,t)=>n+t.played,0),2);assert.equal(after.productionWrite,false);assert.equal(after.finalDecisionMaker,'human-gm');
assert.throws(()=>review(state,[7,7]),/lineup/);assert.throws(()=>review(state,[99]),/lineup/);assert.equal(JSON.stringify(after).includes('SECRET'),false);assert.deepEqual(after,review(previewRestore(exportCheckpoint(progressed)).state,[7]));
console.log('Isolated season continuity standings and lineup regression passed');
