'use strict';
const assert = require('node:assert/strict');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { createExperimentalRosterScorePreview: preview } = require('./hlm-phase10-experimental-score-preview');
const positions = ['C','LW','RW','D','D','G'];
const players = [
  ...positions.map((position,i)=>({id:10+i,teamId:1,position,ovr:80})),
  ...positions.map((position,i)=>({id:20+i,teamId:2,position,ovr:70}))
];
const contracts = players.map(p=>({playerId:p.id,teamId:p.teamId,status:'Active'}));
const injuries = players.map(p=>({playerId:p.id,status:'Recovered'}));
const state=createGameStateEnvelope({teams:[{id:1,name:'Wolves'},{id:2,name:'Bears'}],players,contracts,injuries});
const before=JSON.stringify(state);
const result=preview(state,1,2);
assert.equal(result.kind,'phase10-experimental-roster-score-preview');
assert.equal(result.evidenceComplete,true);
assert.equal(result.homeMeanRating,80);
assert.equal(result.awayMeanRating,70);
assert.equal(result.ratingDifference,10);
assert.equal(result.favoredTeamId,1);
assert.deepEqual(result.homeBlockers,[]);
for(const flag of ['eligibilityCertified','simulationAuthorized','scoreCalculated','gameResultCreated','sourceStateMutated','persistencePerformed']) assert.equal(result[flag],false);
assert.deepEqual(preview(state,1,2),result);
assert.equal(JSON.stringify(state),before);
const missing=createGameStateEnvelope({teams:state.universe.teams,players,contracts:contracts.filter(c=>c.playerId!==20),injuries});
const incomplete=preview(missing,1,2);
assert.equal(incomplete.evidenceComplete,false);
assert.equal(incomplete.ratingDifference,null);
assert.equal(incomplete.favoredTeamId,null);
assert(incomplete.awayBlockers.some(b=>b.playerId===20));
incomplete.awayBlockers[0].code='TAMPER';
assert(!JSON.stringify(preview(missing,1,2)).includes('TAMPER'));
assert.equal(JSON.stringify(state),before);
assert.throws(()=>preview(state,1,1),{code:'INVALID_PHASE10_MATCHUP_TEAM_IDS'});
assert.throws(()=>preview(state,1,999),{code:'UNKNOWN_PHASE10_MATCHUP_TEAM_ID'});
console.log('Mission 739 experimental rating preview tests passed.');
