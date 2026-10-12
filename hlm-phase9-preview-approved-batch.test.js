'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createBrowserSaveAdapter}=require('./hlm-browser-save-adapter');
const {previewGameBatch}=require('./hlm-phase9-game-batch-preview');
const {persistPreviewApprovedGameBatch}=require('./hlm-phase9-preview-approved-batch');
const map=new Map(),storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
const repo=createBrowserSaveAdapter(storage);
repo.save('active',createGameStateEnvelope({meta:{controlledTeamId:'PIT',currentDate:'2027-04-18'},
 teams:[{id:'PIT'},{id:'BUF'},{id:'NYR'}],
 games:[{id:'g1',homeTeamId:'BUF',awayTeamId:'NYR',date:'2027-04-18',status:'Scheduled'}],
 players:[{id:'p1',teamId:'BUF',position:'C'},{id:'p2',teamId:'BUF',position:'D'},{id:'p3',teamId:'BUF',position:'G'},
 {id:'p4',teamId:'NYR',position:'C'},{id:'p5',teamId:'NYR',position:'D'},{id:'p6',teamId:'NYR',position:'G'}]}));
const resolver=x=>({outcome:x.unit<0.4?'goal':'save',danger:'medium'});
const args={storage,sourceSlotId:'active',destinationSlotId:'reviewed',
 games:[{gameId:'g1',deterministicSeed:'fixed',eventCount:12}],resolveEvent:resolver};
const preview=previewGameBatch(args);
assert.throws(()=>persistPreviewApprovedGameBatch({...args,preview}),e=>e.code==='GAME_BATCH_APPROVAL_REQUIRED');
assert.throws(()=>persistPreviewApprovedGameBatch({...args,confirmSimulation:true}),e=>e.code==='GAME_BATCH_PREVIEW_REQUIRED');
assert.throws(()=>persistPreviewApprovedGameBatch({...args,preview:{...preview,candidateFingerprint:'tampered'},confirmSimulation:true}),e=>e.code==='GAME_BATCH_PREVIEW_STALE');
assert.equal(repo.list().length,1);
const result=persistPreviewApprovedGameBatch({...args,preview,confirmSimulation:true});
assert.equal(result.previewMatched,true);
assert.equal(result.gmApproved,true);
assert.equal(repo.list().length,2);
assert.equal(result.candidateFingerprint,preview.candidateFingerprint);
console.log('Mission 515 preview approval tests passed');
