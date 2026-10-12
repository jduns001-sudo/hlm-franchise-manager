'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createBrowserSaveAdapter}=require('./hlm-browser-save-adapter');
const {previewGameBatch}=require('./hlm-phase9-game-batch-preview');
const {persistAuditedGameBatch}=require('./hlm-phase9-batch-audit');
const {packageGameBatchAudit}=require('./hlm-phase9-batch-audit-package');
const {createGameBatchAuditReviewReceipt}=require('./hlm-phase9-batch-audit-review-receipt');
const {packageGameBatchAuditReview}=require('./hlm-phase9-batch-audit-review-package');
const {packageGameBatchAuditReviewDiagnostics}=require('./hlm-phase9-batch-audit-review-diagnostics-package');
const {validateGameBatchAuditReviewDiagnosticsPackageAgainstSaves}=require('./hlm-phase9-batch-audit-review-diagnostics-package-save-validation');
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
const input={storage,originalReviewPackageJson:reviewPackage.json,originalAuditJson:packaged.json,receipt:reviewed};
const diagnostics=packageGameBatchAuditReviewDiagnostics({storage,json:reviewPackage.json,originalAuditJson:packaged.json,receipt:reviewed});
const before=map.get(repo.storageKey);
const check=options=>validateGameBatchAuditReviewDiagnosticsPackageAgainstSaves({...input,json:diagnostics.json,...options});
assert.equal(check().valid,true);
assert.equal(check({json:'invalid'}).valid,false);
const altered=JSON.parse(diagnostics.json);
altered.files['diagnostics.csv']+='tampered';
assert.equal(check({json:JSON.stringify(altered)}).valid,false);
const different=check({originalReviewPackageJson:'bad'});
assert.equal(different.valid,false);
assert.equal(check().persistencePerformed,false);
assert.equal(map.get(repo.storageKey),before);
console.log('Mission 543 diagnostics package save validation tests passed');
