'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {generateRoundRobinSchedule}=require('./hlm-phase10-season-schedule');
const {createFranchiseSaveStore}=require('./hlm-phase10-save-store');
const {auditGameplayReadiness}=require('./hlm-phase10-gameplay-readiness');
const {startSeasonPlayoffs}=require('./hlm-phase10-season-playoffs');
const {simulateNextPlayoffGame}=require('./hlm-phase10-playoff-simulation');
const {calculateStandings}=require('./hlm-phase10-standings');
function seasonJourney(){
  const teams=Array.from({length:4},(_,i)=>({id:i+1,name:'Team '+(i+1)}));
  const games=generateRoundRobinSchedule(teams,'2026-10-12',2);
  const initial=createGameStateEnvelope({meta:{saveId:'isolated-season-journey',currentDate:'2026-10-12',controlledTeamId:1},teams,games});
  const storage=new Map(),adapter={read:k=>storage.get(k)??null,write:(k,v)=>storage.set(k,v)};
  const store=createFranchiseSaveStore(adapter,'isolated-season-journey');
  assert.equal(store.load(),null);store.save(initial);
  assert.equal(auditGameplayReadiness(store.load()).ready,true);
  let days=0,played=0;
  while(store.load().activity.games.some(g=>g.status==='scheduled')){
    const result=store.advanceAndSave(days+1);
    played+=result.results.length;
    assert.equal(store.load().meta.controlledTeamId,1);
    assert.deepEqual(store.load().activity.games,result.nextState.activity.games);
    if(++days>50)throw Error('Regular season did not terminate');
  }
  assert.equal(played,games.length);
  const completed=store.load();
  assert.equal(auditGameplayReadiness(completed).ready,true);
  assert.equal(auditGameplayReadiness(completed).snapshot.finalGames,games.length);
  assert.equal(calculateStandings(teams,completed.activity.games).length,teams.length);
  const started=startSeasonPlayoffs(completed,4,7);
  assert.equal(started.bracket.bestOf,7);
  assert.equal(started.seeds.length,4);
  store.save(started.nextState);
  let playoffGames=0;
  while(store.load().extensions.phase10Playoffs.status==='active'){
    const before=store.load();
    const next=simulateNextPlayoffGame(before,playoffGames+100);
    assert.equal(before.meta.controlledTeamId,1);
    store.save(next.nextState);
    assert.deepEqual(store.load(),next.nextState);
    if(++playoffGames>100)throw Error('Playoffs did not terminate');
  }
  const finished=store.load();
  assert.equal(finished.extensions.phase10Playoffs.rounds.length,2);
  assert.ok(teams.some(t=>t.id===finished.extensions.phase10Playoffs.championTeamId));
  assert.equal(finished.meta.controlledTeamId,1);
  assert.equal(finished.activity.games.filter(g=>g.status==='final').length,games.length);
  assert.throws(()=>startSeasonPlayoffs(finished,4,7),/already initialized/);
  assert.throws(()=>simulateNextPlayoffGame(finished,1),/No active/);
  const original=JSON.stringify(initial);
  assert.equal(JSON.stringify(initial),original);
  const reload=createFranchiseSaveStore(adapter,'isolated-season-journey');
  assert.deepEqual(reload.load(),finished);
  console.log('CONFIRMED isolated season journey: '+days+' days, '+played+' regular games, '+playoffGames+' playoff games, champion '+finished.extensions.phase10Playoffs.championTeamId);
}
seasonJourney();
