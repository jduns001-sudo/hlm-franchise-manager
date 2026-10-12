'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createMemorySaveRepository}=require('./hlm-save-repository');
const {serializeGameState}=require('./hlm-game-state-serialization');
const {previewCPUMultiSeasonSave}=require('./hlm-phase9-cpu-multiseason-preview-commit');
const {executeReviewedCPUMultiSeason}=require('./hlm-phase9-cpu-persistent-multiseason-execution');
const repository=createMemorySaveRepository();
const state=createGameStateEnvelope({meta:{controlledTeamId:'PIT',currentDate:'2030-06-30'},teams:[{id:'PIT'},{id:'BUF'},{id:'NYR'}],players:[{id:'p1',teamId:'BUF'}]});
state.history.seasons.push({id:'2029-30',status:'completed',champion:'PIT'});
repository.save('original',state);
const original=serializeGameState(repository.load('original').state);
const trade={teamIds:['BUF','NYR'],legs:[{fromTeamId:'BUF',toTeamId:'NYR',assets:[{type:'player',id:'p1',ownerTeamId:'BUF'}]}],humanGMApproved:true,playerProtectionVerified:true,leagueRulesVerified:true,capRulesVerified:true,transactionId:'multi-season-trade-1'};
const transitions=[
 {fromSeasonId:'2029-30',toSeasonId:'2030-31',nextDate:'2030-07-01',steps:[{teamId:'BUF',trade}]},
 {fromSeasonId:'2030-31',toSeasonId:'2031-32',nextDate:'2031-07-01',completedSeason:{seasonId:'2030-31',championTeamId:'NYR',completedAt:'2031-06-29'}}
];
const reviewedPreview=previewCPUMultiSeasonSave({repository,sourceSlotId:'original',transitions});
const run=(changes={})=>executeReviewedCPUMultiSeason({repository,reviewedPreview,transitions,destinationSlotId:'executed',confirmExecution:true,...changes});
assert.throws(()=>run({confirmExecution:false}),e=>e.code==='CPU_MULTI_SEASON_EXECUTION_APPROVAL_REQUIRED');
assert.throws(()=>run({reviewedPreview:null}),e=>e.code==='CPU_MULTI_SEASON_EXECUTION_REVIEW_REQUIRED');
assert.throws(()=>run({transitions:[{...transitions[0],nextDate:'2030-07-02'},transitions[1]]}),e=>e.code==='CPU_MULTI_SEASON_EXECUTION_STALE');
assert.equal(repository.count(),1);
const result=run();
assert.equal(result.executed,true);
assert.equal(result.verified,true);
assert.equal(result.autonomousExecutionEnabled,false);
const saved=repository.load('executed').state;
assert.equal(saved.meta.currentDate,'2031-07-01');
assert.equal(saved.universe.players[0].teamId,'NYR');
assert.equal(saved.history.seasons.find(s=>s.id==='2030-31').champion,'NYR');
assert.equal(saved.history.seasons.find(s=>s.id==='2031-32').status,'active');
assert.equal(serializeGameState(saved),reviewedPreview.candidateFingerprint);
assert.equal(serializeGameState(repository.load('original').state),original);
assert.throws(()=>run(),e=>e.code==='CPU_MULTI_SEASON_SAVE_DESTINATION_OCCUPIED');
console.log('Phase 9 approved persistent multi-season execution integration tests passed');
