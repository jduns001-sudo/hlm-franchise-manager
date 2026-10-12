'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createBrowserSaveAdapter}=require('./hlm-browser-save-adapter');
const {previewGameBatch}=require('./hlm-phase9-game-batch-preview');
const {persistAuditedGameBatch}=require('./hlm-phase9-batch-audit');
const {exportVerifiedGameBatchAudit}=require('./hlm-phase9-batch-audit-export');
const {exportGameBatchAuditCsv}=require('./hlm-phase9-batch-audit-csv');
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
const csv=exportGameBatchAuditCsv({storage,json:exported.json});
assert.equal(csv.verified,true);
assert.equal(csv.gameCount,1);
assert.match(csv.csv,/order,gameId,homeGoals,awayGoals,seed/);
assert.match(csv.csv,/g1/);
assert.match(csv.csv,/audit-seed/);
assert.equal(csv.persistencePerformed,false);
assert.equal(map.get(repo.storageKey),before);
const tampered=JSON.parse(exported.json);
tampered.receipt.candidateFingerprint='wrong';
assert.throws(()=>exportGameBatchAuditCsv({storage,json:JSON.stringify(tampered)}),e=>e.code==='GAME_BATCH_CSV_UNVERIFIED');
console.log('Mission 522 audit CSV tests passed');
