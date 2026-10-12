'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createBrowserSaveAdapter}=require('./hlm-browser-save-adapter');
const {previewGameBatch}=require('./hlm-phase9-game-batch-preview');
const {persistAuditedGameBatch}=require('./hlm-phase9-batch-audit');
const {packageGameBatchAudit}=require('./hlm-phase9-batch-audit-package');
const {createGameBatchAuditReviewReceipt}=require('./hlm-phase9-batch-audit-review-receipt');
const {summarizeGameBatchAuditReview}=require('./hlm-phase9-batch-audit-review-summary');
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
const before=map.get(repo.storageKey);
const summary=summarizeGameBatchAuditReview({storage,json:packaged.json,receipt:reviewed});
assert.equal(summary.status,'VERIFIED');
assert.equal(summary.reviewerId,'GM-01');
assert.equal(summary.gameCount,1);
assert.equal(summary.persistencePerformed,false);
assert.equal(Object.isFrozen(summary),true);
const rejected=summarizeGameBatchAuditReview({storage,json:packaged.json,receipt:{...reviewed,gameCount:3}});
assert.equal(rejected.status,'REJECTED');
assert.equal(rejected.verified,false);
assert.equal(summarizeGameBatchAuditReview({storage,json:'bad',receipt:reviewed}).status,'REJECTED');
assert.equal(map.get(repo.storageKey),before);
console.log('Mission 530 review summary tests passed');
