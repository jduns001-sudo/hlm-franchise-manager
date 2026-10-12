'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {finalizeChampionshipSeason}=require('./hlm-phase10-season-finalization');
const state=createGameStateEnvelope({
  meta:{saveId:'finalize-test',currentDate:'2027-06-20',controlledTeamId:1},
  teams:[{id:1,name:'Wolves'},{id:2,name:'Falcons'}],
  games:[{id:'g1',status:'final',homeTeamId:1,awayTeamId:2,homeGoals:3,awayGoals:1,overtime:false}]
});
state.extensions.phase10Playoffs={status:'complete',championTeamId:1,rounds:[[{status:'complete',winnerTeamId:1,games:[]}]]};
const before=JSON.stringify(state);
const {nextState,summary}=finalizeChampionshipSeason(state,'2026-27');
assert.equal(summary.seasonId,'2026-27');
assert.equal(summary.championTeamId,1);
assert.equal(summary.completedDate,'2027-06-20');
assert.equal(summary.regularSeasonGames,1);
assert.equal(summary.playoffRoundCount,1);
assert.equal(summary.standingsCount,2);
assert.equal(summary.archivedSeasonCount,1);
assert.equal(nextState.history.seasons[0].seasonId,'2026-27');
assert.equal(JSON.stringify(state),before);
assert.throws(()=>finalizeChampionshipSeason(nextState,'2026-27'),/already archived/);
const incomplete=JSON.parse(before);
incomplete.extensions.phase10Playoffs.status='active';
assert.throws(()=>finalizeChampionshipSeason(incomplete,'2026-27'),/not complete/);
const unplayed=JSON.parse(before);
unplayed.activity.games[0].status='scheduled';
assert.throws(()=>finalizeChampionshipSeason(unplayed,'2026-27'),/Regular season/);
assert.throws(()=>finalizeChampionshipSeason(state,''),/Season ID/);
console.log('Phase 10 championship finalization tests passed');
