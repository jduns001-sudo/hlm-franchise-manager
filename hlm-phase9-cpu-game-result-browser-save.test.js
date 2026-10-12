'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createBrowserSaveAdapter}=require('./hlm-browser-save-adapter');
const {serializeGameState}=require('./hlm-game-state-serialization');
const {persistReviewedGameResult}=require('./hlm-phase9-cpu-game-result-browser-save');
const map=new Map(),storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
const repo=createBrowserSaveAdapter(storage);
const state=createGameStateEnvelope({meta:{controlledTeamId:'PIT',currentDate:'2027-04-18'},
 teams:[{id:'PIT'},{id:'BUF'},{id:'NYR'}],games:[{id:'g1',homeTeamId:'BUF',awayTeamId:'NYR',date:'2027-04-18',status:'Scheduled'}],
 players:[{id:'p1',teamId:'BUF',position:'C'},{id:'p2',teamId:'BUF',position:'D'},{id:'p3',teamId:'BUF',position:'G'},
 {id:'p4',teamId:'NYR',position:'C'},{id:'p5',teamId:'NYR',position:'D'},{id:'p6',teamId:'NYR',position:'G'}]});
repo.save('active',state);const before=serializeGameState(repo.load('active').state);
const resolver=x=>({outcome:x.unit<0.4?'goal':'save',danger:'medium'});
const args={storage,sourceSlotId:'active',destinationSlotId:'game-result',gameId:'g1',deterministicSeed:'test-2027',eventCount:12,resolveEvent:resolver};
assert.throws(()=>persistReviewedGameResult(args),e=>e.code==='CPU_GAME_SAVE_APPROVAL_REQUIRED');
assert.equal(repo.list().length,1);
const result=persistReviewedGameResult({...args,confirmSimulation:true});
assert.equal(result.verified,true);assert.equal(result.gameEventsProcessed,true);
assert.equal(repo.load('game-result').state.activity.games[0].status,'Played');
assert.equal(repo.load('game-result').state.history.statistics.length,1);
assert.equal(repo.load('game-result').state.history.records.length,1);
assert.equal(serializeGameState(repo.load('active').state),before);
assert.equal(serializeGameState(repo.load('game-result').state),result.candidateFingerprint);
assert.throws(()=>persistReviewedGameResult({...args,confirmSimulation:true}),e=>e.code==='CPU_GAME_SAVE_DESTINATION_UNAVAILABLE');
assert.throws(()=>persistReviewedGameResult({...args,destinationSlotId:'active',confirmSimulation:true}),e=>e.code==='CPU_GAME_SAVE_DESTINATION_UNAVAILABLE');
const map2=new Map(),storage2={getItem:k=>map2.get(k)??null,setItem:(k,v)=>map2.set(k,v),removeItem:k=>map2.delete(k)};
const repo2=createBrowserSaveAdapter(storage2);repo2.save('active',state);
const repeat=persistReviewedGameResult({...args,storage:storage2,confirmSimulation:true});
assert.equal(repeat.candidateFingerprint,result.candidateFingerprint);
console.log('Phase 9 isolated game result browser persistence tests passed');
