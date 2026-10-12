'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createBrowserSaveAdapter}=require('./hlm-browser-save-adapter');
const {previewGameBatch}=require('./hlm-phase9-game-batch-preview');
const {persistAuditedGameBatch}=require('./hlm-phase9-batch-audit');
const {exportVerifiedGameBatchAudit,parseGameBatchAuditExport}=require('./hlm-phase9-batch-audit-export');
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
const exported=exportVerifiedGameBatchAudit({storage,receipt});
assert.equal(exported.verified,true);
assert.equal(exported.persistencePerformed,false);
assert.equal(exported.bytes,new TextEncoder().encode(exported.json).length);
assert.deepEqual(parseGameBatchAuditExport(exported.json).receipt,receipt);
assert.equal(map.get(repo.storageKey),before);
assert.throws(()=>parseGameBatchAuditExport('broken'),e=>e.code==='GAME_BATCH_AUDIT_EXPORT_INVALID_JSON');
assert.throws(()=>exportVerifiedGameBatchAudit({storage,receipt:{...receipt,candidateFingerprint:'tampered'}}),e=>e.code==='GAME_BATCH_AUDIT_EXPORT_UNVERIFIED');
console.log('Mission 518 audit export tests passed');
