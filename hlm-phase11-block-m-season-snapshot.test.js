'use strict';
const assert=require('node:assert/strict');
const {test}=require('node:test');
const {calculateStandings}=require('./hlm-phase10-standings');
const {projectCommittedSeasonSnapshot:project}=require('./hlm-phase11-block-m-season-snapshot');
const teams=[{id:'A',name:'Alpha'},{id:'B',name:'Beta'}];
const games=[{id:'G1',home:'A',away:'B',status:'final',homeGoals:3,awayGoals:2,overtime:true},
 {id:'G2',home:'B',away:'A',status:'scheduled'}];
const finals=games.filter(x=>x.status==='final').map(x=>({...x,homeTeamId:x.home,awayTeamId:x.away}));
function source(changes={}){return {revision:2,game_state_json:JSON.stringify({
 universe:{teams},season:{id:'SYNTHETIC-2026',games,standings:calculateStandings(teams,finals),
 completedDayDecisions:['SYNTHETIC-DAY-18']},...changes})};}
test('committed finals and NHL overtime standings are projected read-only',()=>{
 const row=source(),original=row.game_state_json,result=project(row);
 assert.equal(result.official,false);
 assert.equal(result.lifecycleArchiveEligible,false);
 assert.equal(result.regularSeasonComplete,false);
 assert.equal(result.games.length,2);
 assert.equal(result.standings.find(x=>x.teamId==='B').points,1);
 assert.equal(row.game_state_json,original);
});
test('rejects forged standings, duplicate games, bad scores and unsupported history claims',()=>{
 for(const change of [
  {season:{id:'SYNTHETIC-2026',games,standings:[{teamId:'A',points:999}]}},
  {season:{id:'SYNTHETIC-2026',games:[games[0],games[0]],standings:calculateStandings(teams,finals)}},
  {season:{id:'SYNTHETIC-2026',games:[{...games[0],homeGoals:-1}],standings:calculateStandings(teams,finals)}},
  {season:{id:'SYNTHETIC-2026',games,standings:calculateStandings(teams,finals),completedDayDecisions:['D1','D1']}}
 ])assert.throws(()=>project(source(change)));
});
test('even all-final season cannot claim championship without authoritative playoffs',()=>{
 const onlyFinal=[games[0]];
 const row=source({season:{id:'SYNTHETIC-2026',games:onlyFinal,standings:calculateStandings(teams,finals),completedDayDecisions:['D1']}});
 const view=project(row);
 assert.equal(view.regularSeasonComplete,true);
 assert.equal(view.championshipVerified,false);
 assert.equal(view.lifecycleArchiveEligible,false);
});
