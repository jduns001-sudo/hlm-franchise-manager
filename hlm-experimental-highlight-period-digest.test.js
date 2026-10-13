'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createExperimentalHighlightPeriodDigest}=require('./hlm-experimental-highlight-period-digest');
const positions=['C','LW','RW','D','D','G'];
const players=[...positions.map((position,i)=>({id:10+i,teamId:1,position,ovr:80})),...positions.map((position,i)=>({id:20+i,teamId:2,position,ovr:70}))];
const contracts=players.map(p=>({playerId:p.id,teamId:p.teamId,status:'Active'}));
const injuries=players.map(p=>({playerId:p.id,status:'Recovered'}));
const state=createGameStateEnvelope({teams:[{id:1,name:'Wolves'},{id:2,name:'Bears'}],players,contracts,injuries});
const before=JSON.stringify(state);
const result=createExperimentalHighlightPeriodDigest(state,1,2,42);
assert.equal(result.kind,'experimental-highlight-period-digest');
assert.equal(result.official,false);
assert.equal(result.persistencePerformed,false);
assert.deepEqual(createExperimentalHighlightPeriodDigest(state,1,2,42),result);
if(result.researchReady){
 assert.equal(result.periods.reduce((sum,p)=>sum+p.eventCount,0),result.summary.eventCount);
 assert(result.periods.every(p=>p.eventCount>0&&p.firstOrdinal<=p.lastOrdinal));
 assert(result.periods.every((p,i)=>i===0||result.periods[i-1].period<p.period));
}else{assert.equal(result.periods,null);assert(Array.isArray(result.blockers));}
assert.equal(JSON.stringify(state),before);
console.log('Batch 909-916 experimental highlight period digest tests passed.');
