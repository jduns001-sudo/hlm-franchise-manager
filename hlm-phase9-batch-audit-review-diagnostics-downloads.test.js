'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createBrowserSaveAdapter}=require('./hlm-browser-save-adapter');
const {previewGameBatch}=require('./hlm-phase9-game-batch-preview');
const {persistAuditedGameBatch}=require('./hlm-phase9-batch-audit');
const {packageGameBatchAudit}=require('./hlm-phase9-batch-audit-package');
const {createGameBatchAuditReviewReceipt}=require('./hlm-phase9-batch-audit-review-receipt');
const {packageGameBatchAuditReview}=require('./hlm-phase9-batch-audit-review-package');
const {prepareGameBatchAuditReviewDiagnosticsDownloads}=require('./hlm-phase9-batch-audit-review-diagnostics-downloads');
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
const packaged=packageGameBatchAudit({storage,receipt});
const reviewed=createGameBatchAuditReviewReceipt({storage,json:packaged.json,confirmReview:true,reviewerId:'GM-01'});
const reviewPackage=packageGameBatchAuditReview({storage,json:packaged.json,receipt:reviewed});
const before=map.get(repo.storageKey);
const input={storage,json:reviewPackage.json,originalAuditJson:packaged.json,receipt:reviewed};
const result=prepareGameBatchAuditReviewDiagnosticsDownloads(input);
assert.equal(result.valid,true);
assert.deepEqual(result.files.map(x=>x.filename),[
 'gm-review-diagnostics.json','gm-review-diagnostics.csv','gm-review-diagnostics.txt','gm-review-diagnostics-package.json']);
assert.equal(JSON.parse(result.files[0].content).status,'READY');
assert.match(result.files[1].content,/READY/);
assert.match(result.files[2].content,/Status: READY/);
assert.equal(JSON.parse(result.files[3].content).kind,'phase9-game-batch-audit-review-diagnostics-package');
assert.equal(prepareGameBatchAuditReviewDiagnosticsDownloads({...input,json:'bad'}).valid,false);
assert.equal(result.persistencePerformed,false);
assert.equal(map.get(repo.storageKey),before);
console.log('Mission 544 diagnostics download tests passed');
