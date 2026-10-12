'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {serializeGameState}=require('./hlm-game-state-serialization');
const {createMemorySaveRepository}=require('./hlm-save-repository');
const {previewDeterministicGameResult,commitDeterministicGameResult}=require('./hlm-phase9-deterministic-game-result-persistence');
const repository=createMemorySaveRepository();
const state=createGameStateEnvelope({meta:{controlledTeamId:'PIT',currentDate:'2027-04-17'},teams:[{id:'PIT'},{id:'BUF'}],
 games:[{id:'game-1',date:'2027-04-17',homeTeamId:'PIT',awayTeamId:'BUF',status:'Scheduled'}]});
repository.save('active',state);
const before=serializeGameState(repository.load('active').state);
const preview=previewDeterministicGameResult({repository,sourceSlotId:'active',gameId:'game-1',deterministicSeed:'fixed-seed',eventCount:2,
 resolveEvent:({index})=>({outcome:index===0?'goal':'save'})});
assert.equal(preview.verified,true);
assert.equal(preview.score.homeGoals+preview.score.awayGoals,1);
assert.equal(preview.output.playByPlay.length,10);
assert.equal(repository.has('played'),false);
assert.equal(serializeGameState(repository.load('active').state),before);
assert.throws(()=>commitDeterministicGameResult({repository,reviewedPreview:preview,destinationSlotId:'played'}),e=>e.code==='GAME_RESULT_APPROVAL_REQUIRED');
const result=commitDeterministicGameResult({repository,reviewedPreview:preview,destinationSlotId:'played',confirmCommit:true});
assert.equal(result.verified,true);
assert.equal(repository.load('played').state.activity.games[0].status,'Played');
assert.equal(repository.load('played').state.history.records.length,1);
assert.equal(repository.load('played').state.history.statistics.length,1);
assert.equal(serializeGameState(repository.load('active').state),before);
assert.throws(()=>commitDeterministicGameResult({repository,reviewedPreview:preview,destinationSlotId:'played',confirmCommit:true}),e=>e.code==='GAME_RESULT_DESTINATION_UNAVAILABLE');
assert.throws(()=>previewDeterministicGameResult({repository,sourceSlotId:'played',gameId:'game-1',deterministicSeed:'fixed-seed'}),e=>e.code==='GAME_NOT_SCHEDULED');
console.log('Phase 9 deterministic game result persistence integration tests passed');
