'use strict';
const assert = require('node:assert/strict');
const { createGameStateEnvelope } = require('./hlm-game-state');
const { auditExperimentalGoalDistributions: audit } = require('./hlm-phase10-experimental-goal-distribution-audit');
const positions=['C','LW','RW','D','D','G'];
const players=[...positions.map((position,i)=>({id:10+i,teamId:1,position,ovr:80})),...positions.map((position,i)=>({id:20+i,teamId:2,position,ovr:70}))];
const contracts=players.map(p=>({playerId:p.id,teamId:p.teamId,status:'Active'}));
const injuries=players.map(p=>({playerId:p.id,status:'Recovered'}));
const state=createGameStateEnvelope({teams:[{id:1,name:'Wolves'},{id:2,name:'Bears'}],players,contracts,injuries});
const before=JSON.stringify(state);
const result=audit(state,1,2);
assert.equal(result.evidenceComplete,true);
for (const team of [result.home,result.away]) {
 assert(team.includedMass>0 && team.includedMass<1);
 assert(team.omittedTailMass>0 && team.omittedTailMass<1);
 assert(Math.abs(team.includedMass+team.omittedTailMass-1)<1e-12);
}
assert.deepEqual(audit(state,1,2),result);
for(const flag of ['eligibilityCertified','simulationAuthorized','scoreCalculated','gameResultCreated','sourceStateMutated','persistencePerformed']) assert.equal(result[flag],false);
assert.equal(JSON.stringify(state),before);
const incomplete=createGameStateEnvelope({teams:state.universe.teams,players,contracts:contracts.filter(c=>c.playerId!==20),injuries});
assert.equal(audit(incomplete,1,2).home,null);
assert.equal(audit(incomplete,1,2).away,null);
console.log('Mission 742 distribution audit tests passed.');
