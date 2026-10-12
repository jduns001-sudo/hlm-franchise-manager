'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createBrowserSaveAdapter}=require('./hlm-browser-save-adapter');
const {previewGameBatch}=require('./hlm-phase9-game-batch-preview');
const {persistAuditedGameBatch}=require('./hlm-phase9-batch-audit');
const {exportVerifiedGameBatchAudit}=require('./hlm-phase9-batch-audit-export');
const {buildGameBatchAuditReport}=require('./hlm-phase9-batch-audit-report');
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
const report=buildGameBatchAuditReport({storage,json:exported.json});
assert.equal(report.valid,true);
assert.equal(report.gameCount,1);
assert.equal(report.games[0].gameId,'g1');
assert.equal(report.games[0].seed,'audit-seed');
assert.equal(report.gmApproved,true);
assert.equal(report.persistencePerformed,false);
assert.equal(map.get(repo.storageKey),before);
const tampered=JSON.parse(exported.json);
tampered.receipt.candidateFingerprint='wrong';
const failed=buildGameBatchAuditReport({storage,json:JSON.stringify(tampered)});
assert.equal(failed.valid,false);
assert.equal(failed.safeToReview,false);
assert.equal(map.get(repo.storageKey),before);
console.log('Mission 520 audit review report tests passed');
