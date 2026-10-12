'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createBrowserSaveAdapter}=require('./hlm-browser-save-adapter');
const {previewGameBatch}=require('./hlm-phase9-game-batch-preview');
const {persistAuditedGameBatch}=require('./hlm-phase9-batch-audit');
const map=new Map(),storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
const repo=createBrowserSaveAdapter(storage);
repo.save('active',createGameStateEnvelope({meta:{controlledTeamId:'PIT',currentDate:'2027-04-18'},
 teams:[{id:'PIT'},{id:'BUF'},{id:'NYR'}],
 games:[{id:'g1',homeTeamId:'BUF',awayTeamId:'NYR',date:'2027-04-18',status:'Scheduled'}],
 players:[{id:'p1',teamId:'BUF',position:'C'},{id:'p2',teamId:'BUF',position:'D'},{id:'p3',teamId:'BUF',position:'G'},
 {id:'p4',teamId:'NYR',position:'C'},{id:'p5',teamId:'NYR',position:'D'},{id:'p6',teamId:'NYR',position:'G'}]}));
const resolveEvent=x=>({outcome:x.unit<0.4?'goal':'save',danger:'medium'});
const args={storage,sourceSlotId:'active',destinationSlotId:'audited',
 games:[{gameId:'g1',deterministicSeed:'audit-seed',eventCount:12}],resolveEvent};
const preview=previewGameBatch(args);
assert.throws(()=>persistAuditedGameBatch({...args,preview}),e=>e.code==='GAME_BATCH_APPROVAL_REQUIRED');
const {result,receipt}=persistAuditedGameBatch({...args,preview,confirmSimulation:true});
assert.equal(result.verified,true);
assert.equal(receipt.persistenceVerified,true);
assert.equal(receipt.sourceFingerprint,preview.sourceFingerprint);
assert.equal(receipt.candidateFingerprint,preview.candidateFingerprint);
assert.equal(receipt.games.length,1);
assert.equal(receipt.games[0].seed,'audit-seed');
assert.equal(receipt.activeFranchiseSlotReplaced,false);
assert.equal(Object.isFrozen(receipt),true);
assert.equal(Object.isFrozen(receipt.games[0].score),true);
assert.equal(repo.list().length,2);
console.log('Mission 516 audit receipt tests passed');
