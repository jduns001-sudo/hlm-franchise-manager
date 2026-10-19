'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {simulateRosterDayWithGoalStats}=require('./hlm-phase10-roster-day-with-stats');
const {aggregateUnifiedBoxScores}=require('./hlm-phase11-unified-box-scores');
const {createIsolatedSeasonStore}=require('./hlm-phase11-isolated-season-atomic-store');
const positions=['C','LW','RW','D','D','G'];
const players=[1,2].flatMap(teamId=>positions.map((position,i)=>({id:teamId*100+i,teamId,position,ovr:78})));
const state=createGameStateEnvelope({meta:{saveId:'mission-1357',controlledTeamId:1,currentDate:'2026-10-18'},
 teams:[{id:1,name:'Owner'},{id:2,name:'CPU'}],players,
 contracts:players.map(p=>({playerId:p.id,teamId:p.teamId,status:'Active'})),
 injuries:players.map(p=>({playerId:p.id,status:'Recovered'})),
 games:[{id:'g1',date:'2026-10-19',status:'scheduled',homeTeamId:1,awayTeamId:2},
 {id:'g2',date:'2026-10-20',status:'scheduled',homeTeamId:2,awayTeamId:1}]});
const storage=new Map([['hlm_front_office_v8','PRODUCTION_SENTINEL']]);
const adapter={read:k=>storage.has(k)?storage.get(k):null,write:(k,v)=>storage.set(k,v),remove:k=>storage.delete(k)};
const store=createIsolatedSeasonStore(adapter,{key:'hlm-phase11-isolated-season-m1357'});
store.save(state);
assert.throws(()=>simulateRosterDayWithGoalStats(state,1,{}),/Experimental/);
let previous=adapter.read(store.key);
for(let day=0;day<2;day++){
 const loaded=store.load();
 const result=simulateRosterDayWithGoalStats(loaded,13+day,{experimental:true,persist:false});
 assert.equal(result.advanced,true);assert.equal(result.boxScores.length,1);
 store.save(result.nextState,{expectedRaw:previous});
 previous=adapter.read(store.key);
 assert.deepEqual(store.load().extensions.phase11ExperimentalBoxScores,result.nextState.extensions.phase11ExperimentalBoxScores);
 assert.deepEqual(store.load().extensions.phase11ExperimentalStatHistory,result.statHistory);
}
assert.equal(storage.get('hlm_front_office_v8'),'PRODUCTION_SENTINEL');
assert.equal(store.load().extensions.phase11ExperimentalBoxScores.length,2);
const old=store.load();
const updated=JSON.parse(JSON.stringify(old));updated.meta.currentDate='2026-10-21';
store.save(updated,{expectedRaw:previous});
assert.throws(()=>store.save(old,{expectedRaw:previous}),/Stale/);
const box=old.extensions.phase11ExperimentalBoxScores;
const playoff={...JSON.parse(JSON.stringify(box[0])),gameId:'playoff1',season:'2027',playoff:true};
const future={...JSON.parse(JSON.stringify(box[1])),gameId:'future1',season:'2028'};
const summary=aggregateUnifiedBoxScores([...box,playoff,future]);
assert.equal(summary.reduce((n,s)=>n+s.games,0),4);
assert.equal(summary.find(s=>s.season==='2027'&&s.kind==='playoffs').games,1);
assert.equal(summary.find(s=>s.season==='2028'&&s.kind==='regular').games,1);
assert.throws(()=>aggregateUnifiedBoxScores([box[0],box[0]]),/Duplicate/);
assert.equal(store.productionActivationEnabled,false);
console.log('Mission 1357: isolated two-day save/reload, stats, playoffs, seasons, stale write and production isolation passed');
