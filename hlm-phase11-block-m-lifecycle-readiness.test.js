'use strict';
const assert=require('node:assert/strict');
const {test}=require('node:test');
const {calculateStandings}=require('./hlm-phase10-standings');
const {inspectCommittedLifecycle}=require('./hlm-phase11-block-m-lifecycle-readiness');
const teams=[{id:'A',name:'Alpha'},{id:'B',name:'Beta'}];
const final={id:'G1',home:'A',away:'B',status:'final',homeGoals:3,awayGoals:2,overtime:true};
function row(games){return {revision:7,game_state_json:JSON.stringify({
 universe:{teams},season:{id:'SYNTHETIC-2026',games,
 standings:calculateStandings(teams,games.filter(g=>g.status==='final').map(g=>({...g,homeTeamId:g.home,awayTeamId:g.away}))),
 completedDayDecisions:['SYNTHETIC-DAY-18']},
 history:{seasons:[]},extensions:{phase10Playoffs:{status:'complete',championTeamId:'A'}}})};}
test('scheduled games block archival, offseason and next season',()=>{
 const source=row([final,{id:'G2',home:'B',away:'A',status:'scheduled'}]);
 const before=source.game_state_json,view=inspectCommittedLifecycle(source);
 assert.equal(view.pending,1);assert.equal(view.finals,1);
 assert.equal(view.archive.ready,false);assert.equal(view.offseason.ready,false);
 assert.equal(view.nextSeason.ready,false);assert.equal(view.saved,false);
 assert.equal(source.game_state_json,before);
});
test('all finals still do not invent verified championship from untrusted extension',()=>{
 const source=row([final]);const view=inspectCommittedLifecycle(source);
 assert.equal(view.status,'regular-season-finals-recorded');
 assert.equal(view.archive.reason,'invalid-playoff-evidence');
 assert.equal(view.playoffEvidence.verified,false);
 assert.equal(view.playoffEvidence.championTeamId,null);
 assert.equal(view.archive.ready,false);
 assert.equal(view.requiresGMApproval,true);
 assert.equal(view.finalDecisionMaker,'human-gm');
 assert.equal(view.official,false);
});
test('bad committed standings are rejected without lifecycle authorization',()=>{
 const source=row([final]),state=JSON.parse(source.game_state_json);
 state.season.standings[0].points=999;source.game_state_json=JSON.stringify(state);
 assert.throws(()=>inspectCommittedLifecycle(source),/standings disagree/);
});

test('replayable Phase 10 bracket is not automatically authoritative settlement evidence',()=>{
 const {createPlayoffBracket,recordBracketGame}=require('./hlm-phase10-playoff-bracket');
 let bracket=createPlayoffBracket([{seed:1,teamId:'A'},{seed:2,teamId:'B'}],1);
 bracket=recordBracketGame(bracket,0,{gameId:'P1',status:'final',homeTeamId:'A',awayTeamId:'B',winnerTeamId:'A'});
 const source=row([final]),state=JSON.parse(source.game_state_json);
 state.extensions.phase10Playoffs=bracket;source.game_state_json=JSON.stringify(state);
 const view=inspectCommittedLifecycle(source);
 assert.equal(view.playoffEvidence.replayConsistent,true);
 assert.equal(view.playoffEvidence.verified,false);
 assert.equal(view.playoffEvidence.championTeamId,null);
 assert.equal(view.archive.ready,false);
 assert.equal(view.offseason.ready,false);
 assert.equal(view.nextSeason.ready,false);
});
test('forged champion or extra playoff games cannot authorize archival',()=>{
 const {createPlayoffBracket,recordBracketGame}=require('./hlm-phase10-playoff-bracket');
 let bracket=createPlayoffBracket([{seed:1,teamId:'A'},{seed:2,teamId:'B'}],1);
 bracket=recordBracketGame(bracket,0,{gameId:'P1',status:'final',homeTeamId:'A',awayTeamId:'B',winnerTeamId:'A'});
 const source=row([final]),state=JSON.parse(source.game_state_json);
 state.extensions.phase10Playoffs={...bracket,championTeamId:'B'};
 source.game_state_json=JSON.stringify(state);
 const view=inspectCommittedLifecycle(source);
 assert.equal(view.playoffEvidence.reason,'invalid-playoff-evidence');
 assert.equal(view.archive.ready,false);
});
