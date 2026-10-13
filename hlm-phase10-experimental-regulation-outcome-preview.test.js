'use strict';
const assert = require('node:assert/strict');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { createExperimentalRegulationOutcomePreview: preview } = require('./hlm-phase10-experimental-regulation-outcome-preview');
const positions = ['C','LW','RW','D','D','G'];
const players = [
  ...positions.map((position,i)=>({id:10+i,teamId:1,position,ovr:80})),
  ...positions.map((position,i)=>({id:20+i,teamId:2,position,ovr:70}))
];
const contracts = players.map(p=>({playerId:p.id,teamId:p.teamId,status:'Active'}));
const injuries = players.map(p=>({playerId:p.id,status:'Recovered'}));
const state = createGameStateEnvelope({teams:[{id:1,name:'Wolves'},{id:2,name:'Bears'}],players,contracts,injuries});
const before = JSON.stringify(state);
const result = preview(state,1,2);
assert.equal(result.kind,'phase10-experimental-regulation-outcome-preview');
assert.equal(result.evidenceComplete,true);
assert.equal(result.conditioning,'both-teams-goals-0-to-6');
assert(result.includedMass>0 && result.includedMass<1);
for(const key of ['homeWinProbability','tieProbability','awayWinProbability'])
  assert(Number.isFinite(result[key]) && result[key]>0 && result[key]<1);
assert(Math.abs(result.homeWinProbability+result.tieProbability+result.awayWinProbability-1)<1e-12);
assert(result.homeWinProbability>result.awayWinProbability);
assert.deepEqual(preview(state,1,2),result);
const reverse = preview(state,2,1);
assert(reverse.homeWinProbability<reverse.awayWinProbability);
assert.equal(JSON.stringify(state),before);
for(const flag of ['eligibilityCertified','simulationAuthorized','scoreCalculated','gameResultCreated','sourceStateMutated','persistencePerformed'])
  assert.equal(result[flag],false);
const incomplete=createGameStateEnvelope({teams:state.universe.teams,players,contracts:contracts.filter(c=>c.playerId!==20),injuries});
const blocked=preview(incomplete,1,2);
assert.equal(blocked.evidenceComplete,false);
assert.equal(blocked.includedMass,null);
assert.equal(blocked.homeWinProbability,null);
assert.equal(blocked.tieProbability,null);
assert.equal(blocked.awayWinProbability,null);
blocked.awayBlockers[0].code='TAMPER';
assert(!JSON.stringify(preview(incomplete,1,2)).includes('TAMPER'));
assert.throws(()=>preview(state,1,1),{code:'INVALID_PHASE10_MATCHUP_TEAM_IDS'});
assert.throws(()=>preview(state,1,999),{code:'UNKNOWN_PHASE10_MATCHUP_TEAM_ID'});
console.log('Mission 742 experimental regulation outcome preview tests passed.');
