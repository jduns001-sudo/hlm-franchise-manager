'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createExperimentalHighlightGameDigest}=require('./hlm-experimental-highlight-game-digest');
const positions=['C','LW','RW','D','D','G'];
const players=[...positions.map((position,i)=>({id:10+i,teamId:1,position,ovr:80})),...positions.map((position,i)=>({id:20+i,teamId:2,position,ovr:70}))];
const contracts=players.map(p=>({playerId:p.id,teamId:p.teamId,status:'Active'}));
const injuries=players.map(p=>({playerId:p.id,status:'Recovered'}));
const state=createGameStateEnvelope({teams:[{id:1,name:'Wolves'},{id:2,name:'Bears'}],players,contracts,injuries});
const before=JSON.stringify(state);
const result=createExperimentalHighlightGameDigest(state,1,2,42);
assert.equal(result.kind,'experimental-highlight-game-digest');
assert.equal(result.official,false);
assert.equal(result.persistencePerformed,false);
assert.deepEqual(createExperimentalHighlightGameDigest(state,1,2,42),result);
if(result.researchReady){
 assert.equal(result.game.highlightCount,result.periods.reduce((n,p)=>n+p.eventCount,0));
 assert.equal(result.game.periodsWithHighlights,result.periods.length);
 assert(result.periods.every(p=>p.eventCount>0&&p.firstOrdinal<=p.lastOrdinal));
}else{assert.equal(result.periods,null);assert.equal(result.game,null);assert(Array.isArray(result.blockers));}
assert.equal(JSON.stringify(state),before);
console.log('Batch 917-924 experimental highlight game digest tests passed.');
