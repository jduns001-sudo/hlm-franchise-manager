'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createBrowserSaveAdapter}=require('./hlm-browser-save-adapter');
const {previewGameBatch}=require('./hlm-phase9-game-batch-preview');
const {persistAuditedGameBatch}=require('./hlm-phase9-batch-audit');
const {exportVerifiedGameBatchAudit}=require('./hlm-phase9-batch-audit-export');
const {validateImportedGameBatchAudit}=require('./hlm-phase9-batch-audit-import-validation');
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
const exported=exportVerifiedGameBatchAudit({storage,receipt});
const before=map.get(repo.storageKey);
const checked=validateImportedGameBatchAudit({storage,json:exported.json});
assert.equal(checked.valid,true);
assert.equal(checked.safeToReview,true);
assert.equal(checked.persistencePerformed,false);
assert.equal(map.get(repo.storageKey),before);
const altered=JSON.parse(exported.json);
altered.receipt.candidateFingerprint='tampered';
assert.equal(validateImportedGameBatchAudit({storage,json:JSON.stringify(altered)}).valid,false);
assert.equal(map.get(repo.storageKey),before);
assert.throws(()=>validateImportedGameBatchAudit({storage,json:'not json'}));
console.log('Mission 519 audit import validation tests passed');
