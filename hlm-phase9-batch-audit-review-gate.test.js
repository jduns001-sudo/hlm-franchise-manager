'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createBrowserSaveAdapter}=require('./hlm-browser-save-adapter');
const {previewGameBatch}=require('./hlm-phase9-game-batch-preview');
const {persistAuditedGameBatch}=require('./hlm-phase9-batch-audit');
const {packageGameBatchAudit}=require('./hlm-phase9-batch-audit-package');
const {reviewGameBatchAuditPackage}=require('./hlm-phase9-batch-audit-review-gate');
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
const before=map.get(repo.storageKey);
const pending=reviewGameBatchAuditPackage({storage,json:packaged.json});
assert.equal(pending.accepted,false);
assert.equal(pending.verified,true);
assert.ok(pending.errors.includes('GAME_BATCH_AUDIT_REVIEW_CONFIRMATION_REQUIRED'));
const accepted=reviewGameBatchAuditPackage({storage,json:packaged.json,confirmReview:true});
assert.equal(accepted.accepted,true);
assert.equal(accepted.gameCount,1);
assert.equal(accepted.persistencePerformed,false);
assert.equal(accepted.activeFranchiseSlotReplaced,false);
const altered=JSON.parse(packaged.json);
altered.files['audit.csv']+='tamper';
assert.equal(reviewGameBatchAuditPackage({storage,json:JSON.stringify(altered),confirmReview:true}).accepted,false);
assert.equal(reviewGameBatchAuditPackage({storage,json:'bad',confirmReview:true}).accepted,false);
assert.equal(map.get(repo.storageKey),before);
console.log('Mission 527 audit review gate tests passed');
