'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createExperimentalHighlightTimeline}=require('./hlm-experimental-highlight-timeline');
const positions=['C','LW','RW','D','D','G'];
const players=[...positions.map((position,i)=>({id:10+i,teamId:1,position,ovr:80})),...positions.map((position,i)=>({id:20+i,teamId:2,position,ovr:70}))];
const contracts=players.map(p=>({playerId:p.id,teamId:p.teamId,status:'Active'}));
const injuries=players.map(p=>({playerId:p.id,status:'Recovered'}));
const state=createGameStateEnvelope({teams:[{id:1,name:'Wolves'},{id:2,name:'Bears'}],players,contracts,injuries});
const before=JSON.stringify(state);
const result=createExperimentalHighlightTimeline(state,1,2,42);
assert.equal(result.kind,'experimental-highlight-timeline');
assert.equal(result.official,false);
assert.equal(result.persistencePerformed,false);
assert.deepEqual(createExperimentalHighlightTimeline(state,1,2,42),result);
if(result.researchReady){
 assert.equal(result.events.length,result.summary.eventCount);
 assert(result.events.every((event,i)=>event.ordinal===i+1&&event.verified));
}else{
 assert.equal(result.events,null);
 assert(Array.isArray(result.blockers));
}
assert.equal(JSON.stringify(state),before);
console.log('Batch 901-908 experimental highlight timeline tests passed.');
