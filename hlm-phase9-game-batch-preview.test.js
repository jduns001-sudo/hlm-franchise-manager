'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createBrowserSaveAdapter}=require('./hlm-browser-save-adapter');
const {serializeGameState}=require('./hlm-game-state-serialization');
const {previewGameBatch}=require('./hlm-phase9-game-batch-preview');
const {persistReviewedGameBatch}=require('./hlm-phase9-isolated-game-batch');
const map=new Map(),storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
const repo=createBrowserSaveAdapter(storage);
repo.save('active',createGameStateEnvelope({meta:{controlledTeamId:'PIT',currentDate:'2027-04-18'},
 teams:[{id:'PIT'},{id:'BUF'},{id:'NYR'}],
 games:[{id:'g1',homeTeamId:'BUF',awayTeamId:'NYR',date:'2027-04-18',status:'Scheduled'},
 {id:'g2',homeTeamId:'NYR',awayTeamId:'BUF',date:'2027-04-18',status:'Scheduled'}],
 players:[{id:'p1',teamId:'BUF',position:'C'},{id:'p2',teamId:'BUF',position:'D'},{id:'p3',teamId:'BUF',position:'G'},
 {id:'p4',teamId:'NYR',position:'C'},{id:'p5',teamId:'NYR',position:'D'},{id:'p6',teamId:'NYR',position:'G'}]}));
const games=[{gameId:'g1',deterministicSeed:'one',eventCount:12},{gameId:'g2',deterministicSeed:'two',eventCount:12}];
const resolveEvent=x=>({outcome:x.unit<0.4?'goal':'save',danger:'medium'});
const args={storage,sourceSlotId:'active',games,resolveEvent};
const before=serializeGameState(repo.load('active').state),raw=map.get(repo.storageKey);
const preview=previewGameBatch(args);
assert.equal(preview.persistencePerformed,false);
assert.equal(preview.gamesPreviewed,2);
assert.equal(map.get(repo.storageKey),raw);
assert.equal(repo.list().length,1);
assert.equal(serializeGameState(repo.load('active').state),before);
assert.throws(()=>previewGameBatch({...args,games:[games[0],games[0]]}),e=>e.code==='GAME_PREVIEW_INVALID_GAME');
assert.throws(()=>previewGameBatch({...args,games:[games[0],{gameId:'missing',deterministicSeed:'three'}]}));
assert.equal(map.get(repo.storageKey),raw);
const persisted=persistReviewedGameBatch({...args,destinationSlotId:'reviewed',confirmSimulation:true});
assert.equal(preview.candidateFingerprint,persisted.candidateFingerprint);
assert.deepEqual(preview.results,persisted.results);
console.log('Mission 514 dry-run preview tests passed');
