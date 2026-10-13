'use strict';
const assert=require('node:assert/strict');
const {createGameStateEnvelope}=require('./hlm-game-state');
const {createExperimentalHighlightRecap}=require('./hlm-experimental-highlight-recap');
const positions=['C','LW','RW','D','D','G'];
const players=[...positions.map((position,i)=>({id:10+i,teamId:1,position,ovr:80})),...positions.map((position,i)=>({id:20+i,teamId:2,position,ovr:70}))];
const contracts=players.map(p=>({playerId:p.id,teamId:p.teamId,status:'Active'}));
const injuries=players.map(p=>({playerId:p.id,status:'Recovered'}));
const state=createGameStateEnvelope({teams:[{id:1,name:'Wolves'},{id:2,name:'Bears'}],players,contracts,injuries});
const before=JSON.stringify(state);
const result=createExperimentalHighlightRecap(state,1,2,42);
assert.equal(result.kind,'experimental-highlight-recap');
assert.equal(result.official,false);
assert.equal(result.persistencePerformed,false);
assert.deepEqual(createExperimentalHighlightRecap(state,1,2,42),result);
if(result.researchReady){
 assert.equal(result.recap.highlightCount,result.recap.periods.reduce((n,p)=>n+p.highlights,0));
 assert.equal(result.recap.periodsWithHighlights,result.recap.periods.length);
 assert(result.recap.periods.every(p=>p.highlights>0));
}else{assert.equal(result.recap,null);assert(Array.isArray(result.blockers));}
assert.equal(JSON.stringify(state),before);
console.log('Batch 925-932 experimental highlight recap tests passed.');
