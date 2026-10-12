'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createBrowserSaveAdapter}=require('./hlm-browser-save-adapter');
const {serializeGameState}=require('./hlm-game-state-serialization');
const {persistReviewedGameBatch}=require('./hlm-phase9-isolated-game-batch');
function setup(){
 const map=new Map(),storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
 const repo=createBrowserSaveAdapter(storage);
 const state=createGameStateEnvelope({meta:{controlledTeamId:'PIT',currentDate:'2027-04-18'},
 teams:[{id:'PIT'},{id:'BUF'},{id:'NYR'}],
 games:[{id:'g1',homeTeamId:'BUF',awayTeamId:'NYR',date:'2027-04-18',status:'Scheduled'},
 {id:'g2',homeTeamId:'NYR',awayTeamId:'BUF',date:'2027-04-18',status:'Scheduled'}],
 players:[{id:'p1',teamId:'BUF',position:'C'},{id:'p2',teamId:'BUF',position:'D'},{id:'p3',teamId:'BUF',position:'G'},
 {id:'p4',teamId:'NYR',position:'C'},{id:'p5',teamId:'NYR',position:'D'},{id:'p6',teamId:'NYR',position:'G'}]});
 repo.save('active',state);return {storage,repo};
}
const resolver=x=>({outcome:x.unit<0.4?'goal':'save',danger:'medium'});
const games=[{gameId:'g1',deterministicSeed:'seed1',eventCount:12},{gameId:'g2',deterministicSeed:'seed2',eventCount:12}];
const {storage,repo}=setup(),before=serializeGameState(repo.load('active').state);
const args={storage,sourceSlotId:'active',destinationSlotId:'batch',games,resolveEvent:resolver};
assert.throws(()=>persistReviewedGameBatch(args),e=>e.code==='GAME_BATCH_APPROVAL_REQUIRED');
assert.equal(repo.list().length,1);
assert.throws(()=>persistReviewedGameBatch({...args,confirmSimulation:true,games:[games[0],games[0]]}),e=>e.code==='GAME_BATCH_DUPLICATE_OR_INVALID');
assert.throws(()=>persistReviewedGameBatch({...args,confirmSimulation:true,games:[games[0],{gameId:'missing',deterministicSeed:'seed3'}]}));
assert.equal(repo.list().length,1);
const result=persistReviewedGameBatch({...args,confirmSimulation:true});
assert.equal(result.verified,true);assert.equal(result.results.length,2);
assert.equal(serializeGameState(repo.load('active').state),before);
assert.equal(repo.load('batch').state.activity.games.filter(g=>g.status==='Played').length,2);
assert.equal(repo.load('batch').state.history.statistics.length,2);
assert.equal(repo.load('batch').state.history.records.length,2);
assert.equal(serializeGameState(repo.load('batch').state),result.candidateFingerprint);
assert.throws(()=>persistReviewedGameBatch({...args,confirmSimulation:true}),e=>e.code==='GAME_BATCH_DESTINATION_UNAVAILABLE');
const second=setup();
const repeat=persistReviewedGameBatch({...args,storage:second.storage,confirmSimulation:true});
assert.equal(repeat.candidateFingerprint,result.candidateFingerprint);
console.log('Mission 513 isolated game batch tests passed');
