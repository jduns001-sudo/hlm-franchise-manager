'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createBrowserSaveAdapter}=require('./hlm-browser-save-adapter');
const {previewGameBatch}=require('./hlm-phase9-game-batch-preview');
const {persistAuditedGameBatch}=require('./hlm-phase9-batch-audit');
const {buildGameBatchAuditBundle}=require('./hlm-phase9-batch-audit-bundle');
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
const {receipt}=persistAuditedGameBatch({...args,preview,confirmSimulation:true});
const before=map.get(repo.storageKey);
const bundle=buildGameBatchAuditBundle({storage,receipt});
assert.equal(bundle.verified,true);
assert.equal(bundle.gameCount,1);
assert.equal(JSON.parse(bundle.json).receipt.candidateFingerprint,receipt.candidateFingerprint);
assert.match(bundle.csv,/g1/);
assert.match(bundle.text,/Verification: PASS/);
assert.equal(bundle.persistencePerformed,false);
assert.equal(Object.isFrozen(bundle),true);
assert.equal(map.get(repo.storageKey),before);
assert.throws(()=>buildGameBatchAuditBundle({storage,receipt:{...receipt,candidateFingerprint:'tampered'}}));
console.log('Mission 523 audit bundle tests passed');
